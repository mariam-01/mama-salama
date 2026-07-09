package com.mamasalama.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckupRequest {
    private Integer systolicBP;
    private Integer diastolicBP;
    private Double bloodSugar;
    private Double temperature;
    private Integer heartRate;
    private String symptoms;
    private String notes;
}