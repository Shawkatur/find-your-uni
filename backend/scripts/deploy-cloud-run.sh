#!/usr/bin/env bash
# Deploy the backend to Google Cloud Run.
#
# Prerequisites:
#   1. gcloud CLI installed and authenticated (`gcloud auth login`)
#   2. A GCP project with billing enabled
#   3. APIs enabled (this script enables them on first run)
#   4. A `.env.cloudrun` file in this directory containing the env vars to set
#      on the service (KEY=VALUE per line, no quotes). Secrets should ideally
#      live in Secret Manager — see README — but env vars work for bootstrap.
#
# Usage:
#   PROJECT_ID=my-gcp-project ./scripts/deploy-cloud-run.sh
#
# Optional overrides:
#   REGION=asia-south1
#   SERVICE=find-your-uni-api
#   REPO=find-your-uni

set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID env var (your GCP project id)}"
REGION="${REGION:-asia-south1}"
SERVICE="${SERVICE:-find-your-uni-api}"
REPO="${REPO:-find-your-uni}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:$(date +%Y%m%d-%H%M%S)"

cd "$(dirname "$0")/.."

echo "==> Project: ${PROJECT_ID}  Region: ${REGION}  Service: ${SERVICE}"

# 1. Enable required APIs (idempotent)
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project "${PROJECT_ID}"

# 2. Create Artifact Registry repo if missing
if ! gcloud artifacts repositories describe "${REPO}" \
      --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "==> Creating Artifact Registry repo ${REPO}"
  gcloud artifacts repositories create "${REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --project="${PROJECT_ID}"
fi

# 3. Build & push image via Cloud Build (no local Docker required)
echo "==> Building image ${IMAGE}"
gcloud builds submit \
  --tag "${IMAGE}" \
  --project "${PROJECT_ID}"

# 4. Build env var flags from .env.cloudrun if present
ENV_FLAGS=()
ENV_FILE="scripts/.env.cloudrun"
if [[ -f "${ENV_FILE}" ]]; then
  # Use --env-vars-file (yaml) for safety with values that contain commas
  YAML_TMP="$(mktemp)"
  trap 'rm -f "${YAML_TMP}"' EXIT
  while IFS='=' read -r k v; do
    [[ -z "${k}" || "${k}" =~ ^# ]] && continue
    # YAML single-quoted scalar: escape any embedded ' by doubling.
    # Single quotes do not interpret backslash escapes — safe for regex values.
    esc=${v//\'/\'\'}
    printf "%s: '%s'\n" "${k}" "${esc}" >> "${YAML_TMP}"
  done < "${ENV_FILE}"
  ENV_FLAGS+=(--env-vars-file "${YAML_TMP}")
else
  echo "WARN: ${ENV_FILE} not found — deploying without env vars."
fi

# 5. Deploy to Cloud Run
echo "==> Deploying to Cloud Run"
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --timeout 300 \
  "${ENV_FLAGS[@]}"

# 6. Print the URL
URL=$(gcloud run services describe "${SERVICE}" \
  --region "${REGION}" --project "${PROJECT_ID}" \
  --format='value(status.url)')
echo
echo "==> Deployed: ${URL}"
echo "    Health check: ${URL}/health"
