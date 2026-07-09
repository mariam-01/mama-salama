package com.mamasalama.repository;

import com.mamasalama.entity.Checkup;
import com.mamasalama.entity.User;
import com.mamasalama.enums.TriageLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CheckupRepository extends JpaRepository<Checkup, UUID> {
    List<Checkup> findByPatientOrderByCreatedAtDesc(User patient);
    Optional<Checkup> findFirstByPatientOrderByCreatedAtDesc(User patient);
    Optional<Checkup> findFirstByPatientAndTriageLevelOrderByCreatedAtDesc(User patient, TriageLevel triageLevel);
}