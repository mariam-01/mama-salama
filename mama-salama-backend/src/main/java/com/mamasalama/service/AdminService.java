package com.mamasalama.service;

import com.mamasalama.dto.response.EmergencyAlertResponse;
import com.mamasalama.mapper.EmergencyAlertMapper;
import com.mamasalama.dto.request.DoctorCreateRequest;
import com.mamasalama.dto.request.DoctorInviteRequest;
import com.mamasalama.dto.request.UpdateUserStatusRequest;
import com.mamasalama.dto.response.AdminDoctorResponse;
import com.mamasalama.dto.response.AdminPatientResponse;
import com.mamasalama.dto.response.AdminStatsResponse;
import com.mamasalama.dto.response.EmergencyAlertResponse;
import com.mamasalama.dto.response.InviteCodeResponse;
import com.mamasalama.entity.EmergencyAlert;
import com.mamasalama.entity.DoctorInvitation;
import com.mamasalama.entity.PatientProfile;
import com.mamasalama.entity.User;
import com.mamasalama.enums.AlertStatus;
import com.mamasalama.enums.AppointmentStatus;
import com.mamasalama.enums.InviteCodeStatus;
import com.mamasalama.enums.Role;
import com.mamasalama.exception.AuthException;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.exception.ValidationException;
import com.mamasalama.mapper.InviteCodeMapper;
import com.mamasalama.repository.AppointmentRepository;
import com.mamasalama.repository.EmergencyAlertRepository;
import com.mamasalama.repository.DoctorInvitationRepository;
import com.mamasalama.repository.KnowledgeBaseDocumentRepository;
import com.mamasalama.repository.PatientProfileRepository;
import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.beans.factory.annotation.Value;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    @Value("${application.frontend-url}")
    private String frontendUrl;

    private final UserRepository userRepository;
    private final PatientProfileRepository profileRepository;
    private final EmergencyAlertRepository alertRepository;
    private final AppointmentRepository appointmentRepository;
    private final KnowledgeBaseDocumentRepository documentRepository;
    private final DoctorInvitationRepository doctorInvitationRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final InviteCodeMapper inviteCodeMapper;
    private final EmergencyAlertMapper alertMapper;

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .patientCount(userRepository.countByRole(Role.PATIENT))
                .doctorCount(userRepository.countByRole(Role.DOCTOR))
                .pendingAlertCount(alertRepository.countByStatus(AlertStatus.PENDING))
                .proposedAppointmentCount(appointmentRepository.countByStatus(AppointmentStatus.PROPOSED))
                .documentCount(documentRepository.count())
                .build();
    }

    @Transactional(readOnly = true)
    public List<EmergencyAlertResponse> getAlerts(AlertStatus status) {
        List<EmergencyAlert> alerts = status != null
                ? alertRepository.findByStatusOrderByCreatedAtDesc(status)
                : alertRepository.findAllByOrderByCreatedAtDesc();
        return alerts.stream().map(alertMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminPatientResponse> getPatients(String search) {
        List<User> users = (search != null && !search.isBlank())
                ? userRepository.findByRoleAndSearch(Role.PATIENT, search)
                : userRepository.findByRole(Role.PATIENT);
        return users.stream()
                .map(user -> {
                    PatientProfile profile = profileRepository.findByUser(user).orElse(null);
                    return AdminPatientResponse.from(user, profile);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminPatientResponse updatePatientStatus(UUID patientId, UpdateUserStatusRequest request) {
        User user = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        if (user.getRole() != Role.PATIENT) {
            throw new ValidationException("User is not a patient");
        }
        user.setEnabled(request.getActive());
        userRepository.save(user);
        PatientProfile profile = profileRepository.findByUser(user).orElse(null);
        return AdminPatientResponse.from(user, profile);
    }


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
        if (doctorInvitationRepository.existsByEmailAndStatus(request.getEmail(), InviteCodeStatus.PENDING)) {
            throw new ValidationException("A pending invite has already been sent to this email");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        String token = generateSecureToken();

        DoctorInvitation doctorInvitation = DoctorInvitation.builder()
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

        doctorInvitation = doctorInvitationRepository.save(doctorInvitation);

        String inviteLink = frontendUrl + "/complete-registration?token=" + token;
        try {
            emailService.sendDoctorInviteEmail(request.getEmail(), request.getFirstName(), inviteLink);
        } catch (Exception e) {
            log.warn("Failed to send invite email to {}: {}", request.getEmail(), e.getMessage());
        }

        log.info("Invite sent to {} by {}", request.getEmail(), adminEmail);
        return inviteCodeMapper.toResponse(doctorInvitation);
    }

    @Transactional(readOnly = true)
    public List<InviteCodeResponse> listInviteCodes() {
        return inviteCodeMapper.toResponseList(doctorInvitationRepository.findAll());
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