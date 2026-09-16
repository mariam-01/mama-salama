# Mama Salama — Project Status

_Last updated: 2026-07-09_

---

## Folder Structure

```
mama-salama/
├── service-discovery/          Spring Boot 3.4.6 — Eureka Server (:8761)
├── service-gateway/            Spring Boot 3.5.3 — API Gateway (:8080)
├── mama-salama-backend/        Spring Boot 3.5.3 — Main backend (:8081)
│   └── src/main/java/com/mamasalama/
│       ├── config/             SecurityConfig, JwtAuthFilter, CorsConfig, JpaConfig, OpenApiConfig
│       ├── controller/         AuthController, PatientController, CheckupController, AiController
│       ├── dto/request/        RegisterRequest, LoginRequest, OtpVerifyRequest, ForgotPasswordRequest,
│       │                       ResetPasswordRequest, PatientProfileRequest, CheckupRequest, AiAskRequest
│       ├── dto/response/       ApiResponse, AuthResponse, RegisterResponse, PatientProfileResponse,
│       │                       CheckupResponse, AiResponse, ChatHistoryResponse
│       ├── entity/             User, PatientProfile, Checkup, OtpToken, ChatHistory,
│       │                       RiskPrediction, DoctorNote
│       ├── enums/              Role, BloodType, TriageLevel, RiskLevel, Language,
│       │                       FollowUpType, Supplement, OtpChannel
│       ├── exception/          GlobalExceptionHandler, AuthException, ResourceNotFoundException,
│       │                       ValidationException
│       ├── repository/         UserRepository, PatientProfileRepository, CheckupRepository,
│       │                       OtpTokenRepository, ChatHistoryRepository, RiskPredictionRepository
│       ├── rag/                MedicalDocumentIngestor  ← fully commented out (dead)
│       └── service/            AuthService, JwtService, PatientProfileService, CheckupService,
│                               TriageService, SmsService, EmailService, AiService, AiServiceClient
│
├── mama-salama-ai/             FastAPI (Python 3.11) — AI service (:8000)
│   ├── main.py                 FastAPI app + Eureka registration
│   ├── api/routes.py           /api/chat, /api/ingest, /api/ingest/pdf, /api/health
│   ├── agents/rag_agent.py     ChromaDB init, retrieval, ingestion
│   ├── chatbot/chain.py        LangChain chain (GPT-4o-mini)
│   ├── chatbot/prompts.py      Multilingual system prompt builder
│   └── config/settings.py     Pydantic settings (.env)
│
└── ARCHITECTURE.md
```

---

## All API Endpoints

> All endpoints are accessed through the gateway at `http://localhost:8080`.
> Swagger UI: `http://localhost:8080/api/swagger-ui.html`

### Authentication — public, no token required

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user, triggers OTP |
| POST | `/api/auth/verify-otp` | Verify OTP → activate account + receive JWT |
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/forgot-password` | Send password reset OTP |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| POST | `/api/auth/resend-otp/{userId}?channel=` | Resend OTP (EMAIL or SMS) |

### Patient Profile — `Bearer` required

| Method | Path | Description |
|---|---|---|
| GET | `/api/patient/profile` | Get own profile |
| POST | `/api/patient/profile` | Create profile |
| PUT | `/api/patient/profile` | Update profile |

### Checkup — `Bearer` required

| Method | Path | Description |
|---|---|---|
| POST | `/api/pregnancy/checkup` | Submit vitals → auto-triage (GREEN/YELLOW/RED) |
| GET | `/api/pregnancy/checkup/history` | All checkups for current user |
| GET | `/api/pregnancy/checkup/latest` | Most recent checkup |

### AI Chatbot — `Bearer` required

| Method | Path | Description |
|---|---|---|
| POST | `/api/ai/ask` | Ask a pregnancy question → delegates to Python service |
| GET | `/api/ai/history` | Chat history for current user |

### Python AI Service — via gateway `/ai/**` or direct at `:8000`

| Method | Path | Description |
|---|---|---|
| POST | `/api/chat` | RAG chat with patient + alert context |
| POST | `/api/ingest` | Ingest raw text chunks into ChromaDB |
| POST | `/api/ingest/pdf` | Upload PDF → extract + index to ChromaDB |
| GET | `/api/health` | Health check (RAG ready, LLM ready) |

---

## Database Schema

| Table | Key columns |
|---|---|
| `users` | `id (UUID)`, `email`, `password` (BCrypt), `phone`, `role`, `enabled`, `created_at` |
| `patient_profiles` | `id`, `user_id` (FK 1-1), `pregnancy_week`, `due_date`, `blood_type`, `weight`, `height`, `follow_up_type`, `supplements` (set), `medical_history`, `allergies`, `multiple_pregnancy`, `prev_pregnancies`, `children` |
| `checkups` | `id`, `patient_id` (FK), `systolic_bp`, `diastolic_bp`, `temperature`, `heart_rate`, `blood_sugar`, `symptoms`, `notes`, `triage_level`, `risk_level`, `created_at` |
| `otp_tokens` | `id`, `user_id` (FK), `code`, `channel` (EMAIL/SMS), `expires_at`, `used` |
| `chat_histories` | `id`, `user_id` (FK), `question`, `answer`, `created_at` |
| `risk_predictions` | `id`, `user_id` (FK), `risk_level`, `details`, `created_at` — **schema only, no service/controller** |
| `doctor_notes` | `id`, `patient_id` (FK), `doctor_id` (FK), `content`, `created_at` — **schema only, no service/controller** |

---

## Feature Status (F01–F06)

| Feature | Status | Notes |
|---|---|---|
| **F01** Authentication | ✅ Done | Register, login, OTP verify, forgot/reset password, resend OTP |
| **F02** Patient Profile | ✅ Done | Create/get/update, Naegele's rule for due date, supplements set |
| **F03** Daily Checkup + Triage | ✅ Done | Submit vitals, WHO triage (GREEN/YELLOW/RED), history, latest |
| **F04** Risk Prediction | ⚠️ Scaffold only | `RiskPrediction` entity + repository — no service, no controller |
| **F05** Doctor Notes | ⚠️ Scaffold only | `DoctorNote` entity — no service, no controller |
| **F06** AI Chatbot | ✅ Done | `AiController` → `AiService` → Feign → Python RAG service |

---

## FastAPI AI Service

**Fully implemented and connected.**

- `/api/chat`, `/api/ingest`, `/api/ingest/pdf`, `/api/health` all implemented
- Spring backend calls it via `@FeignClient(name = "mama-salama-ai")` with typed snake_case DTOs
- Registers with Eureka on startup via `py-eureka-client`
- Gateway routes `/ai/**` → Python service (strips prefix)

**One action needed:** ChromaDB has no documents yet. RAG returns no context until a PDF is uploaded via `POST /api/ingest/pdf`. The LLM still answers, just without document grounding.

---

## pgvector

**Removed.** No longer used anywhere:

- `spring-ai-starter-vector-store-pgvector` removed from `build.gradle`
- `MedicalDocumentIngestor.java` is fully commented out (dead code)
- No vector data was ever ingested (was gated behind a flag that was never enabled)

Vector storage is **ChromaDB only**, managed by the Python service at `./chroma_db`.

---

## Unit Tests

| Test class | Tests | Coverage |
|---|---|---|
| `TriageServiceTest` | 13 | GREEN/YELLOW/RED thresholds, null vitals, boundary values, `triageToRisk` |
| `AuthServiceTest` | 14 | Register (EMAIL/SMS/duplicate/missing phone), login (success/wrong pw/unknown/unverified), verifyOtp, forgotPassword, resetPassword |
| `CheckupServiceTest` | 8 | Submit with all triage levels, field persistence, unknown user, getHistory, getLatest |
| `PatientProfileServiceTest` | 9 | getProfile (existing/empty/unknown), createProfile, updateProfile (Naegele's rule, pregnancy week, null supplements) |
| `JwtServiceTest` | 6 | Generate, extractUsername, valid/expired/wrong-user/tampered token |
| **Total** | **50** | |

**Not yet tested:**
- `AiService` (requires mocking Feign client)
- `EmailService`, `SmsService`
- All controllers (no `@WebMvcTest` tests)
- `AuthService.resendOtp`