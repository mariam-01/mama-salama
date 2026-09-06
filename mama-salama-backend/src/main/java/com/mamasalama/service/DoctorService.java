package com.mamasalama.service;

import com.mamasalama.dto.request.DoctorProfileUpdateRequest;

import com.mamasalama.dto.response.DoctorProfileResponse;

import com.mamasalama.entity.User;
import com.mamasalama.exception.ResourceNotFoundException;

import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;



@Service
@RequiredArgsConstructor
public class DoctorService {

    private final UserRepository userRepository;


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



}
