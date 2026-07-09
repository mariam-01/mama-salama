package com.mamasalama.controller;

import com.mamasalama.dto.request.CheckupRequest;
import com.mamasalama.dto.response.ApiResponse;
import com.mamasalama.dto.response.CheckupResponse;
import com.mamasalama.service.CheckupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pregnancy")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Daily Checkup", description = "Submit and retrieve daily health checkups (F03)")
public class CheckupController {

    private final CheckupService checkupService;

    @PostMapping("/checkup")
    @Operation(summary = "Submit a daily health checkup — returns WHO-based triage level")
    public ResponseEntity<ApiResponse<CheckupResponse>> submitCheckup(
            @Valid @RequestBody CheckupRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CheckupResponse response = checkupService.submit(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Checkup submitted successfully"));
    }

    @GetMapping("/checkup/history")
    @Operation(summary = "Get all checkups for the authenticated patient")
    public ResponseEntity<ApiResponse<List<CheckupResponse>>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<CheckupResponse> responses = checkupService.getHistory(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(responses, "Checkup history retrieved successfully"));
    }

    @GetMapping("/checkup/latest")
    @Operation(summary = "Get the most recent checkup")
    public ResponseEntity<ApiResponse<CheckupResponse>> getLatest(
            @AuthenticationPrincipal UserDetails userDetails) {
        CheckupResponse response = checkupService.getLatest(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Latest checkup retrieved successfully"));
    }
}