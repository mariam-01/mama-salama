package com.mamasalama.service;

import com.mamasalama.dto.request.ForgotPasswordRequest;
import com.mamasalama.dto.request.LoginRequest;
import com.mamasalama.dto.request.OtpVerifyRequest;
import com.mamasalama.dto.request.RegisterRequest;
import com.mamasalama.dto.request.ResetPasswordRequest;
import com.mamasalama.dto.response.AuthResponse;
import com.mamasalama.dto.response.RegisterResponse;
import com.mamasalama.entity.OtpToken;
import com.mamasalama.entity.User;
import com.mamasalama.enums.OtpChannel;
import com.mamasalama.enums.Role;
import com.mamasalama.exception.AuthException;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.exception.ValidationException;
import com.mamasalama.repository.OtpTokenRepository;
import com.mamasalama.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private OtpTokenRepository otpTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private SmsService smsService;
    @Mock private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    private User enabledUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        enabledUser = User.builder()
                .email("fatima@test.ma")
                .password("hashed_password")
                .phone("+212600000001")
                .role(Role.PATIENT)
                .enabled(true)
                .build();
    }

    // ---------------------------------------------------------------- register
    @Nested
    @DisplayName("register")
    class Register {

        @Test
        @DisplayName("success with EMAIL channel → saves user and sends email OTP")
        void success_emailChannel() {
            RegisterRequest req = new RegisterRequest(
                    "new@test.ma", "password123", null, OtpChannel.EMAIL, Role.PATIENT, null);

            when(userRepository.existsByEmail("new@test.ma")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(otpTokenRepository.save(any(OtpToken.class))).thenAnswer(inv -> inv.getArgument(0));

            RegisterResponse response = authService.register(req);

            assertThat(response.getMessage()).contains("new@test.ma");
            verify(emailService).sendOtp(eq("new@test.ma"), anyString());
            verify(smsService, never()).sendOtp(any(), any());
        }

        @Test
        @DisplayName("success with SMS channel → saves user and sends SMS OTP")
        void success_smsChannel() {
            RegisterRequest req = new RegisterRequest(
                    "sms@test.ma", "password123", "+212600000002", OtpChannel.SMS, Role.PATIENT, null);

            when(userRepository.existsByEmail("sms@test.ma")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(otpTokenRepository.save(any(OtpToken.class))).thenAnswer(inv -> inv.getArgument(0));

            authService.register(req);

            verify(smsService).sendOtp(eq("+212600000002"), anyString());
            verify(emailService, never()).sendOtp(any(), any());
        }

        @Test
        @DisplayName("duplicate email → throws AuthException")
        void duplicateEmail_throwsAuthException() {
            RegisterRequest req = new RegisterRequest(
                    "fatima@test.ma", "password123", null, OtpChannel.EMAIL, Role.PATIENT, null);
            when(userRepository.existsByEmail("fatima@test.ma")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(req))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("already registered");
        }

        @Test
        @DisplayName("SMS channel without phone → throws ValidationException")
        void smsChannelMissingPhone_throwsValidationException() {
            RegisterRequest req = new RegisterRequest(
                    "new@test.ma", "password123", null, OtpChannel.SMS, Role.PATIENT, null);
            when(userRepository.existsByEmail("new@test.ma")).thenReturn(false);

            assertThatThrownBy(() -> authService.register(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Phone number is required");
        }

        @Test
        @DisplayName("saved user is not enabled until OTP verified")
        void savedUser_isDisabled() {
            RegisterRequest req = new RegisterRequest(
                    "new@test.ma", "pass", null, OtpChannel.EMAIL, Role.PATIENT, null);
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(otpTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            when(userRepository.save(userCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

            authService.register(req);

            assertThat(userCaptor.getValue().isEnabled()).isFalse();
        }
    }

    // ------------------------------------------------------------------- login
    @Nested
    @DisplayName("login")
    class Login {

        @Test
        @DisplayName("correct credentials → returns JWT token")
        void success() {
            LoginRequest req = new LoginRequest("fatima@test.ma", "password123");
            when(userRepository.findByEmail("fatima@test.ma")).thenReturn(Optional.of(enabledUser));
            when(passwordEncoder.matches("password123", "hashed_password")).thenReturn(true);
            when(jwtService.generateToken(enabledUser)).thenReturn("jwt-token");

            AuthResponse response = authService.login(req);

            assertThat(response.getToken()).isEqualTo("jwt-token");
            assertThat(response.getEmail()).isEqualTo("fatima@test.ma");
        }

        @Test
        @DisplayName("wrong password → throws AuthException")
        void wrongPassword_throwsAuthException() {
            LoginRequest req = new LoginRequest("fatima@test.ma", "wrong");
            when(userRepository.findByEmail("fatima@test.ma")).thenReturn(Optional.of(enabledUser));
            when(passwordEncoder.matches("wrong", "hashed_password")).thenReturn(false);

            assertThatThrownBy(() -> authService.login(req))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("Invalid credentials");
        }

        @Test
        @DisplayName("unknown email → throws AuthException")
        void unknownEmail_throwsAuthException() {
            LoginRequest req = new LoginRequest("unknown@test.ma", "password123");
            when(userRepository.findByEmail("unknown@test.ma")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(req))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("Invalid credentials");
        }

        @Test
        @DisplayName("account not verified → throws AuthException")
        void accountNotVerified_throwsAuthException() {
            User unverified = User.builder()
                    .email("unverified@test.ma")
                    .password("hashed")
                    .role(Role.PATIENT)
                    .enabled(false)
                    .build();
            LoginRequest req = new LoginRequest("unverified@test.ma", "password123");
            when(userRepository.findByEmail("unverified@test.ma")).thenReturn(Optional.of(unverified));
            when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);

            assertThatThrownBy(() -> authService.login(req))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("not verified");
        }
    }

    // --------------------------------------------------------------- verifyOtp
    @Nested
    @DisplayName("verifyOtp")
    class VerifyOtp {

        @Test
        @DisplayName("valid OTP → enables user and returns token")
        void success() {
            OtpVerifyRequest req = new OtpVerifyRequest(userId, "123456");
            OtpToken otp = OtpToken.builder()
                    .user(enabledUser)
                    .code("123456")
                    .expiresAt(LocalDateTime.now().plusMinutes(5))
                    .used(false)
                    .build();
            User disabledUser = User.builder()
                    .email("fatima@test.ma")
                    .password("hashed")
                    .role(Role.PATIENT)
                    .enabled(false)
                    .build();

            when(otpTokenRepository.findValidOtp(eq(userId), eq("123456"), any(LocalDateTime.class)))
                    .thenReturn(Optional.of(otp));
            when(userRepository.findById(userId)).thenReturn(Optional.of(disabledUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(otpTokenRepository.save(any(OtpToken.class))).thenAnswer(inv -> inv.getArgument(0));
            when(jwtService.generateToken(any(User.class))).thenReturn("jwt-token");

            AuthResponse response = authService.verifyOtp(req);

            assertThat(response.getToken()).isEqualTo("jwt-token");
            assertThat(otp.isUsed()).isTrue();

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().isEnabled()).isTrue();
        }

        @Test
        @DisplayName("invalid or expired OTP → throws AuthException")
        void invalidOtp_throwsAuthException() {
            OtpVerifyRequest req = new OtpVerifyRequest(userId, "000000");
            when(otpTokenRepository.findValidOtp(eq(userId), eq("000000"), any(LocalDateTime.class)))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.verifyOtp(req))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("Invalid or expired OTP");
        }
    }

    // --------------------------------------------------------- forgotPassword
    @Nested
    @DisplayName("forgotPassword")
    class ForgotPassword {

        @Test
        @DisplayName("known email → invalidates old OTPs and sends new one")
        void success() {
            ForgotPasswordRequest req = new ForgotPasswordRequest("fatima@test.ma", OtpChannel.EMAIL);
            when(userRepository.findByEmail("fatima@test.ma")).thenReturn(Optional.of(enabledUser));
            when(otpTokenRepository.save(any(OtpToken.class))).thenAnswer(inv -> inv.getArgument(0));

            authService.forgotPassword(req);

            verify(otpTokenRepository).invalidateUserOtps(enabledUser.getId());
            verify(emailService).sendPasswordResetOtp(eq("fatima@test.ma"), anyString());
        }

        @Test
        @DisplayName("unknown email → throws ResourceNotFoundException")
        void unknownEmail_throwsResourceNotFoundException() {
            ForgotPasswordRequest req = new ForgotPasswordRequest("ghost@test.ma", OtpChannel.EMAIL);
            when(userRepository.findByEmail("ghost@test.ma")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.forgotPassword(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ---------------------------------------------------------- resetPassword
    @Nested
    @DisplayName("resetPassword")
    class ResetPassword {

        @Test
        @DisplayName("valid OTP and matching passwords → resets password and returns token")
        void success() {
            ResetPasswordRequest req = new ResetPasswordRequest(userId, "123456", "NewPass1!", "NewPass1!");
            OtpToken otp = OtpToken.builder()
                    .user(enabledUser)
                    .code("123456")
                    .expiresAt(LocalDateTime.now().plusMinutes(5))
                    .used(false)
                    .build();

            when(otpTokenRepository.findValidOtp(eq(userId), eq("123456"), any(LocalDateTime.class)))
                    .thenReturn(Optional.of(otp));
            when(userRepository.findById(userId)).thenReturn(Optional.of(enabledUser));
            when(passwordEncoder.encode("NewPass1!")).thenReturn("new_hashed");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(otpTokenRepository.save(any(OtpToken.class))).thenAnswer(inv -> inv.getArgument(0));
            when(jwtService.generateToken(any(User.class))).thenReturn("jwt-token");

            AuthResponse response = authService.resetPassword(req);

            assertThat(response.getToken()).isEqualTo("jwt-token");
            verify(passwordEncoder).encode("NewPass1!");
        }

        @Test
        @DisplayName("passwords do not match → throws ValidationException")
        void passwordMismatch_throwsValidationException() {
            ResetPasswordRequest req = new ResetPasswordRequest(userId, "123456", "NewPass1!", "Different!");

            assertThatThrownBy(() -> authService.resetPassword(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("do not match");
        }

        @Test
        @DisplayName("invalid OTP → throws AuthException")
        void invalidOtp_throwsAuthException() {
            ResetPasswordRequest req = new ResetPasswordRequest(userId, "wrong", "NewPass1!", "NewPass1!");
            when(otpTokenRepository.findValidOtp(eq(userId), eq("wrong"), any(LocalDateTime.class)))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.resetPassword(req))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("Invalid or expired OTP");
        }
    }
}