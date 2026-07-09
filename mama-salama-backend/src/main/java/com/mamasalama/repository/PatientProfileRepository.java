package com.mamasalama.repository;

import com.mamasalama.entity.PatientProfile;
import com.mamasalama.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PatientProfileRepository extends JpaRepository<PatientProfile, UUID> {
    Optional<PatientProfile> findByUser(User user);
    boolean existsByUser(User user);
}