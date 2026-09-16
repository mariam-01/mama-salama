package com.mamasalama.filter;

import com.mamasalama.entity.User;
import com.mamasalama.enums.OtpChannel;
import com.mamasalama.enums.Role;
import com.mamasalama.repository.UserRepository;
import com.mamasalama.service.OtpService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * After Keycloak JWT validation, ensures a corresponding User entity exists in the local DB.
 * This handles first-time logins from users who registered via Keycloak directly.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserSyncFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final OtpService otpService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            String email = jwtAuth.getToken().getClaimAsString("email");
            if (email != null) {
                syncUser(email, jwtAuth);
            }
        }

        chain.doFilter(request, response);
    }

    private void syncUser(String email, JwtAuthenticationToken jwtAuth) {
        Role role = extractRole(jwtAuth);
        userRepository.findByEmail(email).ifPresentOrElse(
                existing -> {
                    if (existing.getRole() != role) {
                        existing.setRole(role);
                        userRepository.save(existing);
                    }
                },
                () -> {
                    try {
                        // Doctors and admins are pre-created by admin; patients must verify via OTP
                        boolean requiresOtp = role == Role.PATIENT;
                        User user = User.builder()
                                .email(email)
                                .password("")
                                .role(role)
                                .enabled(!requiresOtp)
                                .build();
                        userRepository.save(user);
                        if (requiresOtp) {
                            otpService.generateAndSend(user, OtpChannel.EMAIL);
                            log.info("New patient synced, OTP sent: {}", email);
                        } else {
                            log.info("Auto-synced Keycloak user to local DB: {}", email);
                        }
                    } catch (Exception e) {
                        log.debug("User already created concurrently for {}: {}", email, e.getMessage());
                    }
                }
        );
    }

    @SuppressWarnings("unchecked")
    private Role extractRole(JwtAuthenticationToken jwtAuth) {
        Map<String, Object> realmAccess = jwtAuth.getToken().getClaimAsMap("realm_access");
        if (realmAccess != null) {
            List<String> roles = (List<String>) realmAccess.get("roles");
            if (roles != null) {
                if (roles.contains("ADMIN")) return Role.ADMIN;
                if (roles.contains("DOCTOR")) return Role.DOCTOR;
            }
        }
        return Role.PATIENT;
    }
}
