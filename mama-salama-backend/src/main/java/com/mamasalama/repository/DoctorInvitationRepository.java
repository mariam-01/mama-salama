package com.mamasalama.repository;

import com.mamasalama.entity.DoctorInvitation;
import com.mamasalama.enums.InviteCodeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorInvitationRepository extends JpaRepository<DoctorInvitation, UUID> {

    Optional<DoctorInvitation> findByTokenAndStatusAndExpiresAtAfter(
            String token, InviteCodeStatus status, LocalDateTime now);

    boolean existsByEmailAndStatus(String email, InviteCodeStatus status);
}
