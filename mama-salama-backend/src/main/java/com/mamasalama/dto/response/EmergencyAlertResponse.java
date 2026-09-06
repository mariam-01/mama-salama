package com.mamasalama.dto.response;

import com.mamasalama.enums.AlertSource;
import com.mamasalama.enums.AlertStatus;
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
public class EmergencyAlertResponse {
    private UUID id;
    private UUID patientId;
    private String patientFullName;
    private String patientEmail;
    private String patientCity;
    private String patientPrefecture;
    private String patientRegion;
    private Integer patientPregnancyWeek;
    private AlertSource source;
    private AlertStatus status;
    private String triggerMessage;
    private String claimedByEmail;
    private LocalDateTime createdAt;
    private LocalDateTime claimedAt;
    private int matchedDoctorsCount;
}