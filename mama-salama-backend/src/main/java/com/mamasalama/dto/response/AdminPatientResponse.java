package com.mamasalama.dto.response;

import com.mamasalama.entity.PatientProfile;
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
public class AdminPatientResponse {
    private UUID id;
    private String email;
    private String phone;
    private String city;
    private String prefecture;
    private boolean enabled;
    private String fullName;
    private String assignedDoctorEmail;
    private LocalDateTime createdAt;

    public static AdminPatientResponse from(User user, PatientProfile profile) {
        return AdminPatientResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .city(user.getCity())
                .prefecture(user.getPrefecture())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .fullName(profile != null ? profile.getFullName() : null)
                .assignedDoctorEmail(profile != null && profile.getAssignedDoctor() != null
                        ? profile.getAssignedDoctor().getEmail() : null)
                .build();
    }
}