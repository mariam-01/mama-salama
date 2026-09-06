package com.mamasalama.service;

import com.mamasalama.dto.request.EmergencyAlertRequest;
import com.mamasalama.dto.response.EmergencyAlertResponse;
import com.mamasalama.entity.EmergencyAlert;
import com.mamasalama.entity.PatientProfile;
import com.mamasalama.entity.User;
import com.mamasalama.enums.Role;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.mapper.EmergencyAlertMapper;
import com.mamasalama.repository.EmergencyAlertRepository;
import com.mamasalama.repository.PatientProfileRepository;
import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;



@Slf4j
@Service
@RequiredArgsConstructor
public class EmergencyAlertService {

    private final PatientProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final EmergencyAlertRepository alertRepository;
    private final EmergencyAlertMapper alertMapper;

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


}