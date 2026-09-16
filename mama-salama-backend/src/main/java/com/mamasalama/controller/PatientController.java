package com.mamasalama.controller;

import com.mamasalama.dto.request.PatientProfileRequest;
import com.mamasalama.dto.response.ApiResponse;
import com.mamasalama.dto.response.PatientProfileResponse;
import com.mamasalama.service.PatientProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Patient Profile", description = "Manage patient profile (F02)")
public class PatientController {

    private final PatientProfileService profileService;

    @GetMapping("/profile")
    @Operation(summary = "Get the authenticated patient's profile")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> getProfile(Authentication auth) {
        PatientProfileResponse response = profileService.getProfile(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(response, "Profile retrieved successfully"));
    }

    @PostMapping("/profile")
    @Operation(summary = "Create a new patient profile")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> createProfile(
            @Valid @RequestBody PatientProfileRequest request,
            Authentication auth) {
        PatientProfileResponse response = profileService.createProfile(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Profile created successfully"));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update the patient's profile")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> updateProfile(
            @Valid @RequestBody PatientProfileRequest request,
            Authentication auth) {
        PatientProfileResponse response = profileService.updateProfile(request, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(response, "Profile updated successfully"));
    }
}