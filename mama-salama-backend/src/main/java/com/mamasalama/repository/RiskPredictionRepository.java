package com.mamasalama.repository;

import com.mamasalama.entity.Checkup;
import com.mamasalama.entity.RiskPrediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RiskPredictionRepository extends JpaRepository<RiskPrediction, UUID> {
    Optional<RiskPrediction> findByCheckup(Checkup checkup);
}