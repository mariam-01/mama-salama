package com.mamasalama.repository;

import com.mamasalama.entity.KnowledgeBaseDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface KnowledgeBaseDocumentRepository extends JpaRepository<KnowledgeBaseDocument, UUID> {
}