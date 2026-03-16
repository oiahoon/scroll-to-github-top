#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PACKAGE_FILE="${PACKAGE_FILE:-}"
PUBLISH_TYPE="${CWS_PUBLISH_TYPE:-DEFAULT_PUBLISH}"
SKIP_REVIEW="${CWS_SKIP_REVIEW:-false}"
DEPLOY_PERCENTAGE="${CWS_DEPLOY_PERCENTAGE:-}"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

require_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "Missing required command: $name" >&2
    exit 1
  fi
}

require_env CWS_EXTENSION_ID
require_env CWS_PUBLISHER_ID
require_env CWS_SERVICE_ACCOUNT_JSON
require_command curl
require_command jq
require_command openssl

if [[ -z "$PACKAGE_FILE" ]]; then
  PACKAGE_FILE="$("$ROOT_DIR/scripts/package_extension.sh")"
fi

if [[ ! -f "$PACKAGE_FILE" ]]; then
  echo "Package file not found: $PACKAGE_FILE" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

SERVICE_ACCOUNT_FILE="$TMP_DIR/service-account.json"
KEY_FILE="$TMP_DIR/private_key.pem"
TOKEN_RESPONSE_FILE="$TMP_DIR/token-response.json"
UPLOAD_RESPONSE_FILE="$TMP_DIR/upload-response.json"
STATUS_RESPONSE_FILE="$TMP_DIR/status-response.json"
PUBLISH_RESPONSE_FILE="$TMP_DIR/publish-response.json"

printf '%s' "$CWS_SERVICE_ACCOUNT_JSON" > "$SERVICE_ACCOUNT_FILE"

CLIENT_EMAIL="$(jq -r '.client_email' "$SERVICE_ACCOUNT_FILE")"
PRIVATE_KEY="$(jq -r '.private_key' "$SERVICE_ACCOUNT_FILE")"
TOKEN_URI="$(jq -r '.token_uri // "https://oauth2.googleapis.com/token"' "$SERVICE_ACCOUNT_FILE")"

if [[ -z "$CLIENT_EMAIL" || "$CLIENT_EMAIL" == "null" ]]; then
  echo "Service account JSON is missing client_email" >&2
  exit 1
fi

if [[ -z "$PRIVATE_KEY" || "$PRIVATE_KEY" == "null" ]]; then
  echo "Service account JSON is missing private_key" >&2
  exit 1
fi

printf '%s\n' "$PRIVATE_KEY" > "$KEY_FILE"

base64url() {
  openssl base64 -A | tr '+/' '-_' | tr -d '='
}

JWT_HEADER="$(printf '{"alg":"RS256","typ":"JWT"}' | base64url)"
NOW="$(date +%s)"
EXP="$((NOW + 3600))"
JWT_CLAIMS="$(jq -cn \
  --arg iss "$CLIENT_EMAIL" \
  --arg aud "$TOKEN_URI" \
  --arg scope "https://www.googleapis.com/auth/chromewebstore" \
  --argjson iat "$NOW" \
  --argjson exp "$EXP" \
  '{iss: $iss, scope: $scope, aud: $aud, iat: $iat, exp: $exp}')"
JWT_PAYLOAD="$(printf '%s' "$JWT_CLAIMS" | base64url)"
JWT_UNSIGNED="${JWT_HEADER}.${JWT_PAYLOAD}"
JWT_SIGNATURE="$(printf '%s' "$JWT_UNSIGNED" | openssl dgst -sha256 -sign "$KEY_FILE" | base64url)"
JWT_ASSERTION="${JWT_UNSIGNED}.${JWT_SIGNATURE}"

curl -fsS \
  -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" \
  --data-urlencode "assertion=${JWT_ASSERTION}" \
  "$TOKEN_URI" \
  > "$TOKEN_RESPONSE_FILE"

ACCESS_TOKEN="$(jq -r '.access_token' "$TOKEN_RESPONSE_FILE")"
if [[ -z "$ACCESS_TOKEN" || "$ACCESS_TOKEN" == "null" ]]; then
  echo "Failed to obtain access token" >&2
  cat "$TOKEN_RESPONSE_FILE" >&2
  exit 1
fi

ITEM_NAME="publishers/${CWS_PUBLISHER_ID}/items/${CWS_EXTENSION_ID}"
AUTH_HEADER="Authorization: Bearer ${ACCESS_TOKEN}"

curl -fsS \
  -X POST \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/zip" \
  --data-binary "@${PACKAGE_FILE}" \
  "https://chromewebstore.googleapis.com/upload/v2/${ITEM_NAME}:upload" \
  > "$UPLOAD_RESPONSE_FILE"

UPLOAD_STATE="$(jq -r '.uploadState // empty' "$UPLOAD_RESPONSE_FILE")"
if [[ "$UPLOAD_STATE" == "UPLOAD_STATE_UNSPECIFIED" || -z "$UPLOAD_STATE" ]]; then
  echo "Unexpected upload response:" >&2
  cat "$UPLOAD_RESPONSE_FILE" >&2
  exit 1
fi

ATTEMPTS=0
while [[ "$UPLOAD_STATE" == "IN_PROGRESS" || "$UPLOAD_STATE" == "UPLOAD_IN_PROGRESS" ]]; do
  ATTEMPTS="$((ATTEMPTS + 1))"
  if [[ "$ATTEMPTS" -gt 10 ]]; then
    echo "Timed out waiting for Chrome Web Store upload to finish" >&2
    exit 1
  fi

  sleep 3
  curl -fsS \
    -H "$AUTH_HEADER" \
    "https://chromewebstore.googleapis.com/v2/${ITEM_NAME}:fetchStatus" \
    > "$STATUS_RESPONSE_FILE"

  UPLOAD_STATE="$(jq -r '.lastAsyncUploadState // empty' "$STATUS_RESPONSE_FILE")"
done

if [[ "$UPLOAD_STATE" != "SUCCESS" ]]; then
  echo "Upload did not complete successfully" >&2
  cat "$UPLOAD_RESPONSE_FILE" >&2
  if [[ -s "$STATUS_RESPONSE_FILE" ]]; then
    cat "$STATUS_RESPONSE_FILE" >&2
  fi
  exit 1
fi

PUBLISH_PAYLOAD="$(jq -cn \
  --arg publishType "$PUBLISH_TYPE" \
  --argjson skipReview "$SKIP_REVIEW" \
  --arg deployPercentage "$DEPLOY_PERCENTAGE" '
    if $deployPercentage == "" then
      {
        publishType: $publishType,
        skipReview: $skipReview
      }
    else
      {
        publishType: $publishType,
        skipReview: $skipReview,
        deployInfos: [
          {
            deployPercentage: ($deployPercentage | tonumber)
          }
        ]
      }
    end
  ')"

curl -fsS \
  -X POST \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "$PUBLISH_PAYLOAD" \
  "https://chromewebstore.googleapis.com/v2/${ITEM_NAME}:publish" \
  > "$PUBLISH_RESPONSE_FILE"

echo "Upload succeeded: $PACKAGE_FILE"
cat "$PUBLISH_RESPONSE_FILE"
