package com.mamasalama.service;

import com.mamasalama.dto.response.KnowledgeBaseDocumentResponse;
import com.mamasalama.entity.KnowledgeBaseDocument;
import com.mamasalama.entity.User;
import com.mamasalama.enums.DocumentStatus;
import com.mamasalama.enums.Language;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.exception.ValidationException;
import com.mamasalama.mapper.KnowledgeBaseDocumentMapper;
import com.mamasalama.repository.KnowledgeBaseDocumentRepository;
import com.mamasalama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeBaseService {

    private final KnowledgeBaseDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final KnowledgeBaseDocumentMapper documentMapper;
    private final RestClient aiRestClient;
    private final StorageService storageService;

    @Transactional
    public KnowledgeBaseDocumentResponse uploadDocument(MultipartFile file, Language language, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        KnowledgeBaseDocument document = KnowledgeBaseDocument.builder()
                .filename(file.getOriginalFilename())
                .language(language)
                .status(DocumentStatus.PROCESSING)
                .uploadedBy(admin)
                .build();

        document = documentRepository.save(document);
        final UUID docId = document.getId();

        String objectKey = storageService.upload(file, docId);
        document.setObjectKey(objectKey);
        documentRepository.save(document);

        try {
            byte[] bytes = file.getBytes();
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });
            body.add("language", language.name().toLowerCase());
            body.add("document_id", docId.toString());
            log.info("Forwarding document {} to AI service for indexing", docId);

            Map<?, ?> response = aiRestClient.post()
                    .uri("/api/ingest/pdf")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            log.info("AI service response for document {}: {}", docId, response);
            Integer chunkCount = response != null ? (Integer) response.get("indexed") : null;
            document = documentRepository.findById(docId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document not found after save"));
            document.setStatus(DocumentStatus.DONE);
            document.setChunkCount(chunkCount);
            document = documentRepository.save(document);

        } catch (IOException e) {
            log.error("Failed to read uploaded file: {}", e.getMessage());
            markFailed(docId);
            throw new ValidationException("Failed to read file: " + e.getMessage());
        } catch (Exception e) {
            log.error("Failed to forward document to AI service: {}", e.getMessage());
            markFailed(docId);
            throw new ValidationException("AI service rejected the document: " + e.getMessage());
        }

        return documentMapper.toResponse(document);
    }

    @Transactional(readOnly = true)
    public List<KnowledgeBaseDocumentResponse> listDocuments() {
        return documentRepository.findAll().stream()
                .map(documentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDocument(UUID documentId) {
        KnowledgeBaseDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        try {
            aiRestClient.delete()
                    .uri("/api/knowledge-base/{id}", documentId)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("AI service delete returned error for document {}: {}", documentId, e.getMessage());
        }

        if (document.getObjectKey() != null) {
            storageService.delete(document.getObjectKey());
        }

        documentRepository.delete(document);
    }

    private void markFailed(UUID docId) {
        documentRepository.findById(docId).ifPresent(d -> {
            d.setStatus(DocumentStatus.FAILED);
            documentRepository.save(d);
        });
    }
}