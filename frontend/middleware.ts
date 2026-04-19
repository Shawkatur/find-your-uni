import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ─── Route protection config ────────────────────────────────────────────────
// Maps route prefixes to the role(s) allowed to access them.
// Any prefix listed here requires authentication + matching role.
const ROLE_ROUTES: Record<string, string[]> = {
  "/student":    ["student"],
  "/consultant": ["consultant"],
  "/admin":      ["super_admin"],
};

const PROTECTED_PREFIXES = Object.keys(ROLE_ROUTES);
const AUTH_PAGES = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ─── 1. Protected routes: require auth + correct role ─────────────────────
  const matchedPrefix = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p));

  if (matchedPrefix) {
    // Not logged in → redirect to login with ?next= for post-login redirect
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Logged in but wrong role → forbidden
    const role = user.app_metadata?.role ?? "student";
    const allowedRoles = ROLE_ROUTES[matchedPrefix];
    if (!allowedRoles.includes(role)) {
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = "/auth/login";
      forbiddenUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // ─── 2. Auth pages: redirect already-authenticated users to dashboard ─────
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  if (isAuthPage && user) {
    const role = user.app_metadata?.role ?? "student";

    // Visiting a login page for a different role → sign out so they can switch
    const isLoginForDifferentRole =
      (pathname.startsWith("/auth/login/consultant") && role !== "consultant") ||
      (pathname.startsWith("/auth/login/student") && role !== "student");

    if (isLoginForDifferentRole) {
      await supabase.auth.signOut();
      return response;
    }

    // Redirect to role-specific dashboard
    if (role === "student" || role === "consultant") {
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = `/${role}/dashboard`;
      return NextResponse.redirect(dashUrl);
    }
  }

  return response;
}

// ─── Matcher: skip static files, images, and internal Next.js routes ────────
// This prevents the middleware from running on every asset request.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
