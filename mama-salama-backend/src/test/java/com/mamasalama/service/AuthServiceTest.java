package com.mamasalama.service;

import com.mamasalama.config.KeycloakAdminClient;
import com.mamasalama.dto.request.CompleteInviteRequest;
import com.mamasalama.entity.DoctorInvitation;
import com.mamasalama.entity.User;
import com.mamasalama.enums.InviteCodeStatus;
import com.mamasalama.enums.Role;
import com.mamasalama.exception.AuthException;
import com.mamasalama.exception.ValidationException;
import com.mamasalama.repository.DoctorInvitationRepository;
import com.mamasalama.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private DoctorInvitationRepository doctorInvitationRepository;
    @Mock private KeycloakAdminClient keycloakAdminClient;

    @InjectMocks
    private AuthService authService;

    private DoctorInvitation validInvite;

    @BeforeEach
    void setUp() {
        validInvite = DoctorInvitation.builder()
                .token("valid-token")
                .email("doctor@test.ma")
                .firstName("Fatima")
                .lastName("Zahra")
                .status(InviteCodeStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
    }

    @Test
    @DisplayName("valid invite → creates Keycloak user and saves local User")
    void completeInvite_success() {
        CompleteInviteRequest req = new CompleteInviteRequest("valid-token", "SecurePass1!", null);

        when(doctorInvitationRepository.findByTokenAndStatusAndExpiresAtAfter(
                eq("valid-token"), eq(InviteCodeStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(Optional.of(validInvite));
        when(userRepository.existsByEmail("doctor@test.ma")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(doctorInvitationRepository.save(any(DoctorInvitation.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.completeInvite(req);

        verify(keycloakAdminClient).createUser("doctor@test.ma", "SecurePass1!", "Fatima", "Zahra", "DOCTOR");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("expired or invalid token → throws ValidationException")
    void completeInvite_invalidToken_throwsValidationException() {
        CompleteInviteRequest req = new CompleteInviteRequest("bad-token", "SecurePass1!", null);

        when(doctorInvitationRepository.findByTokenAndStatusAndExpiresAtAfter(
                eq("bad-token"), eq(InviteCodeStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.completeInvite(req))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("invalid or has expired");
    }

    @Test
    @DisplayName("email already registered → throws AuthException")
    void completeInvite_duplicateEmail_throwsAuthException() {
        CompleteInviteRequest req = new CompleteInviteRequest("valid-token", "SecurePass1!", null);

        when(doctorInvitationRepository.findByTokenAndStatusAndExpiresAtAfter(
                eq("valid-token"), eq(InviteCodeStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(Optional.of(validInvite));
        when(userRepository.existsByEmail("doctor@test.ma")).thenReturn(true);

        assertThatThrownBy(() -> authService.completeInvite(req))
                .isInstanceOf(AuthException.class)
                .hasMessageContaining("already exists");
    }
}
