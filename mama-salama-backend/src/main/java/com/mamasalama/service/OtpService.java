package com.mamasalama.service;

import com.mamasalama.entity.OtpToken;
import com.mamasalama.entity.User;
import com.mamasalama.enums.OtpChannel;
import com.mamasalama.exception.AuthException;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.repository.OtpTokenRepository;
import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final int TTL_MINUTES = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpTokenRepository otpTokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SmsService smsService;

    @Transactional
    public void generateAndSend(User user, OtpChannel channel) {
        otpTokenRepository.invalidateUserOtps(user.getId());
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        otpTokenRepository.save(OtpToken.builder()
                .user(user)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(TTL_MINUTES))
                .build());

        if (channel == OtpChannel.SMS && user.getPhone() != null) {
            smsService.sendOtp(user.getPhone(), code);
        } else {
            emailService.sendOtp(user.getEmail(), code);
        }
        log.info("OTP sent to {} via {}", user.getEmail(), channel);
    }

    @Transactional
    public void generateAndSendPasswordReset(User user, OtpChannel channel) {
        otpTokenRepository.invalidateUserOtps(user.getId());
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        otpTokenRepository.save(OtpToken.builder()
                .user(user)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(TTL_MINUTES))
                .build());

        if (channel == OtpChannel.SMS && user.getPhone() != null) {
            smsService.sendOtp(user.getPhone(), code);
        } else {
            emailService.sendPasswordResetOtp(user.getEmail(), code);
        }
        log.info("Password-reset OTP sent to {} via {}", user.getEmail(), channel);
    }

    @Transactional
    public void verifyOtpAndEnable(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.isEnabled()) return; // already verified, idempotent

        OtpToken otp = otpTokenRepository
                .findValidOtpByEmail(email, code, LocalDateTime.now())
                .orElseThrow(() -> new AuthException("Code OTP invalide ou expiré"));

        otp.setUsed(true);
        otpTokenRepository.save(otp);
        user.setEnabled(true);
        userRepository.save(user);
        log.info("Account verified for {}", email);
    }

    @Transactional
    public OtpToken verifyOtpForPasswordReset(String email, String code) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return otpTokenRepository
                .findValidOtpByEmail(email, code, LocalDateTime.now())
                .orElseThrow(() -> new AuthException("Code OTP invalide ou expiré"));
    }
}
