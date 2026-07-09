package com.mamasalama.dto.response;

import com.mamasalama.entity.Checkup;
import com.mamasalama.enums.RiskLevel;
import com.mamasalama.enums.TriageLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckupResponse {
    private UUID id;
    private Integer systolicBP;
    private Integer diastolicBP;
    private Double bloodSugar;
    private Double temperature;
    private Integer heartRate;
    private String symptoms;
    private String notes;
    private TriageLevel triageLevel;
    private RiskLevel riskLevel;
    private LocalDateTime createdAt;

    public static CheckupResponse from(Checkup checkup) {
        return CheckupResponse.builder()
                .id(checkup.getId())
                .systolicBP(checkup.getSystolicBP())
                .diastolicBP(checkup.getDiastolicBP())
                .bloodSugar(checkup.getBloodSugar())
                .temperature(checkup.getTemperature())
                .heartRate(checkup.getHeartRate())
                .symptoms(checkup.getSymptoms())
                .notes(checkup.getNotes())
                .triageLevel(checkup.getTriageLevel())
                .riskLevel(checkup.getRiskLevel())
                .createdAt(checkup.getCreatedAt())
                .build();
    }
}