package com.mamasalama.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Wraps Keycloak Admin REST API calls needed to manage users from the backend.
 * Uses client_credentials grant with the mama-salama-backend service account.
 */
@Slf4j
@Component
public class KeycloakAdminClient {

    private final RestClient restClient;
    private final String realm;
    private final String adminClientId;
    private final String adminClientSecret;
    private final ObjectMapper objectMapper;

    public KeycloakAdminClient(
            @Value("${keycloak.server-url}") String serverUrl,
            @Value("${keycloak.realm}") String realm,
            @Value("${keycloak.admin-client-id}") String adminClientId,
            @Value("${keycloak.admin-client-secret}") String adminClientSecret,
            ObjectMapper objectMapper) {
        this.realm = realm;
        this.adminClientId = adminClientId;
        this.adminClientSecret = adminClientSecret;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create(serverUrl);
    }

    private String getAdminToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", adminClientId);
        form.add("client_secret", adminClientSecret);

        String body = restClient.post()
                .uri("/realms/{realm}/protocol/openid-connect/token", realm)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(String.class);

        try {
            return objectMapper.readTree(body).get("access_token").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to obtain Keycloak admin token", e);
        }
    }

    public String createUser(String email, String password, String firstName, String lastName,
                             String roleName) {
        return createUser(email, password, firstName, lastName, roleName, false);
    }

    public String createUser(String email, String password, String firstName, String lastName,
                             String roleName, boolean temporaryPassword) {
        String token = getAdminToken();

        Map<String, Object> userRep = Map.of(
                "email", email,
                "username", email,
                "enabled", true,
                "emailVerified", true,
                "firstName", firstName != null ? firstName : "",
                "lastName", lastName != null ? lastName : "",
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", password,
                        "temporary", temporaryPassword
                ))
        );

        var response = restClient.post()
                .uri("/admin/realms/{realm}/users", realm)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(userRep)
                .retrieve()
                .toBodilessEntity();

        String location = response.getHeaders().getFirst(HttpHeaders.LOCATION);
        if (location == null) throw new RuntimeException("Keycloak returned no Location header for new user");
        String userId = location.substring(location.lastIndexOf('/') + 1);

        assignRealmRole(userId, roleName, token);
        return userId;
    }

    public boolean userExists(String email) {
        try {
            String token = getAdminToken();
            String body = restClient.get()
                    .uri("/admin/realms/{realm}/users?email={email}&exact=true", realm, email)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .body(String.class);
            JsonNode arr = objectMapper.readTree(body);
            return arr.isArray() && arr.size() > 0;
        } catch (Exception e) {
            log.warn("Could not check Keycloak user existence for {}: {}", email, e.getMessage());
            return false;
        }
    }

    public void setUserEnabled(String email, boolean enabled) {
        try {
            String token = getAdminToken();
            String userId = getUserId(email, token);
            if (userId == null) {
                log.warn("Keycloak user not found for email {}, skipping enable/disable", email);
                return;
            }
            restClient.put()
                    .uri("/admin/realms/{realm}/users/{userId}", realm, userId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("enabled", enabled))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Could not set Keycloak user enabled={} for {}: {}", enabled, email, e.getMessage());
        }
    }

    private String getUserId(String email, String token) {
        try {
            String body = restClient.get()
                    .uri("/admin/realms/{realm}/users?email={email}&exact=true", realm, email)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .body(String.class);
            JsonNode arr = objectMapper.readTree(body);
            if (arr.isArray() && arr.size() > 0) return arr.get(0).get("id").asText();
        } catch (Exception e) {
            log.warn("Error fetching Keycloak user ID for {}: {}", email, e.getMessage());
        }
        return null;
    }

    public void resetPassword(String email, String newPassword) {
        String token = getAdminToken();
        String userId = getUserId(email, token);
        if (userId == null) throw new RuntimeException("Keycloak user not found for email: " + email);

        restClient.put()
                .uri("/admin/realms/{realm}/users/{userId}/reset-password", realm, userId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("type", "password", "value", newPassword, "temporary", false))
                .retrieve()
                .toBodilessEntity();
        log.info("Password reset in Keycloak for {}", email);
    }

    private void assignRealmRole(String userId, String roleName, String token) {
        try {
            String roleBody = restClient.get()
                    .uri("/admin/realms/{realm}/roles/{roleName}", realm, roleName)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .body(String.class);
            JsonNode role = objectMapper.readTree(roleBody);
            List<Map<String, String>> roles = List.of(Map.of(
                    "id", role.get("id").asText(),
                    "name", roleName
            ));
            restClient.post()
                    .uri("/admin/realms/{realm}/users/{userId}/role-mappings/realm", realm, userId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(roles)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.error("Failed to assign Keycloak role {} to user {}: {}", roleName, userId, e.getMessage());
        }
    }
}
