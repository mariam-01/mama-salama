package com.mamasalama.dto.response;

import com.mamasalama.entity.PatientProfile;
import com.mamasalama.enums.BloodType;
import com.mamasalama.enums.FollowUpType;
import com.mamasalama.enums.Language;
import com.mamasalama.enums.Supplement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientProfileResponse {
    private UUID id;
    private String fullName;
    private Integer age;
    private Language language;
    private String region;
    private String city;
    private String province;
    private Integer pregnancyWeek;
    private Integer pregnancyWeekCalculated;
    private LocalDate lastMenstrualPeriod;
    private LocalDate dueDate;
    private LocalDate dueDateFromWeek;
    private BloodType bloodType;
    private Double weight;
    private Double height;
    private Integer numberOfPreviousPregnancies;
    private Integer numberOfChildren;
    private FollowUpType followUpType;
    private Set<Supplement> supplements;
    private Boolean multiplePregnancy;
    private String medicalHistory;
    private String allergies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PatientProfileResponse from(PatientProfile profile) {
        return PatientProfileResponse.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .age(profile.getAge())
                .language(profile.getLanguage())
                .region(profile.getRegion())
                .city(profile.getCity())
                .province(profile.getProvince())
                .pregnancyWeek(profile.getPregnancyWeek())
                .pregnancyWeekCalculated(profile.getPregnancyWeekCalculated())
                .lastMenstrualPeriod(profile.getLastMenstrualPeriod())
                .dueDate(profile.getDueDate())
                .dueDateFromWeek(profile.getDueDateFromWeek())
                .bloodType(profile.getBloodType())
                .weight(profile.getWeight())
                .height(profile.getHeight())
                .numberOfPreviousPregnancies(profile.getNumberOfPreviousPregnancies())
                .numberOfChildren(profile.getNumberOfChildren())
                .followUpType(profile.getFollowUpType())
                .supplements(profile.getSupplements())
                .multiplePregnancy(profile.getMultiplePregnancy())
                .medicalHistory(profile.getMedicalHistory())
                .allergies(profile.getAllergies())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}