package com.mamasalama.dto.response;

import com.mamasalama.enums.InviteCodeStatus;
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
public class InviteCodeResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String city;
    private String province;
    private String hospital;
    private InviteCodeStatus status;
    private String createdByEmail;
    private String usedByEmail;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime usedAt;
}