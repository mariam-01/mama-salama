package com.mamasalama.dto.request;

import com.mamasalama.enums.AppointmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRequest {

    @NotNull(message = "Patient ID is required")
    private UUID patientId;

    private UUID alertId;

    @NotNull(message = "At least one slot is required")
    @Size(min = 1, max = 3, message = "You must propose between 1 and 3 slots")
    private List<LocalDateTime> slots;

    @NotNull(message = "Appointment type is required")
    private AppointmentType type;

    @NotBlank(message = "Location is required")
    private String location;

    private String notes;
}