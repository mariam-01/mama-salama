package com.mamasalama.entity;

import com.mamasalama.entity.common.AbstractEntity;
import com.mamasalama.enums.BloodType;
import com.mamasalama.enums.FollowUpType;
import com.mamasalama.enums.Language;
import com.mamasalama.enums.Supplement;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "patient_profiles")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientProfile extends AbstractEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @ToString.Exclude
    private User user;

    private String fullName;

    private Integer age;

    @Enumerated(EnumType.STRING)
    private Language language;

    private String region;

    private String milieu;

    private String city;

    private String prefecture;


    private Integer pregnancyWeek;

    private Integer pregnancyWeekCalculated;

    @Enumerated(EnumType.STRING)
    private BloodType bloodType;

    private Double weight;

    private Double height;

    private Integer numberOfPreviousPregnancies;

    private Integer numberOfChildren;

    private LocalDate lastMenstrualPeriod;

    private LocalDate dueDate;

    private LocalDate dueDateFromWeek;

    @Enumerated(EnumType.STRING)
    private FollowUpType followUpType;

    @ElementCollection(targetClass = Supplement.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "patient_supplements", joinColumns = @JoinColumn(name = "profile_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "supplement")
    @Builder.Default
    private Set<Supplement> supplements = new HashSet<>();

    private Boolean multiplePregnancy;

    @Column(columnDefinition = "TEXT")
    private String medicalHistory;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}