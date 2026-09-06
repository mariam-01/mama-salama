package com.mamasalama.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mamasalama.dto.request.AiAskRequest;
import com.mamasalama.dto.response.AiResponse;
import com.mamasalama.dto.response.ChatHistoryResponse;
import com.mamasalama.dto.response.VoiceAiResponse;
import com.mamasalama.entity.ChatHistory;
import com.mamasalama.entity.Checkup;
import com.mamasalama.entity.EmergencyAlert;
import com.mamasalama.entity.PatientProfile;
import com.mamasalama.entity.User;
import com.mamasalama.enums.AlertSource;
import com.mamasalama.enums.Language;
import com.mamasalama.enums.Supplement;
import com.mamasalama.enums.TriageLevel;
import com.mamasalama.exception.ResourceNotFoundException;
import com.mamasalama.repository.ChatHistoryRepository;
import com.mamasalama.repository.CheckupRepository;
import com.mamasalama.repository.EmergencyAlertRepository;
import com.mamasalama.repository.PatientProfileRepository;
import com.mamasalama.repository.UserRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final AiServiceClient aiServiceClient;
    private final RestClient aiRestClient;
    private final ObjectMapper objectMapper;
    private final ChatHistoryRepository chatHistoryRepository;
    private final UserRepository userRepository;
    private final PatientProfileRepository profileRepository;
    private final CheckupRepository checkupRepository;
    private final EmergencyAlertRepository alertRepository;

    @Transactional
    public AiResponse ask(AiAskRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        PatientProfile profile = profileRepository.findByUser(user).orElse(null);
        Checkup lastRed = checkupRepository
                .findFirstByPatientAndTriageLevelOrderByCreatedAtDesc(user, TriageLevel.RED)
                .orElse(null);

        AiServiceClient.ChatResponse aiResponse = aiServiceClient.chat(
                new AiServiceClient.ChatRequest(
                        request.getQuestion(),
                        toLangCode(request.getLanguage()),
                        buildPatientContext(profile),
                        buildAlertContext(lastRed)
                )
        );

        chatHistoryRepository.save(ChatHistory.builder()
                .user(user)
                .question(request.getQuestion())
                .answer(aiResponse.answer())
                .build());

        if (aiResponse.emergencyDetected() && profile != null) {
            createChatbotAlert(profile, aiResponse.triggerMessage());
        }

        return AiResponse.builder()
                .answer(aiResponse.answer())
                .source(aiResponse.source())
                .build();
    }

    public List<ChatHistoryResponse> getHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return chatHistoryRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(ChatHistoryResponse::from)
                .toList();
    }

    @Transactional
    public VoiceAiResponse voiceAsk(MultipartFile audio, Language language, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        PatientProfile profile = profileRepository.findByUser(user).orElse(null);
        Checkup lastRed = checkupRepository
                .findFirstByPatientAndTriageLevelOrderByCreatedAtDesc(user, TriageLevel.RED)
                .orElse(null);

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", audio.getResource());
            body.add("language", toLangCode(language));
            if (profile != null) {
                body.add("patient_context", objectMapper.writeValueAsString(buildPatientContext(profile)));
            }
            if (lastRed != null) {
                body.add("alert_context", objectMapper.writeValueAsString(buildAlertContext(lastRed)));
            }

            PythonVoiceChatResponse aiResponse = aiRestClient.post()
                    .uri("/api/voice-chat")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(PythonVoiceChatResponse.class);

            chatHistoryRepository.save(ChatHistory.builder()
                    .user(user)
                    .question("[Voice] " + aiResponse.transcription())
                    .answer(aiResponse.answer())
                    .build());

            if (aiResponse.emergencyDetected() && profile != null) {
                createChatbotAlert(profile, aiResponse.triggerMessage());
            }

            return VoiceAiResponse.builder()
                    .transcription(aiResponse.transcription())
                    .answer(aiResponse.answer())
                    .source(aiResponse.source())
                    .build();

        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize patient context", e);
        }
    }

    private record PythonVoiceChatResponse(
            String transcription,
            String answer,
            String source,
            @JsonProperty("rag_available") boolean ragAvailable,
            @JsonProperty("emergency_detected") boolean emergencyDetected,
            @JsonProperty("trigger_message") String triggerMessage
    ) {}

    private void createChatbotAlert(PatientProfile profile, String triggerMessage) {
        try {
            var prefecture = profile.getPrefecture() != null ? profile.getPrefecture() : profile.getRegion();
            EmergencyAlert alert = EmergencyAlert.builder()
                    .patient(profile)
                    .source(AlertSource.CHATBOT)
                    .triggerMessage(triggerMessage)
                    .patientCity(profile.getCity())
                    .patientPrefecture(prefecture)
                    .build();
            alertRepository.save(alert);
            log.info("Emergency alert auto-created via chatbot for patient {}", profile.getUser().getEmail());
        } catch (Exception e) {
            log.error("Failed to create chatbot emergency alert: {}", e.getMessage());
        }
    }

    private AiServiceClient.PatientContextDto buildPatientContext(PatientProfile profile) {
        if (profile == null) return null;
        Integer week = profile.getPregnancyWeekCalculated() != null
                ? profile.getPregnancyWeekCalculated() : profile.getPregnancyWeek();
        String dueDate = profile.getDueDate() != null
                ? profile.getDueDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : null;
        String bloodType = profile.getBloodType() != null
                ? profile.getBloodType().name().replace("_", " ") : null;
        String followUp = profile.getFollowUpType() != null
                ? profile.getFollowUpType().name() : null;

        return new AiServiceClient.PatientContextDto(
                week,
                bloodType,
                profile.getWeight(),
                profile.getHeight(),
                dueDate,
                profile.getNumberOfPreviousPregnancies(),
                profile.getNumberOfChildren(),
                profile.getMultiplePregnancy(),
                followUp,
                supplementNames(profile.getSupplements()),
                profile.getMedicalHistory(),
                profile.getAllergies()
        );
    }

    private AiServiceClient.AlertContextDto buildAlertContext(Checkup checkup) {
        if (checkup == null) {
            return new AiServiceClient.AlertContextDto(false, null, null, null, null, null, null);
        }
        String date = checkup.getCreatedAt() != null
                ? checkup.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : null;
        return new AiServiceClient.AlertContextDto(
                true,
                date,
                checkup.getSystolicBP(),
                checkup.getDiastolicBP(),
                checkup.getTemperature(),
                checkup.getHeartRate(),
                checkup.getBloodSugar()
        );
    }

    private List<String> supplementNames(Set<Supplement> supplements) {
        if (supplements == null || supplements.isEmpty()) return List.of();
        return supplements.stream().map(Supplement::name).toList();
    }

    private String toLangCode(Language language) {
        if (language == null) return "fr";
        return switch (language) {
            case FRENCH  -> "fr";
            case ARABIC  -> "ar";
            case DARIJA  -> "darija";
            case AMAZIGH -> "amazigh";
            case ENGLISH -> "en";
        };
    }
}