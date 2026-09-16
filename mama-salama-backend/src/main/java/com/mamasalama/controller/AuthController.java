package com.mamasalama.controller;

import com.mamasalama.dto.request.*;
import com.mamasalama.dto.response.ApiResponse;
import com.mamasalama.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "OTP verification and password reset (login/register handled by Keycloak)")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/complete-invite")
    @Operation(summary = "Complete doctor registration using an invite link token")
    public ResponseEntity<ApiResponse<Void>> completeInvite(
            @Valid @RequestBody CompleteInviteRequest request) {
        authService.completeInvite(request);
        return ResponseEntity.ok(ApiResponse.success(null,
                "Account created successfully. Please log in."));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify the 6-digit OTP sent after registration")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest request) {
        authService.verifyOtp(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success(null, "Account verified successfully"));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend a new OTP to the patient's email or phone")
    public ResponseEntity<ApiResponse<Void>> resendOtp(
            @Valid @RequestBody ResendOtpRequest request) {
        authService.resendOtp(request);
        return ResponseEntity.ok(ApiResponse.success(null, "OTP sent"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Send a password-reset OTP to the patient's email or phone")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null,
                "If this email is registered, a reset code has been sent"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using the OTP code received by email or SMS")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully"));
    }
}
