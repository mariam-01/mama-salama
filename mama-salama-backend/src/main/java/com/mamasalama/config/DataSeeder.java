package com.mamasalama.config;

import com.mamasalama.entity.User;
import com.mamasalama.enums.Role;
import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final KeycloakAdminClient keycloakAdminClient;

    @Value("${application.admin.email}")
    private String adminEmail;

    @Value("${application.admin.password}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        try {
            keycloakAdminClient.ensureServiceAccountHasRealmAdmin();
        } catch (Exception e) {
            log.warn("Could not ensure service account realm-admin role: {}", e.getMessage());
        }
        seedLocalAdmin();
        seedKeycloakAdmin();
    }

    private void seedLocalAdmin() {
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Admin already exists in local DB — skipping seed");
            return;
        }
        User admin = User.builder()
                .email(adminEmail)
                .password("")
                .role(Role.ADMIN)
                .enabled(true)
                .build();
        userRepository.save(admin);
        log.info("Admin seeded in local DB: {}", adminEmail);
    }

    private void seedKeycloakAdmin() {
        try {
            if (!keycloakAdminClient.userExists(adminEmail)) {
                keycloakAdminClient.createUser(adminEmail, adminPassword, "Admin", "", "ADMIN");
                log.info("Admin seeded in Keycloak: {}", adminEmail);
            } else {
                log.info("Admin already exists in Keycloak — skipping Keycloak seed");
            }
        } catch (Exception e) {
            log.warn("Could not seed admin in Keycloak (Keycloak may not be ready): {}", e.getMessage());
        }
    }
}
