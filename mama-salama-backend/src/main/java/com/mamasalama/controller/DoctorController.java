package com.mamasalama.controller;

import com.mamasalama.dto.request.DoctorProfileUpdateRequest;
import com.mamasalama.dto.response.ApiResponse;
import com.mamasalama.dto.response.DoctorProfileResponse;
import com.mamasalama.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;



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
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                doctorService.getProfile(userDetails.getUsername()),
                "Profile retrieved successfully"));
    }

    @PutMapping("/me")
    @Operation(summary = "Update the authenticated doctor's profile")
    public ResponseEntity<ApiResponse<DoctorProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody DoctorProfileUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                doctorService.updateProfile(userDetails.getUsername(), request),
                "Profile updated successfully"));
    }


}
