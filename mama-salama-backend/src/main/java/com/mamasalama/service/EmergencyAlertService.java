package com.mamasalama.service;

import com.mamasalama.dto.request.EmergencyAlertRequest;
import com.mamasalama.dto.response.EmergencyAlertResponse;
import com.mamasalama.entity.EmergencyAlert;
import com.mamasalama.entity.PatientProfile;
import com.mamasalama.entity.User;
import com.mamasalama.enums.AlertStatus;
import com.mamasalama.enums.Role;
import com.mamasalama.exception.AuthException;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.exception.ValidationException;
import com.mamasalama.mapper.EmergencyAlertMapper;
import com.mamasalama.repository.EmergencyAlertRepository;
import com.mamasalama.repository.PatientProfileRepository;
import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmergencyAlertService {

    private final PatientProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final EmergencyAlertRepository alertRepository;
    private final EmergencyAlertMapper alertMapper;
    private final EmailService emailService;

    @Transactional
    public EmergencyAlertResponse createAlert(EmergencyAlertRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        PatientProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found — please complete your profile first"));

        String city = profile.getCity();
        String prefecture = profile.getPrefecture();
        String region = profile.getRegion();

        EmergencyAlert alert = EmergencyAlert.builder()
                .patient(profile)
                .source(request.getSource())
                .triggerMessage(request.getTriggerMessage())
                .patientCity(city)
                .patientPrefecture(prefecture)
                .patientRegion(region)
                .build();

        alert = alertRepository.save(alert);

        long matchedCount = userRepository.countDoctorsByLocation(Role.DOCTOR, city, prefecture, region);

        EmergencyAlertResponse response = alertMapper.toResponse(alert);
        response.setMatchedDoctorsCount((int) matchedCount);
        return response;
    }

    @Transactional(readOnly = true)
    public List<EmergencyAlertResponse> getPendingForDoctor(String email) {
        User doctor = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<EmergencyAlert> result = new ArrayList<>();
        Set<UUID> seen = new HashSet<>();


        if (doctor.getPrefecture() != null && !doctor.getPrefecture().isBlank()) {
            for (EmergencyAlert a : alertRepository.findPendingByPrefecture(AlertStatus.PENDING, doctor.getPrefecture())) {
                if (seen.add(a.getId())) result.add(a);
            }
        }

        if (doctor.getCity() != null && !doctor.getCity().isBlank()) {
            for (EmergencyAlert a : alertRepository.findPendingByCity(AlertStatus.PENDING, doctor.getCity())) {
                if (seen.add(a.getId())) result.add(a);
            }
        }

        if (doctor.getRegion() != null && !doctor.getRegion().isBlank()) {
            for (EmergencyAlert a : alertRepository.findPendingByRegion(AlertStatus.PENDING, doctor.getRegion())) {
                if (seen.add(a.getId())) result.add(a);
            }
        }

        return result.stream().map(alertMapper::toResponse).collect(Collectors.toList());
    }



}