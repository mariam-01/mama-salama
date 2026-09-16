#!/usr/bin/env bash
# Run once after Keycloak starts to make firstName/lastName optional in the mama-salama realm.
# Usage: bash keycloak/configure-user-profile.sh [admin_password]

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8090}"
ADMIN_PASS="${1:-${KEYCLOAK_ADMIN_PASSWORD:-admin}}"

echo "→ Getting admin token from $KEYCLOAK_URL ..."
TOKEN=$(curl -sf -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=admin-cli&username=admin&password=$ADMIN_PASS" \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "✗ Failed to get admin token — check credentials / Keycloak is running"
  exit 1
fi
echo "✓ Token obtained"

echo "→ Updating user profile: firstName and lastName → optional ..."
HTTP=$(curl -sf -o /dev/null -w "%{http_code}" -X PUT \
  "$KEYCLOAK_URL/admin/realms/mama-salama/users/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": [
      {"name":"username","displayName":"${username}","validations":{},"permissions":{"view":["admin","user"],"edit":["admin","user"]}},
      {"name":"email","displayName":"${email}","validations":{"email":{}},"required":{"roles":["user"]},"permissions":{"view":["admin","user"],"edit":["admin","user"]}},
      {"name":"firstName","displayName":"${firstName}","validations":{},"permissions":{"view":["admin","user"],"edit":["admin","user"]}},
      {"name":"lastName","displayName":"${lastName}","validations":{},"permissions":{"view":["admin","user"],"edit":["admin","user"]}}
    ]
  }')

if [ "$HTTP" = "200" ]; then
  echo "✓ User profile updated — registration with email+password only now works"
else
  echo "✗ Update failed (HTTP $HTTP)"
  exit 1
fi
