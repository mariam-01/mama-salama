package com.mamasalama.entity;

import com.mamasalama.entity.common.AbstractEntity;
import com.mamasalama.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "risk_predictions")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskPrediction extends AbstractEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checkup_id", nullable = false, unique = true)
    @ToString.Exclude
    private Checkup checkup;

    @Enumerated(EnumType.STRING)
    private RiskLevel mlRiskLevel;

    private Double confidence;

    @Column(columnDefinition = "TEXT")
    private String factors;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}