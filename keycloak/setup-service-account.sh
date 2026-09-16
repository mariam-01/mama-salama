#!/bin/sh
# Assigns realm-management roles to the mama-salama-backend service account.
# Run once after Keycloak first starts: docker exec <keycloak-container> sh /opt/keycloak/data/import/setup-service-account.sh
# Or run from host: bash keycloak/setup-service-account.sh
set -e

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8090}"
REALM="mama-salama"
ADMIN_USER="${KEYCLOAK_ADMIN:-admin}"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
CLIENT_ID="mama-salama-backend"

echo "Getting admin token..."
TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli&username=$ADMIN_USER&password=$ADMIN_PASS&grant_type=password" \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not get admin token. Is Keycloak running at $KEYCLOAK_URL?"
  exit 1
fi

echo "Getting service account user ID..."
SA_USER_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID" \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$SA_USER_ID" ]; then
  echo "ERROR: Client '$CLIENT_ID' not found in realm '$REALM'."
  exit 1
fi

SA_USER=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$KEYCLOAK_URL/admin/realms/$REALM/clients/$SA_USER_ID/service-account-user")
SA_ID=$(echo "$SA_USER" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Getting realm-management client ID..."
RM_CLIENT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=realm-management" \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Getting realm-admin role from realm-management..."
ROLES=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$KEYCLOAK_URL/admin/realms/$REALM/clients/$RM_CLIENT_ID/roles/realm-admin")
ROLE_ID=$(echo "$ROLES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
ROLE_NAME=$(echo "$ROLES" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Assigning realm-admin role to service account..."
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "[{\"id\":\"$ROLE_ID\",\"name\":\"$ROLE_NAME\"}]" \
  "$KEYCLOAK_URL/admin/realms/$REALM/users/$SA_ID/role-mappings/clients/$RM_CLIENT_ID"

echo ""
echo "Done! The mama-salama-backend service account now has realm-admin rights."
