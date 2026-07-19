package com.mamasalama.dto.request;

import com.mamasalama.enums.Language;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiAskRequest {

    @NotBlank(message = "Question is required")
    private String question;

    private Language language;
}