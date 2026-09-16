package com.mamasalama.controller;

import com.mamasalama.dto.request.DoctorCreateRequest;
import com.mamasalama.dto.request.DoctorInviteRequest;
import com.mamasalama.dto.request.UpdateUserStatusRequest;
import com.mamasalama.dto.response.*;
import com.mamasalama.enums.AlertStatus;
import com.mamasalama.enums.Language;
import com.mamasalama.service.AdminService;
import com.mamasalama.service.KnowledgeBaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin-only management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;
    private final KnowledgeBaseService knowledgeBaseService;

    @GetMapping("/stats")
    @Operation(summary = "Get platform statistics")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/patients")
    @Operation(summary = "List patients, optionally filtered by name or email")
    public ResponseEntity<List<AdminPatientResponse>> getPatients(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getPatients(search));
    }

    @PutMapping("/patients/{patientId}/status")
    @Operation(summary = "Enable or disable a patient account")
    public ResponseEntity<AdminPatientResponse> updatePatientStatus(
            @PathVariable UUID patientId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(adminService.updatePatientStatus(patientId, request));
    }

    @GetMapping("/doctors")
    @Operation(summary = "List doctors, optionally filtered by name or email")
    public ResponseEntity<List<AdminDoctorResponse>> getDoctors(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getDoctors(search));
    }

    @PostMapping("/doctors")
    @Operation(summary = "Create a doctor account directly (bypasses invite code)")
    public ResponseEntity<AdminDoctorResponse> createDoctor(
            @Valid @RequestBody DoctorCreateRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createDoctor(request, jwt.getClaimAsString("email")));
    }

    @PutMapping("/doctors/{doctorId}/status")
    @Operation(summary = "Enable or disable a doctor account")
    public ResponseEntity<AdminDoctorResponse> updateDoctorStatus(
            @PathVariable UUID doctorId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(adminService.updateDoctorStatus(doctorId, request));
    }

    @GetMapping("/alerts")
    @Operation(summary = "List all emergency alerts, optionally filtered by status")
    public ResponseEntity<List<EmergencyAlertResponse>> getAlerts(
            @RequestParam(required = false) AlertStatus status) {
        return ResponseEntity.ok(adminService.getAlerts(status));
    }

    @PostMapping("/invite-codes")
    @Operation(summary = "Send a doctor invite email with a registration link")
    public ResponseEntity<InviteCodeResponse> sendInvite(
            @Valid @RequestBody DoctorInviteRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.sendInvite(request, jwt.getClaimAsString("email")));
    }

    @GetMapping("/invite-codes")
    @Operation(summary = "List all invite codes")
    public ResponseEntity<List<InviteCodeResponse>> listInviteCodes() {
        return ResponseEntity.ok(adminService.listInviteCodes());
    }

    @PostMapping(value = "/knowledge-base", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a document to the AI knowledge base")
    public ResponseEntity<KnowledgeBaseDocumentResponse> uploadDocument(
            @RequestPart("file") MultipartFile file,
            @RequestParam("language") Language language,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(knowledgeBaseService.uploadDocument(file, language, jwt.getClaimAsString("email")));
    }

    @GetMapping("/knowledge-base")
    @Operation(summary = "List all knowledge base documents")
    public ResponseEntity<List<KnowledgeBaseDocumentResponse>> listDocuments() {
        return ResponseEntity.ok(knowledgeBaseService.listDocuments());
    }

    @DeleteMapping("/knowledge-base/{documentId}")
    @Operation(summary = "Delete a knowledge base document")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID documentId) {
        knowledgeBaseService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }
}
