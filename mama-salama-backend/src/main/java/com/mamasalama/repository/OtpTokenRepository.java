package com.mamasalama.repository;

import com.mamasalama.entity.OtpToken;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface OtpTokenRepository extends JpaRepository<OtpToken, UUID> {

    @Query("SELECT o FROM OtpToken o WHERE o.user.id = :userId AND o.code = :code AND o.used = false AND o.expiresAt > :now")
    Optional<OtpToken> findValidOtp(
            @Param("userId") UUID userId,
            @Param("code") String code,
            @Param("now") LocalDateTime now);

    @Query("SELECT o FROM OtpToken o WHERE o.user.email = :email AND o.code = :code AND o.used = false AND o.expiresAt > :now")
    Optional<OtpToken> findValidOtpByEmail(
            @Param("email") String email,
            @Param("code") String code,
            @Param("now") LocalDateTime now);

    @Transactional
    @Modifying
    @Query("UPDATE OtpToken o SET o.used = true WHERE o.user.id = :userId AND o.used = false")
    void invalidateUserOtps(@Param("userId") UUID userId);
}