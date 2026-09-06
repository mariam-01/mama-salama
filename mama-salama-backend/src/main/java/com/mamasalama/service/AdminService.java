package com.mamasalama.service;


import com.mamasalama.dto.request.DoctorCreateRequest;
import com.mamasalama.dto.request.DoctorInviteRequest;

import com.mamasalama.dto.request.UpdateUserStatusRequest;
import com.mamasalama.dto.response.AdminDoctorResponse;
import com.mamasalama.dto.response.AdminPatientResponse;
import com.mamasalama.dto.response.AdminStatsResponse;
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
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final InviteCodeMapper inviteCodeMapper;

    @Transactional(readOnly = true)
    public List<AdminDoctorResponse> getDoctors(String search) {
        List<User> doctors = (search != null && !search.isBlank())
                ? userRepository.findByRoleAndSearch(Role.DOCTOR, search)
                : userRepository.findByRole(Role.DOCTOR);
        return doctors.stream()
                .map(doctor -> AdminDoctorResponse.from(doctor, profileRepository.countByAssignedDoctor(doctor)))
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminDoctorResponse createDoctor(DoctorCreateRequest request, String adminEmail) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email already registered");
        }
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        String tempPassword = generateTempPassword();

        User doctor = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(tempPassword))
                .phone(request.getPhone())
                .city(request.getCity())
                .prefecture(request.getPrefecture())
                .region(request.getRegion())
                .specialty(request.getSpecialty())
                .role(Role.DOCTOR)
                .enabled(true)
                .build();

        doctor = userRepository.save(doctor);

        try {
            emailService.sendDoctorTempPasswordEmail(doctor.getEmail(), request.getFullName(), tempPassword);
        } catch (Exception e) {
            log.warn("Failed to send doctor temp password email: {}", e.getMessage());
        }

        long patientCount = profileRepository.countByAssignedDoctor(doctor);
        return AdminDoctorResponse.from(doctor, patientCount);
    }

    @Transactional
    public AdminDoctorResponse updateDoctorStatus(UUID doctorId, UpdateUserStatusRequest request) {
        User user = userRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        if (user.getRole() != Role.DOCTOR) {
            throw new ValidationException("User is not a doctor");
        }
        user.setEnabled(request.getActive());
        userRepository.save(user);
        return AdminDoctorResponse.from(user, profileRepository.countByAssignedDoctor(user));
    }

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

    private String generateTempPassword() {
        byte[] bytes = new byte[12];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}