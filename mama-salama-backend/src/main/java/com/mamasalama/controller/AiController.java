package com.mamasalama.controller;

import com.mamasalama.dto.request.AiAskRequest;
import com.mamasalama.dto.response.AiResponse;
import com.mamasalama.dto.response.ApiResponse;
import com.mamasalama.dto.response.ChatHistoryResponse;
import com.mamasalama.dto.response.VoiceAiResponse;
import com.mamasalama.enums.Language;
import com.mamasalama.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "AI Chatbot", description = "RAG chatbot for pregnancy questions (F06 — stub)")
public class AiController {

    private final AiService aiService;

    @PostMapping("/ask")
    @Operation(summary = "Ask the AI a pregnancy-related question")
    public ResponseEntity<ApiResponse<AiResponse>> ask(
            @Valid @RequestBody AiAskRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        AiResponse response = aiService.ask(request, jwt.getClaimAsString("email"));
        return ResponseEntity.ok(ApiResponse.success(response, "Response generated successfully"));
    }

    @GetMapping("/history")
    @Operation(summary = "Get the authenticated user's chat history")
    public ResponseEntity<ApiResponse<List<ChatHistoryResponse>>> getHistory(
            @AuthenticationPrincipal Jwt jwt) {
        List<ChatHistoryResponse> responses = aiService.getHistory(jwt.getClaimAsString("email"));
        return ResponseEntity.ok(ApiResponse.success(responses, "Chat history retrieved successfully"));
    }

    @PostMapping(value = "/voice-ask", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Ask the AI a question via voice recording — transcribed by Whisper then answered via RAG")
    public ResponseEntity<ApiResponse<VoiceAiResponse>> voiceAsk(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "language", defaultValue = "FRENCH") Language language,
            @AuthenticationPrincipal Jwt jwt) {
        VoiceAiResponse response = aiService.voiceAsk(file, language, jwt.getClaimAsString("email"));
        return ResponseEntity.ok(ApiResponse.success(response, "Voice response generated successfully"));
    }
}
