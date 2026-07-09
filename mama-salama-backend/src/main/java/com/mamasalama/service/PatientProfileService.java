package com.mamasalama.service;

import com.mamasalama.dto.request.PatientProfileRequest;
import com.mamasalama.dto.response.PatientProfileResponse;
import com.mamasalama.entity.PatientProfile;
import com.mamasalama.entity.User;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.repository.PatientProfileRepository;
import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class PatientProfileService {

    private final PatientProfileRepository profileRepository;
    private final UserRepository userRepository;

    @Transactional
    public PatientProfileResponse getProfile(String email) {
        User user = findUser(email);
        PatientProfile profile = profileRepository.findByUser(user)
                .orElseGet(() -> profileRepository.save(
                        PatientProfile.builder().user(user).build()
                ));
        return PatientProfileResponse.from(profile);
    }

    @Transactional
    public PatientProfileResponse createProfile(PatientProfileRequest request, String email) {
        User user = findUser(email);
        PatientProfile profile = profileRepository.findByUser(user)
                .orElseGet(() -> PatientProfile.builder().user(user).build());
        applyRequest(profile, request);
        return PatientProfileResponse.from(profileRepository.save(profile));
    }

    @Transactional
    public PatientProfileResponse updateProfile(PatientProfileRequest request, String email) {
        User user = findUser(email);
        PatientProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found. Use POST to create it."));
        applyRequest(profile, request);
        return PatientProfileResponse.from(profileRepository.save(profile));
    }

    private void applyRequest(PatientProfile profile, PatientProfileRequest request) {
        profile.setFullName(request.getFullName());
        profile.setAge(request.getAge());
        profile.setLanguage(request.getLanguage());
        profile.setRegion(request.getRegion());
        profile.setBloodType(request.getBloodType());
        profile.setWeight(request.getWeight());
        profile.setHeight(request.getHeight());
        profile.setNumberOfPreviousPregnancies(request.getNumberOfPreviousPregnancies());
        profile.setNumberOfChildren(request.getNumberOfChildren());
        profile.setFollowUpType(request.getFollowUpType());
        profile.setSupplements(request.getSupplements() != null ? request.getSupplements() : new HashSet<>());
        profile.setMultiplePregnancy(request.getMultiplePregnancy());
        profile.setMedicalHistory(request.getMedicalHistory());
        profile.setAllergies(request.getAllergies());

        // User-editable week — saved as-is, due date derived from it
        profile.setPregnancyWeek(request.getPregnancyWeek());
        if (request.getPregnancyWeek() != null) {
            int weeksRemaining = 40 - request.getPregnancyWeek();
            profile.setDueDateFromWeek(LocalDate.now().plusWeeks(weeksRemaining));
        }

        // LMP → auto-calculate read-only fields (does not overwrite pregnancyWeek)
        if (request.getLastMenstrualPeriod() != null) {
            LocalDate lmp = request.getLastMenstrualPeriod();
            profile.setLastMenstrualPeriod(lmp);
            profile.setPregnancyWeekCalculated((int) ChronoUnit.WEEKS.between(lmp, LocalDate.now()));
            profile.setDueDate(lmp.plusDays(280)); // Naegele's rule
        }
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}