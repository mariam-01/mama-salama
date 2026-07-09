package com.mamasalama.service;

import com.mamasalama.dto.request.CheckupRequest;
import com.mamasalama.enums.RiskLevel;
import com.mamasalama.enums.TriageLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("TriageService")
class TriageServiceTest {

    private TriageService triageService;

    @BeforeEach
    void setUp() {
        triageService = new TriageService();
    }

    // ------------------------------------------------------------------ GREEN
    @Nested
    @DisplayName("GREEN triage")
    class GreenTriage {

        @Test
        @DisplayName("all vitals normal → GREEN")
        void allNormal() {
            CheckupRequest req = new CheckupRequest(120, 80, 5.0, 37.0, 80, null, null);
            assertThat(triageService.calculateTriage(req)).isEqualTo(TriageLevel.GREEN);
        }

        @Test
        @DisplayName("all vitals null → GREEN")
        void allNull() {
            CheckupRequest req = new CheckupRequest(null, null, null, null, null, null, null);
            assertThat(triageService.calculateTriage(req)).isEqualTo(TriageLevel.GREEN);
        }

        @Test
        @DisplayName("systolic exactly 139 → GREEN")
        void systolicBoundary() {
            CheckupRequest req = new CheckupRequest(139, null, null, null, null, null, null);
            assertThat(triageService.calculateTriage(req)).isEqualTo(TriageLevel.GREEN);
        }
    }

    // ----------------------------------------------------------------- YELLOW
    @Nested
    @DisplayName("YELLOW triage")
    class YellowTriage {

        @Test
        @DisplayName("systolic ≥ 140 → YELLOW")
        void highSystolicBP() {
            CheckupRequest req = new CheckupRequest(140, null, null, null, null, null, null);
            assertThat(triageService.calculateTriage(req)).isEqualTo(TriageLevel.YELLOW);
        }

        @Test
        @DisplayName("temperature ≥ 38.0 → YELLOW")
        void elevatedTemperature() {
            CheckupRequest req = new CheckupRequest(null, null, null, 38.0, null, null, null);
            assertThat(triageService.calculateTriage(req)).isEqualTo(TriageLevel.YELLOW);
        }

        @Test
        @DisplayName("heart rate ≥ 100 → YELLOW")
        void elevatedHeartRate() {
            CheckupRequest req = new CheckupRequest(null, null, null, null, 100, null, null);
            assertThat(triageService.calculateTriage(req)).isEqualTo(TriageLevel.YELLOW);
        }

        @Test
        @DisplayName("blood sugar ≥ 7.8 → YELLOW")
        void elevatedBloodSugar() {
            CheckupRequest req = new CheckupRequest(null, null, 7.8, null, null, null, null);
            assertThat(triageService.calculateTriage(req)).isEqualTo(TriageLevel.YELLOW);
        }
    }

    // -------------------------------------------------------------------- RED
    @Nested
    @DisplayName("RED triage")
    class RedTriage {

        @Test
        @DisplayName("systolic ≥ 160 → RED")
        void veryHighSystolicBP() {
            CheckupRequest req = new CheckupRequest(160, null, null, null, null, null, null);
            assertThat(triageService.calculateTriage(req)).isEqualTo(TriageLevel.RED);
        }

        @Test
        @DisplayName("temperature ≥ 39.0 → RED")
        void veryHighTemperature() {
            CheckupRequest req = new CheckupRequest(null, null, null, 39.0, null, null, null);
            assertThat(triageService.calculateTriage(req)).isEqualTo(TriageLevel.RED);
        }

        @Test
        @DisplayName("heart rate ≥ 120 → RED")
        void veryHighHeartRate() {
            CheckupRequest req = new CheckupRequest(null, null, null, null, 120, null, null);
            assertThat(triageService.calculateTriage(req)).isEqualTo(TriageLevel.RED);
        }

        @Test
        @DisplayName("blood sugar ≥ 11.0 → RED")
        void veryHighBloodSugar() {
            CheckupRequest req = new CheckupRequest(null, null, 11.0, null, null, null, null);
            assertThat(triageService.calculateTriage(req)).isEqualTo(TriageLevel.RED);
        }

        @Test
        @DisplayName("RED takes priority over YELLOW thresholds")
        void redBeatsYellow() {
            // systolic 160 is RED even if other values are in YELLOW range
            CheckupRequest req = new CheckupRequest(160, null, 7.8, 38.0, 100, null, null);
            assertThat(triageService.calculateTriage(req)).isEqualTo(TriageLevel.RED);
        }
    }

    // ---------------------------------------------------------- triageToRisk
    @Nested
    @DisplayName("triageToRisk mapping")
    class TriageToRisk {

        @Test
        void green_mapsTo_low() {
            assertThat(triageService.triageToRisk(TriageLevel.GREEN)).isEqualTo(RiskLevel.LOW);
        }

        @Test
        void yellow_mapsTo_medium() {
            assertThat(triageService.triageToRisk(TriageLevel.YELLOW)).isEqualTo(RiskLevel.MEDIUM);
        }

        @Test
        void red_mapsTo_high() {
            assertThat(triageService.triageToRisk(TriageLevel.RED)).isEqualTo(RiskLevel.HIGH);
        }
    }
}