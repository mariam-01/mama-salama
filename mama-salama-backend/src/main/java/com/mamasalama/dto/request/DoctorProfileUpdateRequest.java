package com.mamasalama.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorProfileUpdateRequest {
    private String fullName;
    private String specialty;
    private String hospital;
    private String region;
    private String prefecture;
    private String city;
}
