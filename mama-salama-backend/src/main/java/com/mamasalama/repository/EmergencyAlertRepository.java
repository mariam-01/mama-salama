package com.mamasalama.repository;

import com.mamasalama.entity.EmergencyAlert;
import com.mamasalama.entity.PatientProfile;
import com.mamasalama.enums.AlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmergencyAlertRepository extends JpaRepository<EmergencyAlert, UUID> {

    List<EmergencyAlert> findAllByOrderByCreatedAtDesc();
    List<EmergencyAlert> findByStatusOrderByCreatedAtDesc(AlertStatus status);



    @Query("SELECT a FROM EmergencyAlert a WHERE a.status = :status AND a.patientCity = :city ORDER BY a.createdAt DESC")
    List<EmergencyAlert> findPendingByCity(@Param("status") AlertStatus status,
                                           @Param("city") String city);

    @Query("SELECT a FROM EmergencyAlert a WHERE a.status = :status AND a.patientPrefecture = :prefecture ORDER BY a.createdAt DESC")
    List<EmergencyAlert> findPendingByPrefecture(@Param("status") AlertStatus status,
                                               @Param("prefecture") String prefecture);

    @Query("SELECT a FROM EmergencyAlert a WHERE a.status = :status AND a.patientRegion = :region ORDER BY a.createdAt DESC")
    List<EmergencyAlert> findPendingByRegion(@Param("status") AlertStatus status,
                                             @Param("region") String region);

    long countByStatus(AlertStatus status);

    Optional<EmergencyAlert> findByIdAndPatient(UUID id, PatientProfile patient);
}