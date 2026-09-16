package com.mamasalama.controller;

import com.mamasalama.dto.request.DoctorProfileUpdateRequest;
import com.mamasalama.dto.response.ApiResponse;
import com.mamasalama.dto.response.DoctorPatientResponse;
import com.mamasalama.dto.response.DoctorProfileResponse;
import com.mamasalama.dto.response.PatientDetailResponse;
import com.mamasalama.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/doctors")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DOCTOR')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Doctor", description = "Doctor patient management")
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping("/me")
    @Operation(summary = "Get the authenticated doctor's profile")
    public ResponseEntity<ApiResponse<DoctorProfileResponse>> getProfile(
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.success(
                doctorService.getProfile(jwt.getClaimAsString("email")),
                "Profile retrieved successfully"));
    }

    @PutMapping("/me")
    @Operation(summary = "Update the authenticated doctor's profile")
    public ResponseEntity<ApiResponse<DoctorProfileResponse>> updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody DoctorProfileUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                doctorService.updateProfile(jwt.getClaimAsString("email"), request),
                "Profile updated successfully"));
    }

    @GetMapping("/patients")
    @Operation(summary = "Get all patients assigned to the authenticated doctor")
    public ResponseEntity<ApiResponse<List<DoctorPatientResponse>>> getMyPatients(
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.success(
                doctorService.getMyPatients(jwt.getClaimAsString("email")),
                "Patients retrieved successfully"));
    }

    @GetMapping("/patients/search")
    @Operation(summary = "Search assigned patients by name or email")
    public ResponseEntity<ApiResponse<List<DoctorPatientResponse>>> searchPatients(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam String query) {
        return ResponseEntity.ok(ApiResponse.success(
                doctorService.searchMyPatients(jwt.getClaimAsString("email"), query),
                "Search completed"));
    }

    @GetMapping("/patients/{patientId}")
    @Operation(summary = "Get full patient detail with checkup history")
    public ResponseEntity<ApiResponse<PatientDetailResponse>> getPatientDetail(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID patientId) {
        return ResponseEntity.ok(ApiResponse.success(
                doctorService.getPatientDetail(jwt.getClaimAsString("email"), patientId),
                "Patient detail retrieved successfully"));
    }
}
