package com.mamasalama.dto.response;

import com.mamasalama.enums.AppointmentStatus;
import com.mamasalama.enums.AppointmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {
    private UUID id;
    private UUID patientId;
    private String patientFullName;
    private String patientEmail;
    private UUID doctorId;
    private String doctorEmail;
    private UUID alertId;
    private List<AppointmentSlotResponse> slots;
    private AppointmentSlotResponse confirmedSlot;
    private AppointmentType type;
    private String location;
    private String notes;
    private AppointmentStatus status;
    private LocalDateTime createdAt;
}