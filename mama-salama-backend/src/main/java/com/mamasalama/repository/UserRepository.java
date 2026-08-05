package com.mamasalama.repository;

import com.mamasalama.entity.User;
import com.mamasalama.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    long countByRole(Role role);

    @Query("SELECT COUNT(DISTINCT u) FROM User u WHERE u.role = :role AND (u.city = :city OR u.province = :province)")
    long countDoctorsByLocation(@Param("role") Role role, @Param("city") String city, @Param("province") String province);
}