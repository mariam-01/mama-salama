package com.mamasalama.service;

import com.mamasalama.config.KeycloakAdminClient;
import com.mamasalama.dto.request.CompleteInviteRequest;
import com.mamasalama.dto.request.ForgotPasswordRequest;
import com.mamasalama.dto.request.ResendOtpRequest;
import com.mamasalama.dto.request.ResetPasswordRequest;
import com.mamasalama.entity.DoctorInvitation;
import com.mamasalama.entity.OtpToken;
import com.mamasalama.entity.User;
import com.mamasalama.enums.InviteCodeStatus;
import com.mamasalama.enums.OtpChannel;
import com.mamasalama.enums.Role;
import com.mamasalama.exception.AuthException;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.exception.ValidationException;
import com.mamasalama.repository.DoctorInvitationRepository;
import com.mamasalama.repository.OtpTokenRepository;
import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DoctorInvitationRepository doctorInvitationRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final KeycloakAdminClient keycloakAdminClient;
    private final OtpService otpService;

    @Transactional
    public void completeInvite(CompleteInviteRequest request) {
        DoctorInvitation invite = doctorInvitationRepository
                .findByTokenAndStatusAndExpiresAtAfter(
                        request.getToken(), InviteCodeStatus.PENDING, LocalDateTime.now())
                .orElseThrow(() -> new ValidationException("Invite link is invalid or has expired"));

        if (userRepository.existsByEmail(invite.getEmail())) {
            throw new AuthException("An account with this email already exists");
        }

        String firstName = invite.getFirstName() != null ? invite.getFirstName() : "";
        String lastName = invite.getLastName() != null ? invite.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();

        keycloakAdminClient.createUser(invite.getEmail(), request.getPassword(),
                firstName, lastName, "DOCTOR");

        User doctor = User.builder()
                .email(invite.getEmail())
                .password("")
                .phone(request.getPhone())
                .fullName(fullName.isEmpty() ? null : fullName)
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
        doctorInvitationRepository.save(invite);

        log.info("Doctor account created via invite for {}", invite.getEmail());
    }

    @Transactional
    public void verifyOtp(String email, String code) {
        otpService.verifyOtpAndEnable(email, code);
    }

    @Transactional
    public void resendOtp(ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.isEnabled()) throw new AuthException("Account is already verified");
        otpService.generateAndSend(user, request.getChannel());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            OtpChannel channel = request.getOtpChannel() != null ? request.getOtpChannel() : OtpChannel.EMAIL;
            otpService.generateAndSendPasswordReset(user, channel);
        });
        // Always succeed — don't leak whether the email exists
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ValidationException("Passwords do not match");
        }
        OtpToken otp = otpService.verifyOtpForPasswordReset(request.getEmail(), request.getCode());
        otp.setUsed(true);
        otpTokenRepository.save(otp);
        keycloakAdminClient.resetPassword(request.getEmail(), request.getNewPassword());
        log.info("Password reset completed for {}", request.getEmail());
    }
}
