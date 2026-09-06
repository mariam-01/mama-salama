package com.mamasalama.controller;

import com.mamasalama.dto.request.DoctorCreateRequest;
import com.mamasalama.dto.request.DoctorInviteRequest;
import com.mamasalama.dto.request.UpdateUserStatusRequest;
import com.mamasalama.dto.response.*;
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
import org.springframework.security.core.userdetails.UserDetails;
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





    // ── Invite Codes ──────────────────────────────────────────────────────────

    @PostMapping("/invite-codes")
    @Operation(summary = "Send a doctor invite email with a registration link")
    public ResponseEntity<InviteCodeResponse> sendInvite(
            @Valid @RequestBody DoctorInviteRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.sendInvite(request, user.getUsername()));
    }

    @GetMapping("/invite-codes")
    @Operation(summary = "List all invite codes")
    public ResponseEntity<List<InviteCodeResponse>> listInviteCodes() {
        return ResponseEntity.ok(adminService.listInviteCodes());
    }

    // ── Knowledge Base ────────────────────────────────────────────────────────

    @PostMapping(value = "/knowledge-base", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a document to the AI knowledge base")
    public ResponseEntity<KnowledgeBaseDocumentResponse> uploadDocument(
            @RequestPart("file") MultipartFile file,
            @RequestParam("language") Language language,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(knowledgeBaseService.uploadDocument(file, language, user.getUsername()));
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