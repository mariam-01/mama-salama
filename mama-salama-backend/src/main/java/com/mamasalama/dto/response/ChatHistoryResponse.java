package com.mamasalama.dto.response;

import com.mamasalama.entity.ChatHistory;
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
public class ChatHistoryResponse {
    private UUID id;
    private String question;
    private String answer;
    private LocalDateTime createdAt;

    public static ChatHistoryResponse from(ChatHistory history) {
        return ChatHistoryResponse.builder()
                .id(history.getId())
                .question(history.getQuestion())
                .answer(history.getAnswer())
                .createdAt(history.getCreatedAt())
                .build();
    }
}