package com.mamasalama.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private long patientCount;
    private long doctorCount;
    private long pendingAlertCount;
    private long proposedAppointmentCount;
    private long documentCount;
}