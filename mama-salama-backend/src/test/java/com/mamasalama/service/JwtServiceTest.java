package com.mamasalama.service;

import com.mamasalama.entity.User;
import com.mamasalama.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JwtService")
class JwtServiceTest {

    // Valid Base64-encoded 32-byte key (same default as application.yml)
    private static final String SECRET = "QE5jUmZValhucjI3NXU4eC9BP0QoRytLYlBkU2dWa1lw";
    private static final long EXPIRATION = 86_400_000L; // 24 h

    private JwtService jwtService;
    private User user;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", EXPIRATION);

        user = User.builder()
                .email("fatima@test.ma")
                .password("hashed")
                .role(Role.PATIENT)
                .enabled(true)
                .build();
    }

    @Test
    @DisplayName("generateToken returns a non-blank token")
    void generateToken_returnsNonBlank() {
        String token = jwtService.generateToken(user);
        assertThat(token).isNotBlank();
    }

    @Test
    @DisplayName("extractUsername returns the user's email")
    void extractUsername_returnsEmail() {
        String token = jwtService.generateToken(user);
        assertThat(jwtService.extractUsername(token)).isEqualTo("fatima@test.ma");
    }

    @Test
    @DisplayName("isTokenValid returns true for matching user and fresh token")
    void isTokenValid_validToken_returnsTrue() {
        String token = jwtService.generateToken(user);
        assertThat(jwtService.isTokenValid(token, user)).isTrue();
    }

    @Test
    @DisplayName("isTokenValid returns false when username does not match")
    void isTokenValid_wrongUser_returnsFalse() {
        String token = jwtService.generateToken(user);
        User other = User.builder()
                .email("other@test.ma")
                .password("hashed")
                .role(Role.PATIENT)
                .enabled(true)
                .build();
        assertThat(jwtService.isTokenValid(token, other)).isFalse();
    }

    @Test
    @DisplayName("isTokenValid returns false for an expired token")
    void isTokenValid_expiredToken_returnsFalse() {
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -1000L); // already expired
        String expiredToken = jwtService.generateToken(user);
        assertThat(jwtService.isTokenValid(expiredToken, user)).isFalse();
    }

    @Test
    @DisplayName("token generated with extra claims still contains the subject")
    void generateToken_withExtraClaims_subjectIsEmail() {
        String token = jwtService.generateToken(
                java.util.Map.of("role", "PATIENT"), user);
        assertThat(jwtService.extractUsername(token)).isEqualTo("fatima@test.ma");
    }

    @Test
    @DisplayName("parsing a tampered token throws an exception")
    void tamperedToken_throwsException() {
        String token = jwtService.generateToken(user);
        String tampered = token.substring(0, token.length() - 4) + "XXXX";
        assertThatThrownBy(() -> jwtService.extractUsername(tampered))
                .isInstanceOf(Exception.class);
    }
}