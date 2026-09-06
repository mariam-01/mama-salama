package com.mamasalama.service;


import com.mamasalama.dto.request.DoctorInviteRequest;

import com.mamasalama.dto.response.InviteCodeResponse;
import com.mamasalama.entity.InviteCode;
import com.mamasalama.entity.User;

import com.mamasalama.enums.InviteCodeStatus;

import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.exception.ValidationException;
import com.mamasalama.mapper.InviteCodeMapper;

import com.mamasalama.repository.InviteCodeRepository;

import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.beans.factory.annotation.Value;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;


@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    @Value("${application.frontend-url}")
    private String frontendUrl;

    private final UserRepository userRepository;
    private final InviteCodeRepository inviteCodeRepository;
    private final EmailService emailService;
    private final InviteCodeMapper inviteCodeMapper;

    @Transactional
    public InviteCodeResponse sendInvite(DoctorInviteRequest request, String adminEmail) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("A user with this email is already registered");
        }
        if (inviteCodeRepository.existsByEmailAndStatus(request.getEmail(), InviteCodeStatus.PENDING)) {
            throw new ValidationException("A pending invite has already been sent to this email");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        String token = generateSecureToken();

        InviteCode inviteCode = InviteCode.builder()
                .token(token)
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .city(request.getCity())
                .prefecture(request.getPrefecture())
                .region(request.getRegion())
                .hospital(request.getHospital())
                .specialty(request.getSpecialty())
                .status(InviteCodeStatus.PENDING)
                .createdBy(admin)
                .expiresAt(LocalDateTime.now().plusHours(48))
                .build();

        inviteCode = inviteCodeRepository.save(inviteCode);

        String inviteLink = frontendUrl + "/complete-registration?token=" + token;
        try {
            emailService.sendDoctorInviteEmail(request.getEmail(), request.getFirstName(), inviteLink);
        } catch (Exception e) {
            log.warn("Failed to send invite email to {}: {}", request.getEmail(), e.getMessage());
        }

        log.info("Invite sent to {} by {}", request.getEmail(), adminEmail);
        return inviteCodeMapper.toResponse(inviteCode);
    }

    @Transactional(readOnly = true)
    public List<InviteCodeResponse> listInviteCodes() {
        return inviteCodeMapper.toResponseList(inviteCodeRepository.findAll());
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}