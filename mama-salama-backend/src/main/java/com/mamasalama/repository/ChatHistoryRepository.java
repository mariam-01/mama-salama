package com.mamasalama.repository;

import com.mamasalama.entity.ChatHistory;
import com.mamasalama.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatHistoryRepository extends JpaRepository<ChatHistory, UUID> {
    List<ChatHistory> findByUserOrderByCreatedAtDesc(User user);
}