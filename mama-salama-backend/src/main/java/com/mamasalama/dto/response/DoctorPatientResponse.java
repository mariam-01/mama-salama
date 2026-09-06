package com.mamasalama.dto.response;

import com.mamasalama.entity.Checkup;
import com.mamasalama.entity.PatientProfile;
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
public class DoctorPatientResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String city;
    private String prefecture;
    private String region;
    private Integer pregnancyWeek;
    private LocalDateTime lastCheckupDate;
    private TriageLevel triageLevel;
    private LocalDateTime assignedAt;

    public static DoctorPatientResponse from(PatientProfile profile, Checkup lastCheckup) {
        return DoctorPatientResponse.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .email(profile.getUser().getEmail())
                .city(profile.getCity())
                .prefecture(profile.getPrefecture())
                .region(profile.getRegion())
                .pregnancyWeek(profile.getPregnancyWeek())
                .lastCheckupDate(lastCheckup != null ? lastCheckup.getCreatedAt() : null)
                .triageLevel(lastCheckup != null ? lastCheckup.getTriageLevel() : null)
                .assignedAt(profile.getCreatedAt())
                .build();
    }
}
