package com.mamasalama.dto.request;

import com.mamasalama.enums.AlertSource;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyAlertRequest {

    @NotNull(message = "Source is required (CHATBOT or MANUAL)")
    private AlertSource source;

    private String triggerMessage;
}