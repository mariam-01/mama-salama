package com.mamasalama.dto.response;

import com.mamasalama.enums.DocumentStatus;
import com.mamasalama.enums.Language;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeBaseDocumentResponse {
    private UUID id;
    private String filename;
    private Language language;
    private DocumentStatus status;
    private Integer chunkCount;
    private String uploadedByEmail;
    private LocalDateTime uploadedAt;
}