package com.mamasalama.service;

import com.mamasalama.dto.request.CheckupRequest;
import com.mamasalama.entity.Checkup;
import com.mamasalama.entity.User;
import com.mamasalama.enums.RiskLevel;
import com.mamasalama.enums.Role;
import com.mamasalama.enums.TriageLevel;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.repository.CheckupRepository;
import com.mamasalama.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CheckupService")
class CheckupServiceTest {

    @Mock private CheckupRepository checkupRepository;
    @Mock private UserRepository userRepository;
    @Spy  private TriageService triageService;

    @InjectMocks
    private CheckupService checkupService;

    private User user;
    private static final String EMAIL = "fatima@test.ma";

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email(EMAIL)
                .password("hashed")
                .role(Role.PATIENT)
                .enabled(true)
                .build();
    }

    // ----------------------------------------------------------------- submit
    @Nested
    @DisplayName("submit")
    class Submit {

        @Test
        @DisplayName("normal vitals → saves checkup with GREEN triage")
        void normalVitals_greenTriage() {
            CheckupRequest req = new CheckupRequest(120, 80, 5.0, 37.0, 80, null, null);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(checkupRepository.save(any(Checkup.class))).thenAnswer(inv -> inv.getArgument(0));

            checkupService.submit(req, EMAIL);

            ArgumentCaptor<Checkup> captor = ArgumentCaptor.forClass(Checkup.class);
            verify(checkupRepository).save(captor.capture());
            assertThat(captor.getValue().getTriageLevel()).isEqualTo(TriageLevel.GREEN);
            assertThat(captor.getValue().getRiskLevel()).isEqualTo(RiskLevel.LOW);
        }

        @Test
        @DisplayName("elevated BP → saves checkup with YELLOW triage")
        void elevatedBP_yellowTriage() {
            CheckupRequest req = new CheckupRequest(145, 95, null, null, null, null, null);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(checkupRepository.save(any(Checkup.class))).thenAnswer(inv -> inv.getArgument(0));

            checkupService.submit(req, EMAIL);

            ArgumentCaptor<Checkup> captor = ArgumentCaptor.forClass(Checkup.class);
            verify(checkupRepository).save(captor.capture());
            assertThat(captor.getValue().getTriageLevel()).isEqualTo(TriageLevel.YELLOW);
            assertThat(captor.getValue().getRiskLevel()).isEqualTo(RiskLevel.MEDIUM);
        }

        @Test
        @DisplayName("critically high BP → saves checkup with RED triage")
        void criticalBP_redTriage() {
            CheckupRequest req = new CheckupRequest(170, 115, null, null, null, null, null);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(checkupRepository.save(any(Checkup.class))).thenAnswer(inv -> inv.getArgument(0));

            checkupService.submit(req, EMAIL);

            ArgumentCaptor<Checkup> captor = ArgumentCaptor.forClass(Checkup.class);
            verify(checkupRepository).save(captor.capture());
            assertThat(captor.getValue().getTriageLevel()).isEqualTo(TriageLevel.RED);
            assertThat(captor.getValue().getRiskLevel()).isEqualTo(RiskLevel.HIGH);
        }

        @Test
        @DisplayName("all vital fields are persisted on the saved entity")
        void vitalFieldsPersisted() {
            CheckupRequest req = new CheckupRequest(130, 85, 6.5, 37.5, 90, "headache", "note");
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(checkupRepository.save(any(Checkup.class))).thenAnswer(inv -> inv.getArgument(0));

            checkupService.submit(req, EMAIL);

            ArgumentCaptor<Checkup> captor = ArgumentCaptor.forClass(Checkup.class);
            verify(checkupRepository).save(captor.capture());
            Checkup saved = captor.getValue();
            assertThat(saved.getSystolicBP()).isEqualTo(130);
            assertThat(saved.getDiastolicBP()).isEqualTo(85);
            assertThat(saved.getBloodSugar()).isEqualTo(6.5);
            assertThat(saved.getTemperature()).isEqualTo(37.5);
            assertThat(saved.getHeartRate()).isEqualTo(90);
            assertThat(saved.getSymptoms()).isEqualTo("headache");
            assertThat(saved.getNotes()).isEqualTo("note");
            assertThat(saved.getPatient()).isEqualTo(user);
        }

        @Test
        @DisplayName("unknown email → throws ResourceNotFoundException")
        void unknownEmail_throwsException() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> checkupService.submit(new CheckupRequest(), EMAIL))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // -------------------------------------------------------------- getHistory
    @Nested
    @DisplayName("getHistory")
    class GetHistory {

        @Test
        @DisplayName("returns all checkups for the user ordered by date")
        void returnsCheckups() {
            Checkup c1 = buildCheckup(TriageLevel.GREEN);
            Checkup c2 = buildCheckup(TriageLevel.RED);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(checkupRepository.findByPatientOrderByCreatedAtDesc(user)).thenReturn(List.of(c1, c2));

            var result = checkupService.getHistory(EMAIL);

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("no checkups → returns empty list")
        void noCheckups_returnsEmptyList() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(checkupRepository.findByPatientOrderByCreatedAtDesc(user)).thenReturn(List.of());

            assertThat(checkupService.getHistory(EMAIL)).isEmpty();
        }
    }

    // --------------------------------------------------------------- getLatest
    @Nested
    @DisplayName("getLatest")
    class GetLatest {

        @Test
        @DisplayName("returns the most recent checkup")
        void returnsLatest() {
            Checkup latest = buildCheckup(TriageLevel.YELLOW);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(checkupRepository.findFirstByPatientOrderByCreatedAtDesc(user))
                    .thenReturn(Optional.of(latest));

            var result = checkupService.getLatest(EMAIL);

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("no checkups → throws ResourceNotFoundException")
        void noCheckups_throwsException() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(checkupRepository.findFirstByPatientOrderByCreatedAtDesc(user))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> checkupService.getLatest(EMAIL))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("No checkups found");
        }
    }

    private Checkup buildCheckup(TriageLevel level) {
        return Checkup.builder()
                .patient(user)
                .systolicBP(120)
                .diastolicBP(80)
                .temperature(37.0)
                .heartRate(80)
                .bloodSugar(5.0)
                .triageLevel(level)
                .riskLevel(triageService.triageToRisk(level))
                .build();
    }
}