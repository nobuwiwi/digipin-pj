#!/bin/sh
set -e

# Write runtime config.js with the API URL from the environment.
# This runs at container start, so changing API_BASE_URL in Railway
# and redeploying is enough — no rebuild needed.
cat > dist/config.js <<EOF
window.__APP_CONFIG__ = { API_BASE_URL: "${API_BASE_URL:-}" };
EOF

echo "config.js written with API_BASE_URL=${API_BASE_URL:-<empty>}"

exec npx --yes serve@latest dist -l "$PORT" --single
