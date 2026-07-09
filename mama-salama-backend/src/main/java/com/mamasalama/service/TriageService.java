package com.mamasalama.service;

import com.mamasalama.dto.request.CheckupRequest;
import com.mamasalama.enums.RiskLevel;
import com.mamasalama.enums.TriageLevel;
import org.springframework.stereotype.Service;

@Service
public class TriageService {

    public TriageLevel calculateTriage(CheckupRequest req) {
        if (isRed(req)) return TriageLevel.RED;
        if (isYellow(req)) return TriageLevel.YELLOW;
        return TriageLevel.GREEN;
    }

    public RiskLevel triageToRisk(TriageLevel triage) {
        return switch (triage) {
            case RED    -> RiskLevel.HIGH;
            case YELLOW -> RiskLevel.MEDIUM;
            case GREEN  -> RiskLevel.LOW;
        };
    }

    // WHO thresholds — RED: immediate danger
    private boolean isRed(CheckupRequest req) {
        return (req.getSystolicBP()  != null && req.getSystolicBP()  >= 160)
            || (req.getTemperature() != null && req.getTemperature() >= 39.0)
            || (req.getHeartRate()   != null && req.getHeartRate()   >= 120)
            || (req.getBloodSugar()  != null && req.getBloodSugar()  >= 11.0);
    }

    // WHO thresholds — YELLOW: close monitoring needed
    private boolean isYellow(CheckupRequest req) {
        return (req.getSystolicBP()  != null && req.getSystolicBP()  >= 140)
            || (req.getTemperature() != null && req.getTemperature() >= 38.0)
            || (req.getHeartRate()   != null && req.getHeartRate()   >= 100)
            || (req.getBloodSugar()  != null && req.getBloodSugar()  >= 7.8);
    }
}