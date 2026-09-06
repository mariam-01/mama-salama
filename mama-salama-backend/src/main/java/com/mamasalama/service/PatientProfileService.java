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
        profile.setMilieu(request.getMilieu());
        profile.setCity(request.getCity());
        profile.setPrefecture(request.getPrefecture());
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

        // LMP takes priority: auto-calculate pregnancyWeek and dueDate from it
        if (request.getLastMenstrualPeriod() != null) {
            LocalDate lmp = request.getLastMenstrualPeriod();
            profile.setLastMenstrualPeriod(lmp);
            int weeksSinceLmp = (int) ChronoUnit.WEEKS.between(lmp, LocalDate.now());
            profile.setPregnancyWeek(weeksSinceLmp);
            profile.setPregnancyWeekCalculated(weeksSinceLmp);
            profile.setDueDate(lmp.plusDays(280)); // Naegele's rule
            profile.setDueDateFromWeek(null);
        } else if (request.getPregnancyWeek() != null) {
            // Manual week fallback when no LMP is provided
            profile.setPregnancyWeek(request.getPregnancyWeek());
            profile.setPregnancyWeekCalculated(null);
            profile.setDueDate(null);
            profile.setDueDateFromWeek(LocalDate.now().plusWeeks(40 - request.getPregnancyWeek()));
        }
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}