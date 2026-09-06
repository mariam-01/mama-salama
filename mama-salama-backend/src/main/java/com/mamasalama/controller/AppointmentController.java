package com.mamasalama.controller;

import com.mamasalama.dto.request.AppointmentRequest;
import com.mamasalama.dto.request.ConfirmSlotRequest;
import com.mamasalama.dto.response.AppointmentResponse;
import com.mamasalama.service.AppointmentService;
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
@RequestMapping("/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "Appointment scheduling and management")
@SecurityRequirement(name = "bearerAuth")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Propose an appointment with multiple time slots")
    public ResponseEntity<AppointmentResponse> proposeAppointment(
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.proposeAppointment(request, user.getUsername()));
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "List all appointments for the authenticated doctor")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointments(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(user.getUsername()));
    }

    @GetMapping("/patient")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "List all appointments for the authenticated patient")
    public ResponseEntity<List<AppointmentResponse>> getPatientAppointments(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(appointmentService.getPatientAppointments(user.getUsername()));
    }

    @PutMapping("/{appointmentId}/confirm")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Confirm an appointment by selecting a slot")
    public ResponseEntity<AppointmentResponse> confirmAppointment(
            @PathVariable UUID appointmentId,
            @Valid @RequestBody ConfirmSlotRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(appointmentService.confirmAppointment(appointmentId, request, user.getUsername()));
    }

    @PutMapping("/{appointmentId}/reject")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Reject a proposed appointment")
    public ResponseEntity<AppointmentResponse> rejectAppointment(
            @PathVariable UUID appointmentId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(appointmentService.rejectAppointment(appointmentId, user.getUsername()));
    }

    @PutMapping("/{appointmentId}/complete")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Mark an appointment as completed")
    public ResponseEntity<AppointmentResponse> completeAppointment(
            @PathVariable UUID appointmentId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(appointmentService.completeAppointment(appointmentId, user.getUsername()));
    }

    @PutMapping("/{appointmentId}/cancel")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    @Operation(summary = "Cancel an appointment")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @PathVariable UUID appointmentId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(appointmentId, user.getUsername()));
    }
}