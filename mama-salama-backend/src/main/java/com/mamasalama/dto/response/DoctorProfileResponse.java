package com.mamasalama.dto.response;

import com.mamasalama.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorProfileResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String specialty;
    private String hospital;
    private String region;
    private String prefecture;
    private String city;

    public static DoctorProfileResponse from(User doctor) {
        return DoctorProfileResponse.builder()
                .id(doctor.getId())
                .fullName(doctor.getFullName())
                .email(doctor.getEmail())
                .specialty(doctor.getSpecialty())
                .hospital(doctor.getHospital())
                .region(doctor.getRegion())
                .city(doctor.getCity())
                .prefecture(doctor.getPrefecture())
                .build();
    }
}
