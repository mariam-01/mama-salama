package com.mamasalama.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@FeignClient(name = "mama-salama-ai")
public interface AiServiceClient {

    @PostMapping("/api/chat")
    ChatResponse chat(@RequestBody ChatRequest request);

    @PostMapping("/api/ingest")
    IngestResponse ingest(@RequestBody IngestRequest request);

    @GetMapping("/api/health")
    Map<String, Object> health();

    record ChatRequest(
            String question,
            String language,
            @JsonProperty("patient_context") PatientContextDto patientContext,
            @JsonProperty("alert_context") AlertContextDto alertContext
    ) {}

    record PatientContextDto(
            @JsonProperty("pregnancy_week")                    Integer pregnancyWeek,
            @JsonProperty("blood_type")                        String bloodType,
            Double weight,
            Double height,
            @JsonProperty("due_date")                          String dueDate,
            @JsonProperty("number_of_previous_pregnancies")    Integer numberOfPreviousPregnancies,
            @JsonProperty("number_of_children")                Integer numberOfChildren,
            @JsonProperty("multiple_pregnancy")                Boolean multiplePregnancy,
            @JsonProperty("follow_up_type")                    String followUpType,
            List<String> supplements,
            @JsonProperty("medical_history")                   String medicalHistory,
            String allergies
    ) {}

    record AlertContextDto(
            @JsonProperty("has_red_alert")  boolean hasRedAlert,
            @JsonProperty("alert_date")     String alertDate,
            @JsonProperty("systolic_bp")    Integer systolicBp,
            @JsonProperty("diastolic_bp")   Integer diastolicBp,
            Double temperature,
            @JsonProperty("heart_rate")     Integer heartRate,
            @JsonProperty("blood_sugar")    Double bloodSugar
    ) {}

    record ChatResponse(
            String answer,
            String source,
            @JsonProperty("rag_available") boolean ragAvailable
    ) {}

    record IngestRequest(List<String> texts) {}

    record IngestResponse(int indexed) {}
}