"""
Raw SQL helpers executed via the Supabase PostgREST client or direct psycopg2.
For complex matchmaking queries we build raw SQL rather than chaining ORM calls.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any
from supabase import AsyncClient


async def get_match_settings(client: AsyncClient) -> dict:
    """Return the most recently updated match_settings row."""
    res = await (
        client.table("match_settings")
        .select("*")
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    if not res.data:
        return {
            "weight_ranking": 0.30,
            "weight_cost_efficiency": 0.40,
            "weight_bd_acceptance": 0.30,
            "ai_top_n": 10,
            "filter_budget_buffer": 0.10,
        }
    return res.data[0]


# Common country name → ISO 3166-1 alpha-2 mapping (case-insensitive keys)
_COUNTRY_ISO: dict[str, str] = {
    "usa": "US", "united states": "US", "america": "US", "us": "US",
    "uk": "GB", "united kingdom": "GB", "england": "GB", "britain": "GB", "gb": "GB",
    "canada": "CA", "ca": "CA",
    "germany": "DE", "de": "DE",
    "australia": "AU", "au": "AU",
    "singapore": "SG", "sg": "SG",
    "netherlands": "NL", "nl": "NL", "holland": "NL",
    "sweden": "SE", "se": "SE",
    "new zealand": "NZ", "nz": "NZ",
    "japan": "JP", "jp": "JP",
    "france": "FR", "fr": "FR",
    "italy": "IT", "it": "IT",
    "ireland": "IE", "ie": "IE",
    "malaysia": "MY", "my": "MY",
    "south korea": "KR", "korea": "KR", "kr": "KR",
}


def _normalize_countries(countries: list[str]) -> list[str]:
    """Convert country names or mixed-case codes to ISO alpha-2."""
    result = []
    for c in countries:
        key = c.strip().lower()
        result.append(_COUNTRY_ISO.get(key, c.strip().upper()))
    return [c for c in result if c]


async def filter_programs(
    client: AsyncClient,
    budget_usd: int | None,
    countries: list[str],
    degree_level: str,
    ielts: float | None,
    gpa_pct: int | None,
    fields: list[str] | None,
    budget_buffer: float = 0.10,
) -> list[dict]:
    """
    Layer-1 deterministic filter.
    Returns matching programs with joined university data.
    """
    budget_usd = budget_usd or 20000  # safe default if missing
    max_budget = int(budget_usd * (1 + budget_buffer))
    countries = _normalize_countries(countries)

    if not countries:
        return []

    query = (
        client.table("programs")
        .select(
            "*, universities!inner(id, name, country, city, ranking_qs, ranking_the, "
            "tuition_usd_per_year, acceptance_rate_overall, acceptance_rate_bd, "
            "scholarships_available, max_scholarship_pct, website)"
        )
        .eq("is_active", True)
        .lte("tuition_usd_per_year", max_budget)
        .eq("degree_level", degree_level)
        .in_("universities.country", countries)
    )

    if fields:
        query = query.in_("field", fields)

    # IELTS / GPA JSONB filters applied in Python after fetch (PostgREST
    # does not support JSONB path filters via the REST API).
    res = await query.limit(200).execute()
    rows = res.data or []

    # Python-side JSONB requirement checks
    filtered = []
    for row in rows:
        reqs: dict = row.get("min_requirements") or {}
        min_ielts = reqs.get("ielts")
        min_gpa   = reqs.get("gpa_pct")
        if min_ielts is not None and ielts is not None and ielts < min_ielts:
            continue
        if min_gpa is not None and gpa_pct is not None and gpa_pct < min_gpa:
            continue
        filtered.append(row)

    return filtered


async def get_student_by_user_id(client: AsyncClient, user_id: str) -> dict | None:
    res = await client.table("students").select("*").eq("user_id", user_id).limit(1).execute()
    return res.data[0] if res.data else None


async def get_application(client: AsyncClient, app_id: str) -> dict | None:
    res = await client.table("applications").select("*").eq("id", app_id).limit(1).execute()
    return res.data[0] if res.data else None


async def upsert_match_cache(
    client: AsyncClient, student_id: str, results: list[dict[str, Any]]
) -> None:
    await client.table("match_cache").upsert(
        {
            "student_id":    student_id,
            "match_results": results,
            "computed_at":   datetime.now(timezone.utc).isoformat(),
        }
    ).execute()


async def get_match_cache(client: AsyncClient, student_id: str) -> dict | None:
    res = await client.table("match_cache").select("*").eq("student_id", student_id).limit(1).execute()
    if not res.data:
        return None
    cache = res.data[0]
    # Check TTL — expire stale results
    computed_at = cache.get("computed_at")
    if computed_at:
        from app.core.config import get_settings
        ttl_hours = get_settings().MATCH_CACHE_TTL_HOURS
        computed = datetime.fromisoformat(computed_at.replace("Z", "+00:00"))
        if (datetime.now(timezone.utc) - computed).total_seconds() > ttl_hours * 3600:
            return None
    return cache
