package com.mamasalama.entity;

import com.mamasalama.entity.common.AbstractEntity;
import com.mamasalama.enums.RiskLevel;
import com.mamasalama.enums.TriageLevel;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "checkups")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Checkup extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User patient;

    private Integer systolicBP;

    private Integer diastolicBP;

    private Double bloodSugar;

    private Double temperature;

    private Integer heartRate;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    private TriageLevel triageLevel;

    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}