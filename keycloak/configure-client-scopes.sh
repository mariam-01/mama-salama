#!/usr/bin/env bash
# Assigns email and roles client scopes to mama-salama-frontend.
# Requires curl on the HOST (not inside the container).
# Usage: bash keycloak/configure-client-scopes.sh [admin_password]

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8090}"
ADMIN_PASS="${1:-${KEYCLOAK_ADMIN_PASSWORD:-admin}}"
REALM="mama-salama"
CLIENT_ID="mama-salama-frontend"

echo "→ Getting admin token from $KEYCLOAK_URL ..."
TOKEN=$(curl -sf -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=admin-cli&username=admin&password=$ADMIN_PASS" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then
  echo "✗ Failed to get admin token"
  exit 1
fi
echo "✓ Token obtained"

# Get client UUID
CLIENT_UUID=$(curl -sf "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])")

echo "✓ Client UUID: $CLIENT_UUID"

# Ensure roles scope exists with realm-roles mapper
SCOPES=$(curl -sf "$KEYCLOAK_URL/admin/realms/$REALM/client-scopes" -H "Authorization: Bearer $TOKEN")
ROLES_ID=$(echo "$SCOPES" | python3 -c "import sys, json; scopes=json.load(sys.stdin); s=[x for x in scopes if x['name']=='roles']; print(s[0]['id'] if s else '')")

if [ -z "$ROLES_ID" ]; then
  echo "→ Creating 'roles' scope ..."
  ROLES_ID=$(curl -sf -X POST "$KEYCLOAK_URL/admin/realms/$REALM/client-scopes" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"roles","protocol":"openid-connect","attributes":{"include.in.token.scope":"true"}}' \
    -i | grep -i Location | grep -o '[a-f0-9-]\{36\}$')

  # Add realm roles mapper
  curl -sf -X POST "$KEYCLOAK_URL/admin/realms/$REALM/client-scopes/$ROLES_ID/protocol-mappers/models" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"realm roles","protocol":"openid-connect","protocolMapper":"oidc-usermodel-realm-role-mapper","consentRequired":false,"config":{"user.attribute":"foo","introspection.token.claim":"true","access.token.claim":"true","claim.name":"realm_access.roles","jsonType.label":"String","multivalued":"true"}}' \
    && echo "✓ Realm roles mapper added"
fi

EMAIL_ID=$(echo "$SCOPES" | python3 -c "import sys, json; scopes=json.load(sys.stdin); s=[x for x in scopes if x['name']=='email']; print(s[0]['id'] if s else '')")

for SCOPE_ID in $EMAIL_ID $ROLES_ID; do
  [ -z "$SCOPE_ID" ] && continue
  HTTP=$(curl -sf -o /dev/null -w "%{http_code}" -X PUT \
    "$KEYCLOAK_URL/admin/realms/$REALM/clients/$CLIENT_UUID/default-client-scopes/$SCOPE_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "  Scope $SCOPE_ID → HTTP $HTTP"
done

echo "✓ Done — new tokens will include email + realm_access.roles"
