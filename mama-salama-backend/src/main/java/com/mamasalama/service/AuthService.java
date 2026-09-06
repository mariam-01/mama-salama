package com.mamasalama.service;

import com.mamasalama.dto.request.CompleteInviteRequest;
import com.mamasalama.dto.request.ForgotPasswordRequest;
import com.mamasalama.dto.request.LoginRequest;
import com.mamasalama.dto.request.OtpVerifyRequest;
import com.mamasalama.dto.request.RegisterRequest;
import com.mamasalama.dto.request.ResetPasswordRequest;
import com.mamasalama.dto.response.AuthResponse;
import com.mamasalama.dto.response.RegisterResponse;
import com.mamasalama.entity.InviteCode;
import com.mamasalama.entity.OtpToken;
import com.mamasalama.entity.User;
import com.mamasalama.enums.InviteCodeStatus;
import com.mamasalama.enums.OtpChannel;
import com.mamasalama.enums.Role;
import com.mamasalama.exception.AuthException;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.exception.ValidationException;
import com.mamasalama.repository.InviteCodeRepository;
import com.mamasalama.repository.OtpTokenRepository;
import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final InviteCodeRepository inviteCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SmsService smsService;
    private final EmailService emailService;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email already registered");
        }

        if (request.getOtpChannel() == OtpChannel.SMS && (request.getPhone() == null || request.getPhone().isBlank())) {
            throw new ValidationException("Phone number is required when OTP channel is SMS");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.PATIENT)
                .enabled(false)
                .build();

        user = userRepository.save(user);

        OtpToken otp = generateOtp(user);
        otpTokenRepository.save(otp);

        sendOtp(request.getOtpChannel(), user, otp.getCode());

        String destination = request.getOtpChannel() == OtpChannel.SMS ? user.getPhone() : user.getEmail();
        return RegisterResponse.builder()
                .userId(user.getId())
                .message("Verification code sent to " + destination)
                .build();
    }

    @Transactional
    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        log.debug("verifyOtp: start userId={}", request.getUserId());

        OtpToken otpToken = otpTokenRepository
                .findValidOtp(request.getUserId(), request.getCode(), LocalDateTime.now())
                .orElseThrow(() -> new AuthException("Invalid or expired OTP"));
        log.debug("verifyOtp: OTP found, loading user by id={}", request.getUserId());

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        log.debug("verifyOtp: user found email={}", user.getEmail());

        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        user.setEnabled(true);
        userRepository.save(user);
        log.debug("verifyOtp: user enabled, building response");

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthException("Invalid credentials");
        }

        if (!user.isEnabled()) {
            throw new AuthException("Account not verified. Please verify your OTP.");
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public RegisterResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email"));

        otpTokenRepository.invalidateUserOtps(user.getId());

        OtpToken otp = generateOtp(user);
        otpTokenRepository.save(otp);

        OtpChannel channel = request.getOtpChannel() != null ? request.getOtpChannel() : OtpChannel.EMAIL;
        sendPasswordResetOtp(channel, user, otp.getCode());

        return RegisterResponse.builder()
                .userId(user.getId())
                .message("Password reset code sent to " + user.getEmail())
                .build();
    }

    @Transactional
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ValidationException("Passwords do not match");
        }

        OtpToken otpToken = otpTokenRepository
                .findValidOtp(request.getUserId(), request.getCode(), LocalDateTime.now())
                .orElseThrow(() -> new AuthException("Invalid or expired OTP"));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password reset successfully for user {}", user.getEmail());
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse completeInvite(CompleteInviteRequest request) {
        InviteCode invite = inviteCodeRepository
                .findByTokenAndStatusAndExpiresAtAfter(request.getToken(), InviteCodeStatus.PENDING, LocalDateTime.now())
                .orElseThrow(() -> new ValidationException("Invite link is invalid or has expired"));

        if (userRepository.existsByEmail(invite.getEmail())) {
            throw new AuthException("An account with this email already exists");
        }

        String fullName = null;
        if (invite.getFirstName() != null || invite.getLastName() != null) {
            fullName = ((invite.getFirstName() != null ? invite.getFirstName() : "") + " "
                    + (invite.getLastName() != null ? invite.getLastName() : "")).trim();
        }

        User doctor = User.builder()
                .email(invite.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .fullName(fullName)
                .city(invite.getCity())
                .prefecture(invite.getPrefecture())
                .region(invite.getRegion())
                .hospital(invite.getHospital())
                .specialty(invite.getSpecialty())
                .role(Role.DOCTOR)
                .enabled(true)
                .build();

        doctor = userRepository.save(doctor);

        invite.setStatus(InviteCodeStatus.ACCEPTED);
        invite.setUsedBy(doctor);
        invite.setUsedAt(LocalDateTime.now());
        inviteCodeRepository.save(invite);

        log.info("Doctor account created via invite for {}", invite.getEmail());
        return buildAuthResponse(doctor);
    }

    @Transactional
    public void resendOtp(UUID userId, OtpChannel channel) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.isEnabled()) {
            throw new AuthException("Account is already verified");
        }

        if (channel == OtpChannel.SMS && (user.getPhone() == null || user.getPhone().isBlank())) {
            throw new ValidationException("No phone number on file. Use EMAIL channel instead.");
        }

        otpTokenRepository.invalidateUserOtps(userId);

        OtpToken otp = generateOtp(user);
        otpTokenRepository.save(otp);

        sendOtp(channel, user, otp.getCode());
    }

    private void sendOtp(OtpChannel channel, User user, String code) {
        try {
            if (channel == OtpChannel.SMS) {
                smsService.sendOtp(user.getPhone(), code);
            } else {
                emailService.sendOtp(user.getEmail(), code);
            }
            log.info("OTP sent via {} to {}", channel,
                    channel == OtpChannel.SMS ? user.getPhone() : user.getEmail());
        } catch (Exception e) {
            log.error("Error sending OTP via {}: {}", channel, e.getMessage());
            throw new RuntimeException("Failed to send OTP. Please try again.");
        }
    }

    private void sendPasswordResetOtp(OtpChannel channel, User user, String code) {
        try {
            if (channel == OtpChannel.SMS) {
                smsService.sendOtp(user.getPhone(), code);
            } else {
                emailService.sendPasswordResetOtp(user.getEmail(), code);
            }
            log.info("Password reset OTP sent via {} to {}", channel,
                    channel == OtpChannel.SMS ? user.getPhone() : user.getEmail());
        } catch (Exception e) {
            log.error("Error sending password reset OTP via {}: {}", channel, e.getMessage());
            throw new RuntimeException("Failed to send OTP. Please try again.");
        }
    }

    private AuthResponse buildAuthResponse(User user) {
 /*       try {
            if (!user.isEnabled()) {
                throw new AuthException("Account not verified. Please verify your OTP.");
            }
        } catch (Exception e) {
            log.error("Error during authentication: {}", e.getMessage());
            throw new RuntimeException("Authentication failed. Please try again.");
        }*/
        String token;
        try {
            token = jwtService.generateToken(user);

        } catch (Exception e) {
            log.error("Error during authentication: {}", e.getMessage());
            throw new AuthException("Authentication failed. Please try again.");
        }
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    private OtpToken generateOtp(User user) {
        String code = String.format("%06d", new Random().nextInt(1_000_000));
        return OtpToken.builder()
                .user(user)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();
    }
}