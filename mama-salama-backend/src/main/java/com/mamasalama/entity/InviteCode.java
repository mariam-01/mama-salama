package com.mamasalama.entity;

import com.mamasalama.entity.common.AbstractEntity;
import com.mamasalama.enums.InviteCodeStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "invite_codes")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteCode extends AbstractEntity {

    @Column(unique = true, nullable = false)
    private String token;

    @Column(nullable = false)
    private String email;

    private String firstName;

    private String lastName;

    private String city;

    private String province;

    private String hospital;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InviteCodeStatus status = InviteCodeStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "used_by")
    private User usedBy;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime usedAt;
}
