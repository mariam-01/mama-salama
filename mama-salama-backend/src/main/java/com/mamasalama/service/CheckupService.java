package com.mamasalama.service;

import com.mamasalama.dto.request.CheckupRequest;
import com.mamasalama.dto.response.CheckupResponse;
import com.mamasalama.entity.Checkup;
import com.mamasalama.entity.User;
import com.mamasalama.enums.RiskLevel;
import com.mamasalama.enums.TriageLevel;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.repository.CheckupRepository;
import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CheckupService {

    private final CheckupRepository checkupRepository;
    private final UserRepository userRepository;
    private final TriageService triageService;

    @Transactional
    public CheckupResponse submit(CheckupRequest request, String email) {
        User user = findUser(email);

        TriageLevel triage = triageService.calculateTriage(request);
        RiskLevel risk = triageService.triageToRisk(triage);

        Checkup checkup = Checkup.builder()
                .patient(user)
                .systolicBP(request.getSystolicBP())
                .diastolicBP(request.getDiastolicBP())
                .bloodSugar(request.getBloodSugar())
                .temperature(request.getTemperature())
                .heartRate(request.getHeartRate())
                .symptoms(request.getSymptoms())
                .notes(request.getNotes())
                .triageLevel(triage)
                .riskLevel(risk)
                .build();

        return CheckupResponse.from(checkupRepository.save(checkup));
    }

    public List<CheckupResponse> getHistory(String email) {
        User user = findUser(email);
        return checkupRepository.findByPatientOrderByCreatedAtDesc(user)
                .stream()
                .map(CheckupResponse::from)
                .toList();
    }

    public CheckupResponse getLatest(String email) {
        User user = findUser(email);
        return checkupRepository.findFirstByPatientOrderByCreatedAtDesc(user)
                .map(CheckupResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("No checkups found"));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}