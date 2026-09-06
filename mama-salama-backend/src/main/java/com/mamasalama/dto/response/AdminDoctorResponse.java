package com.mamasalama.dto.response;

import com.mamasalama.entity.User;
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
public class AdminDoctorResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private String city;
    private String prefecture;
    private String region;
    private String specialty;
    private boolean enabled;
    private long patientCount;
    private LocalDateTime createdAt;

    public static AdminDoctorResponse from(User user, long patientCount) {
        return AdminDoctorResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .city(user.getCity())
                .prefecture(user.getPrefecture())
                .region(user.getRegion())
                .specialty(user.getSpecialty())
                .enabled(user.isEnabled())
                .patientCount(patientCount)
                .createdAt(user.getCreatedAt())
                .build();
    }
}