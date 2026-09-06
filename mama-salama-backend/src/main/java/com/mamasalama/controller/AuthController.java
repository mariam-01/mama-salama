package com.mamasalama.controller;

import com.mamasalama.dto.request.CompleteInviteRequest;
import com.mamasalama.dto.request.ForgotPasswordRequest;
import com.mamasalama.dto.request.LoginRequest;
import com.mamasalama.dto.request.OtpVerifyRequest;
import com.mamasalama.dto.request.RegisterRequest;
import com.mamasalama.dto.request.ResetPasswordRequest;
import com.mamasalama.dto.response.ApiResponse;
import com.mamasalama.dto.response.AuthResponse;
import com.mamasalama.dto.response.RegisterResponse;
import com.mamasalama.enums.OtpChannel;
import com.mamasalama.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, and OTP verification")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new patient account")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Registration successful. Please verify your OTP."));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate and receive a JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP and activate the account")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response, "OTP verified successfully"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset OTP — sent to email or SMS")
    public ResponseEntity<ApiResponse<RegisterResponse>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        RegisterResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Password reset code sent"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Verify OTP and set a new password")
    public ResponseEntity<ApiResponse<AuthResponse>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        AuthResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Password reset successfully"));
    }

    @PostMapping("/complete-invite")
    @Operation(summary = "Complete doctor registration using an invite link token")
    public ResponseEntity<ApiResponse<AuthResponse>> completeInvite(
            @Valid @RequestBody CompleteInviteRequest request) {
        AuthResponse response = authService.completeInvite(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Account created successfully"));
    }

    @PostMapping("/resend-otp/{userId}")
    @Operation(summary = "Resend OTP — specify channel: SMS or EMAIL")
    public ResponseEntity<ApiResponse<Void>> resendOtp(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "EMAIL") OtpChannel channel) {
        authService.resendOtp(userId, channel);
        return ResponseEntity.ok(ApiResponse.success(null, "OTP resent via " + channel));
    }
}