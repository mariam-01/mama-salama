package com.mamasalama.service;

import com.mamasalama.dto.request.DoctorProfileUpdateRequest;
import com.mamasalama.dto.response.CheckupResponse;
import com.mamasalama.dto.response.DoctorPatientResponse;
import com.mamasalama.dto.response.DoctorProfileResponse;
import com.mamasalama.dto.response.PatientDetailResponse;
import com.mamasalama.dto.response.PatientProfileResponse;
import com.mamasalama.entity.Checkup;
import com.mamasalama.entity.PatientProfile;
import com.mamasalama.entity.User;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.exception.ValidationException;
import com.mamasalama.repository.CheckupRepository;
import com.mamasalama.repository.PatientProfileRepository;
import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final CheckupRepository checkupRepository;

    @Transactional(readOnly = true)
    public DoctorProfileResponse getProfile(String doctorEmail) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        return DoctorProfileResponse.from(doctor);
    }

    @Transactional
    public DoctorProfileResponse updateProfile(String doctorEmail, DoctorProfileUpdateRequest request) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        if (request.getFullName() != null) doctor.setFullName(request.getFullName());
        if (request.getSpecialty() != null) doctor.setSpecialty(request.getSpecialty());
        if (request.getHospital() != null) doctor.setHospital(request.getHospital());
        if (request.getRegion() != null) doctor.setRegion(request.getRegion());
        if (request.getPrefecture() != null) doctor.setPrefecture(request.getPrefecture());
        if (request.getCity() != null) doctor.setCity(request.getCity());
        return DoctorProfileResponse.from(userRepository.save(doctor));
    }

    @Transactional(readOnly = true)
    public List<DoctorPatientResponse> getMyPatients(String doctorEmail) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        return patientProfileRepository.findByAssignedDoctor(doctor).stream()
                .map(profile -> {
                    Checkup last = checkupRepository
                            .findFirstByPatientOrderByCreatedAtDesc(profile.getUser()).orElse(null);
                    return DoctorPatientResponse.from(profile, last);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DoctorPatientResponse> searchMyPatients(String doctorEmail, String query) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        String lq = query == null ? "" : query.toLowerCase();
        return patientProfileRepository.findByAssignedDoctor(doctor).stream()
                .filter(p -> {
                    String name = p.getFullName() != null ? p.getFullName().toLowerCase() : "";
                    String email = p.getUser().getEmail().toLowerCase();
                    return name.contains(lq) || email.contains(lq);
                })
                .map(profile -> {
                    Checkup last = checkupRepository
                            .findFirstByPatientOrderByCreatedAtDesc(profile.getUser()).orElse(null);
                    return DoctorPatientResponse.from(profile, last);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PatientDetailResponse getPatientDetail(String doctorEmail, UUID patientProfileId) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        PatientProfile profile = patientProfileRepository.findById(patientProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        if (profile.getAssignedDoctor() == null
                || !profile.getAssignedDoctor().getId().equals(doctor.getId())) {
            throw new ValidationException("This patient is not assigned to you");
        }
        List<CheckupResponse> checkups = checkupRepository
                .findByPatientOrderByCreatedAtDesc(profile.getUser())
                .stream().map(CheckupResponse::from).collect(Collectors.toList());
        return PatientDetailResponse.builder()
                .profile(PatientProfileResponse.from(profile))
                .checkupHistory(checkups)
                .build();
    }
}
