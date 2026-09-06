package com.mamasalama.controller;

import com.mamasalama.dto.request.EmergencyAlertRequest;
import com.mamasalama.dto.response.EmergencyAlertResponse;
import com.mamasalama.service.EmergencyAlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/emergency")
@RequiredArgsConstructor
@Tag(name = "Emergency Alerts", description = "Emergency alert management")
@SecurityRequirement(name = "bearerAuth")
public class EmergencyAlertController {

    private final EmergencyAlertService alertService;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Create an emergency alert")
    public ResponseEntity<EmergencyAlertResponse> createAlert(
            @Valid @RequestBody EmergencyAlertRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(alertService.createAlert(request, user.getUsername()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Get pending alerts in doctor's area")
    public ResponseEntity<List<EmergencyAlertResponse>> getPending(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(alertService.getPendingForDoctor(user.getUsername()));
    }

    @PutMapping("/{alertId}/claim")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Claim a pending alert")
    public ResponseEntity<EmergencyAlertResponse> claimAlert(
            @PathVariable UUID alertId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(alertService.claimAlert(alertId, user.getUsername()));
    }

    @PutMapping("/{alertId}/cancel")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Cancel a pending alert")
    public ResponseEntity<EmergencyAlertResponse> cancelAlert(
            @PathVariable UUID alertId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(alertService.cancelAlert(alertId, user.getUsername()));
    }

    @PutMapping("/{alertId}/resolve")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Resolve a claimed alert")
    public ResponseEntity<EmergencyAlertResponse> resolveAlert(
            @PathVariable UUID alertId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(alertService.resolveAlert(alertId, user.getUsername()));
    }
}