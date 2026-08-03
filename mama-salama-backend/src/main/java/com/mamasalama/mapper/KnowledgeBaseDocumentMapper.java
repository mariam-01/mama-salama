package com.mamasalama.mapper;

import com.mamasalama.dto.response.KnowledgeBaseDocumentResponse;
import com.mamasalama.entity.KnowledgeBaseDocument;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface KnowledgeBaseDocumentMapper {

    @Mapping(target = "uploadedByEmail", source = "uploadedBy.email")
    KnowledgeBaseDocumentResponse toResponse(KnowledgeBaseDocument document);
}