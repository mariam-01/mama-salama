package com.mamasalama.entity;

import com.mamasalama.entity.common.AbstractEntity;
import com.mamasalama.enums.DocumentStatus;
import com.mamasalama.enums.Language;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "knowledge_base_documents")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeBaseDocument extends AbstractEntity {

    @Column(nullable = false)
    private String filename;

    @Column(name = "object_key")
    private String objectKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Language language;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DocumentStatus status = DocumentStatus.PENDING;

    private Integer chunkCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime uploadedAt;
}