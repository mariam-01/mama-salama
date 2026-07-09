package com.mamasalama.dto.request;

import com.mamasalama.enums.BloodType;
import com.mamasalama.enums.FollowUpType;
import com.mamasalama.enums.Language;
import com.mamasalama.enums.Supplement;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientProfileRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotNull(message = "Age is required")
    @Min(value = 15, message = "Age must be at least 15")
    @Max(value = 60, message = "Age must not exceed 60")
    private Integer age;

    private Language language;

    private String region;

    @Min(value = 1, message = "Pregnancy week must be at least 1")
    @Max(value = 42, message = "Pregnancy week must not exceed 42")
    private Integer pregnancyWeek;

    private LocalDate lastMenstrualPeriod;

    private BloodType bloodType;

    @DecimalMin(value = "30.0", message = "Weight must be at least 30 kg")
    @DecimalMax(value = "200.0", message = "Weight must not exceed 200 kg")
    private Double weight;

    @DecimalMin(value = "100.0", message = "Height must be at least 100 cm")
    @DecimalMax(value = "220.0", message = "Height must not exceed 220 cm")
    private Double height;

    @Min(value = 0, message = "Number of previous pregnancies cannot be negative")
    @Max(value = 20, message = "Value seems too high")
    private Integer numberOfPreviousPregnancies;

    @Min(value = 0, message = "Number of children cannot be negative")
    @Max(value = 20, message = "Value seems too high")
    private Integer numberOfChildren;

    private FollowUpType followUpType;

    private Set<Supplement> supplements;

    private Boolean multiplePregnancy;

    private String medicalHistory;

    private String allergies;
}