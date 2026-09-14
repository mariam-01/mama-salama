# Mama Salama — Platform Flows

> This document describes every user flow in the platform: what the user does, what API calls are made, what state changes, and what happens next. Organized by role.

---

## Table of Contents

1. [Authentication Flows](#authentication-flows)
   - [Patient Registration + OTP](#patient-registration--otp)
   - [Login (all roles)](#login-all-roles)
   - [Forgot Password](#forgot-password)
   - [Logout](#logout)
2. [Patient Flows](#patient-flows)
   - [Complete Profile](#complete-profile)
   - [Submit a Checkup](#submit-a-checkup)
   - [Chat with AI Assistant](#chat-with-ai-assistant)
   - [Voice Message](#voice-message)
   - [Send SOS Alert](#send-sos-alert)
   - [Cancel an Alert](#cancel-an-alert)
   - [Manage Appointments](#manage-appointments-patient)
3. [Doctor Flows](#doctor-flows)
   - [Dashboard Overview](#dashboard-overview)
   - [Claim an Emergency Alert](#claim-an-emergency-alert)
   - [Resolve an Alert](#resolve-an-alert)
   - [Propose an Appointment](#propose-an-appointment)
   - [Manage Appointments](#manage-appointments-doctor)
   - [View Patient Profile](#view-patient-profile)
   - [Search and Assign a Patient](#search-and-assign-a-patient)
   - [Update Doctor Profile](#update-doctor-profile)
4. [Admin Flows](#admin-flows)
   - [Dashboard Stats](#dashboard-stats)
   - [Browse Patients](#browse-patients)
   - [Browse and Manage Doctors](#browse-and-manage-doctors)
   - [Invite a Doctor](#invite-a-doctor)
   - [Create a Doctor Account Directly](#create-a-doctor-account-directly)
   - [Browse Alerts](#browse-alerts)
   - [Knowledge Base Management](#knowledge-base-management)

---

## Authentication Flows

### Patient Registration + OTP

Only patients register themselves. Doctors are created or invited by the admin.

```
1. User fills: email, phone (optional), password, confirmPassword, OTP channel (EMAIL / SMS)
   POST /auth/register
   ↓
2. Backend creates account (unverified), returns { userId, otpChannel }
   → Frontend saves userId + otpChannel to localStorage
   → Navigates to /otp
   ↓
3. User enters the 6-digit code
   POST /auth/verify-otp { userId, code }
   ↓
4. Backend verifies OTP, returns { token, userId, role: "PATIENT" }
   → AuthContext.login(token, userId, "PATIENT")
   → token + userId + role written to localStorage
   → Navigates to /profile
```

**Resend OTP:** The OTP page shows a 120-second countdown. When it expires, "Renvoyer le code" becomes active.
```
POST /auth/resend-otp/:userId
```
No response data needed — the button re-disables and the countdown resets.

**Error states:**
- Wrong code → backend returns 400 with message → shown inline below the OTP boxes
- Expired code → same; user must resend

---

### Login (all roles)

```
1. User fills: email, password
   POST /auth/login { email, password }
   ↓
2. Backend returns { token, userId, role }
   → AuthContext.login(token, userId, role)
   → Navigates based on role:
       PATIENT  → /profile
       DOCTOR   → /doctor/dashboard
       ADMIN    → /admin/dashboard
```

**Error:** Wrong credentials → 401 → error message shown under the form. The interceptor does NOT redirect on this 401 because the login call uses `publicClient`, not `apiClient`.

---

### Forgot Password

Two-step flow. The user never leaves the same page — step progression is managed with local `useState`.

```
Step 1 — Request OTP
  User fills: email, OTP channel (EMAIL / SMS)
  POST /auth/forgot-password { email, otpChannel }
  ↓
  Backend sends OTP, returns { userId }
  → Frontend stores userId in component state
  → Advances to Step 2 UI
  → 10-minute countdown begins

Step 2 — Reset Password
  User fills: 6-digit OTP, new password, confirm password
  POST /auth/reset-password { userId, code, newPassword, confirmPassword }
  ↓
  Backend verifies OTP + resets password, returns { token, userId, role }
  → AuthContext.login(token, userId, role)
  → Navigates to role home (/profile, /doctor/dashboard, or /admin/dashboard)
```

**confirmPassword** is validated client-side by Zod (`refine`) and never sent to the server. It is destructured out before the API call.

---

### Logout

```
User clicks "Déconnexion" in the sidebar
→ AuthContext.logout()
   → localStorage.removeItem('token')
   → localStorage.removeItem('userId')
   → localStorage.removeItem('role')
   → React state cleared
→ Navigate to /login
```

TanStack Query cache is NOT explicitly cleared on logout. On next login the cache will be stale and will refetch automatically (staleTime: 5 min means it refetches if the data is older than 5 min).

---

## Patient Flows

### Complete Profile

Triggered automatically after registration (redirect to /profile) or manually via the Profil nav link.

```
1. Page mounts → GET /patient/profile (wrapped ApiResponse<PatientProfile>)
   → react-hook-form.reset(profile) populates all fields

2. User fills: fullName, age, weight, height,
               région (dropdown) → ville (dropdown, depends on région)
                                 → préfecture (dropdown, appears only for major villes)
               milieu (Urbain / Rural), DDR (date), pregnancy week (slider),
               gestité, parité, multiple pregnancy toggle, blood type,
               medical history chips, follow-up type, supplements chips, allergies

3. User clicks "Enregistrer"
   PUT /patient/profile (wrapped)
   ↓
   Success → toast notification + navigate to /checkup after 800ms
```

**Pregnancy week badge:** The API returns `pregnancyWeekCalculated` (computed from DDR server-side). If present it is shown as a computed badge next to the slider. If absent, the frontend computes it from the DDR value using `Math.round(daysSinceLastPeriod / 7)`.

**Due date (DPA):** If DDR is set, the expected delivery date (`dueDate` from API) is shown below the DDR input. If pregnancy week is set via slider, `dueDateFromWeek` is shown below the slider. Both formatted as DD/MM/YYYY.

**Région → Ville → Préfecture hierarchy:**
- Changing région clears ville and préfecture
- Changing ville clears préfecture
- Préfecture dropdown only appears for major urban villes (Casablanca, Rabat, Fès, etc.)
- Ville is stored in the `province` field; Préfecture is stored in `arrondissement`

---

### Submit a Checkup

```
1. User fills one or more vitals:
   - Tension systolique / diastolique (mmHg)
   - Glycémie (g/L)
   - Température (°C)
   - Fréquence cardiaque (bpm)

   Submit button is disabled until at least one field has a value.

2. User clicks "Analyser"
   POST /checkup { systolicBP?, diastolicBP?, bloodSugar?, temperature?, heartRate? }
   ↓
3. Backend runs triage algorithm, returns:
   { triageLevel: "GREEN" | "YELLOW" | "RED", message, factors[] }

4. Result card appears:
   - GREEN  → reassuring message (sage/green styling)
   - YELLOW → moderate concern, suggests consultation (amber styling)
   - RED    → urgent concern, strongly recommends care (rose/red styling)

   Factor bars show the relative risk weight of each filled vital.

5. "En parler avec l'assistant" button:
   - If result exists: builds a French prompt from the vitals and result,
     navigates to /chat with { state: { autoPrompt: "..." } }
   - If no result yet: navigates to /chat without state

6. Submit button re-disables after submission.
   It re-enables only when the user edits any field.
   This prevents accidental double submission.

7. History charts below the form show past values from:
   GET /checkup/history → 4 Recharts graphs (tension, glycémie, température, fréquence)
```

---

### Chat with AI Assistant

```
1. Page loads → GET /ai/history (past conversations)
   History is collapsed by default; "Historique" toggle shows it.

2. User types a question + clicks Send (or presses Enter)
   POST /ai/ask { question, language: "FRENCH" | "ARABIC" }
   ↓
   Response: { answer, source? }
   → Message pair added to sessionMessages (local state)

3. Language selector (FR / AR) in the sidebar changes the `language` field
   sent on the next message. Does not reload history.

4. Quick prompt chips below the input pre-fill the text field.

5. Alert detection: if the answer contains certain keywords
   ("urgence", "immédiatement", "appelez le 15", "samu", "urgent"
    but NOT "pas urgent"), the response bubble gets ⚠️ styling
   to visually signal a critical situation.

6. Source label: if the API returns a `source` field, it is shown
   in small text below the answer (e.g. "Source: WHO guidelines").

7. Text-to-speech button per answer: reads aloud using the
   Web Speech API (SpeechSynthesis). Button shows pause icon while playing.
```

**Auto-send from Checkup:**
```
CheckupPage navigates → /chat with { state: { autoPrompt: "Voici mes résultats..." } }
  ↓
ChatPage useEffect (runs once on mount):
  - Reads location.state.autoPrompt
  - If present, calls send() once
  - A useRef flag prevents React StrictMode's double-invocation from sending twice
  - window.history.replaceState({}, '') clears the state so a page refresh
    does not re-send the same prompt
```

---

### Voice Message

```
1. User clicks the mic button
   → navigator.mediaDevices.getUserMedia({ audio: true })
   → MediaRecorder starts (mimeType: audio/webm, fallback audio/mp4)
   → Mic button shows pulsing stop icon
   → Text input + Send button disabled during recording

2. User clicks the stop button (same mic button)
   → MediaRecorder.stop()
   → onstop handler: assembles audio chunks into one Blob
   → Shows spinner (API call in progress)

3. POST /ai/ask-voice (multipart/form-data, field: "file")
   ↓
   Response: { answer, transcribedText, source? }

4. Question bubble shows: "Vous avez demandé : «{transcribedText}»"
   (so user can verify what Whisper transcribed)
   Answer bubble shows the AI response.
   Source label shown if present.
```

---

### Send SOS Alert

Accessible via the 🆘 SOS button in the ChatPage header.

```
1. User clicks SOS button
   → SOS modal opens

2. Optional: user types a note describing the emergency
   (textarea, max 500 chars, character counter shown)

3. User clicks "Envoyer l'alerte"
   POST /emergency { source: "MANUAL", triggerMessage?: note }
   ↓
4. Backend:
   - Creates an EmergencyAlert record (status: PENDING)
   - Finds doctors in the same geographic area as the patient
   - Notifies matched doctors (they appear in their dashboard queue)

5. Modal closes, note is cleared (setSosNote(''))
   Success feedback shown to user.
```

**Alert lifecycle from patient perspective:**
```
PENDING   → alert sent, waiting for a doctor to claim it
CLAIMED   → a doctor has taken charge
RESOLVED  → doctor marked it resolved
CANCELLED → patient cancelled it (see below)
```

---

### Cancel an Alert

From the ChatPage (cancel button visible while alert is PENDING or CLAIMED):

```
PUT /emergency/:id/cancel
→ Alert status → CANCELLED
→ UI updates
```

---

### Manage Appointments (Patient)

Accessible via the Rendez-vous tab in the nav.

```
Page loads → GET /appointments/patient → list of appointments

Filter tabs: Tous / À confirmer (count badge) / Confirmés / Terminés

For each PROPOSED appointment:
  ┌─ If multiple slots were proposed:
  │   → Slot picker dropdown (user selects preferred slot)
  └─ Single slot: displayed directly

  "Confirmer ce créneau"
    PUT /appointments/:id/confirm { slotId }
    → status → CONFIRMED
    → cache invalidated → list refreshes

  "Refuser"
    PUT /appointments/:id/reject
    → status → REJECTED

For CONFIRMED appointments:
  "Annuler ce rendez-vous"
    PUT /appointments/:id/cancel
    → status → CANCELLED

Doctor info block (shown when doctor name is available):
  - Dr. {doctorFullName ?? doctorName}
  - Email: mailto link
  - Phone: tel link
  (These fields depend on backend including them in the response DTO)
```

---

## Doctor Flows

### Dashboard Overview

```
Page mounts — three parallel queries:

1. GET /emergency/pending     (refetchInterval: 30 seconds)
   → Emergency alert queue

2. GET /doctors/patients
   → Assigned patients list (first 4 shown in "Mes Patients récents")

3. GET /appointments/doctor
   → All appointments (count pending ones for the summary card)

Summary cards:
  🚨 Alertes actives  = alerts where status === 'PENDING'
  📅 RDV en attente   = appointments where status === 'PROPOSED'
  👩 Patients assignés = patients.length
```

---

### Claim an Emergency Alert

This is the primary doctor emergency workflow.

```
1. Alert appears in the queue (auto-refreshed every 30 seconds)
   Card shows: patient name (clickable), city, pregnancy week (SA),
               source badge (Manuel / Chatbot), trigger message, time ago

2. Doctor clicks patient name
   → navigate('/doctor/patients/:patientId')
   → Opens patient profile/detail in the DoctorPatients page

3. Doctor clicks "Prendre en charge"
   → setClaimingPatientId(alert.patientId)  [stored in component state]
   → PUT /emergency/:id/claim
   ↓
   onSuccess:
   → cache invalidated (alert disappears from queue)
   → navigate('/doctor/appointments', { state: { patientId: claimingPatientId } })

4. DoctorAppointments page receives state.patientId
   → prefilledPatientId = routerLocation.state?.patientId
   → setPatientId(prefilledPatientId)       [pre-selects in dropdown]
   → setShowForm(true)                       [opens "Proposer un RDV" form]

5. Doctor fills in slot(s), type, location, notes and submits
   → See "Propose an Appointment" flow below
```

**Why `routerLocation` (not `location`):** The appointments page has a local state variable `const [location, setLocation] = useState('')` for the appointment venue field. Using `const location = useLocation()` for the router hook would cause a variable name clash. So the router hook is aliased to `routerLocation`.

---

### Resolve an Alert

For alerts the doctor already claimed (status: CLAIMED):

```
Doctor clicks "Marquer résolu"
PUT /emergency/:id/resolve
→ status → RESOLVED
→ Alert disappears from the PENDING/CLAIMED queue
→ Still visible in admin's alert list under "Résolue"
```

---

### Propose an Appointment

```
1. Doctor clicks "+ Proposer un RDV"
   → form panel slides open
   → GET /doctors/patients fires (enabled only when form is open)
      to populate the patient dropdown

2. Doctor fills:
   - Patient (required) — always a <select> dropdown
   - Type: Consultation médicale / Suivi de grossesse / Urgence
   - Lieu / Établissement (required) — free text (e.g. "CHU Ibn Rochd, Casablanca")
   - Créneau principal: date + time (required)
   - Up to 2 alternative slots (optional) — "Ajouter un créneau alternatif"
   - Notes (optional)

3. "Envoyer la proposition"
   POST /appointments {
     patientId, type, location, notes?,
     slots: ["2025-09-10T14:00", ...]   (ISO datetime strings)
   }
   ↓
   onSuccess:
   → cache invalidated
   → form closes, all fields reset
   → new appointment appears in the list with status PROPOSED
   → patient sees it in their /appointments page and can confirm/reject
```

**Pre-filled from alert claim:** If the doctor arrived here via "Prendre en charge", the patient dropdown is already selected and the form is already open. The doctor only needs to fill in the slot and location.

---

### Manage Appointments (Doctor)

```
Page loads → GET /appointments/doctor

Filter tabs: Tous / En attente (count) / Confirmés / Terminés

For PROPOSED appointments (waiting for patient confirmation):
  No doctor action available — the patient must confirm or reject.
  Card shows: "{slots.length} créneaux proposés — en attente de confirmation"

For CONFIRMED appointments:
  "Marquer terminé"
    PUT /appointments/:id/complete
    → status → COMPLETED

  "Annuler"
    PUT /appointments/:id/cancel
    → status → CANCELLED

For COMPLETED / CANCELLED / REJECTED:
  Card is read-only (no buttons).
```

---

### View Patient Profile

```
From DoctorPatients page or from an alert card's patient name link:

GET /doctors/patients/:patientId   (wrapped ApiResponse<PatientDetail>)

PatientDetail contains:
  profile        → full PatientProfile (same shape as the patient's own profile)
  checkupHistory → array of past checkups with triage levels

Display:
  - Personal info: name, age, weight, height, blood type
  - Location: région, ville, préfecture
  - Pregnancy: DDR, pregnancy week, gestité/parité, multiple pregnancy
  - Medical: history, supplements, allergies, follow-up type
  - Last checkup: triage badge + vitals
  - Checkup history list
```

---

### Search and Assign a Patient

From DoctorPatients — "Trouver un patient" tab:

```
1. Doctor types a name or email
   GET /doctors/patients/search?query=...
   → Returns DoctorPatient[] matching the query

2. Doctor clicks "Assigner" on a result
   POST /doctors/patients/:patientId/assign
   → Patient is added to the doctor's assigned list
   → Appears in GET /doctors/patients going forward
```

---

### Update Doctor Profile

```
Page loads → GET /doctors/me (wrapped)
→ form populated with: fullName, specialty, hospital,
                        région, ville (stored as `city`),
                        préfecture (stored as `province`)

User edits fields and submits:
PUT /doctors/me { fullName, specialty, hospital, region, city, province }
↓
Success → toast notification, cache invalidated
```

**Field name note:** For doctors, the `city` field stores the Ville (major city, e.g. "Casablanca") and `province` stores the Préfecture (sub-area, e.g. "Aïn Chock"). This is the inverse of the patient schema where `province` = Ville and `arrondissement` = Préfecture. The UI labels are identical (Ville / Préfecture) for both roles.

---

## Admin Flows

### Dashboard Stats

```
Page loads → GET /admin/stats
Returns:
  patientCount            → total registered patients
  doctorCount             → total registered doctors
  pendingAlertCount       → alerts with status PENDING
  proposedAppointmentCount → appointments with status PROPOSED
  documentCount           → knowledge base documents
```

All five are displayed as stat cards. No action is possible from this page.

---

### Browse Patients

```
Page loads → GET /admin/patients
(optional: GET /admin/patients?search=... for filtered results)

Table columns:
  Nom (fullName), Email, Téléphone, Région, Ville (province),
  Préfecture (arrondissement), Semaine grossesse (SA)

No patient editing is available from this view — it is read-only.
```

---

### Browse and Manage Doctors

Three tabs on the same page:

**Tab 1 — Liste des médecins**
```
GET /admin/doctors (optional ?search=)

Table columns:
  Nom, Email, Ville · Province, Spécialité, Patients (count), Statut, Actions

Statut badge:
  enabled: true  → "Actif"  (sage green)
  enabled: false → "Inactif" (grey)

Toggle button:
  "Désactiver" (shown when enabled: true)
    PUT /admin/doctors/:id/status { active: false }
    → enabled flips to false → badge updates

  "Réactiver" (shown when enabled: false)
    PUT /admin/doctors/:id/status { active: true }
    → enabled flips to true → badge updates

  After either action → cache invalidated → table refreshes
```

**Tab 2 — Invitations envoyées** (see [Invite a Doctor](#invite-a-doctor))

**Tab 3 — Créer directement** (see [Create a Doctor Account Directly](#create-a-doctor-account-directly))

---

### Invite a Doctor

Preferred method for onboarding new doctors. The doctor receives an email with a signup link.

```
1. Admin fills:
   - Email (required)
   - Prénom, Nom de famille
   - Ville, Préfecture
   - Établissement (hospital)

2. Admin clicks "Envoyer l'invitation"
   POST /admin/invite-codes {
     email, firstName?, lastName?, city?, prefecture?, hospital?
   }
   ↓
3. Backend sends an email to the doctor with a one-time signup link.
   Link expires in 48 hours.

4. Success banner: "Invitation envoyée à {email}. Le lien expire dans 48h."
   Form resets.

5. Invitation list below the form (GET /admin/invite-codes) shows:
   Email, Nom, Établissement, Ville, Statut (En attente / Accepté),
   Envoyé le, Expire le

6. When the doctor clicks the email link:
   → They land on a registration page pre-filled with their info
   → They set their password
   → Account is created with role DOCTOR
   → Invite status changes to ACCEPTED
```

---

### Create a Doctor Account Directly

Alternative to invitation — creates the account immediately without an email flow. The doctor will have no password initially and will need to use "Forgot Password" to set one.

```
1. Admin fills:
   - Nom complet (required)
   - Email (required)
   - Ville, Préfecture, Spécialité

2. Admin clicks "Créer le compte"
   POST /admin/doctors { fullName, email, city?, prefecture?, specialty? }
   ↓
3. Account created instantly with role DOCTOR.
   → Tab switches back to "Liste des médecins"
   → New doctor appears in the table
```

---

### Browse Alerts

Read-only view for the admin. No claim/resolve actions — those belong to doctors.

```
Page loads → GET /admin/alerts (no status filter by default = all alerts)

Filter tabs:
  Toutes / En attente / Prise en charge / Résolue / Annulée
  Each click → GET /admin/alerts?status=PENDING|CLAIMED|RESOLVED|CANCELLED

Each alert card shows:
  - Status badge + source badge (Manuel / Chatbot)
  - Created at timestamp
  - Patient: fullName, email, ville, province, semaine grossesse (SA)
  - Matched doctors count (how many doctors were notified)
  - Trigger message (the note the patient wrote, if any)
  - Claimed by: doctor email + claimed timestamp (if CLAIMED or RESOLVED)
```

---

### Knowledge Base Management

The admin manages the documents that power the AI assistant's medical knowledge.

```
Page loads → GET /admin/knowledge-base
Returns list of KBDocument:
  { id, filename, language, status, chunkCount, uploadedAt }

status values:
  PENDING    → uploaded, waiting to be processed
  PROCESSING → being vectorized/chunked
  DONE       → available to the AI assistant
  FAILED     → processing failed

Upload a document:
  Admin selects a file + language (FRENCH / ARABIC / ENGLISH)
  POST /admin/knowledge-base (multipart/form-data: file + language)
  → New document appears with status PENDING
  → Backend processes asynchronously → status updates to DONE

Delete a document:
  DELETE /admin/knowledge-base/:id
  → Document removed from AI's knowledge base
  → Cache invalidated → list refreshes
```

---

## Alert Status State Machine

```
                     Patient sends SOS
                           │
                           ▼
                        PENDING  ←──────────────────────────────┐
                           │                                     │
              ┌────────────┼────────────────┐                   │
              ▼            ▼                ▼                   │
         (patient)    (doctor)         (timeout?)               │
         CANCELLED    CLAIMED                                    │
                         │                                       │
                    (doctor action)                              │
                    RESOLVED                                     │
```

Only doctors can move an alert from PENDING → CLAIMED and CLAIMED → RESOLVED.  
Only patients can move PENDING → CANCELLED.

---

## Appointment Status State Machine

```
                     Doctor proposes
                           │
                           ▼
                        PROPOSED
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           (patient)   (patient)    (doctor/patient)
          CONFIRMED    REJECTED      CANCELLED
              │
         (doctor)
        COMPLETED
```

- **PROPOSED:** Doctor has sent the proposal; patient must act.
- **CONFIRMED:** Patient accepted a slot.
- **REJECTED:** Patient refused all slots.
- **COMPLETED:** Doctor marked the visit done (only from CONFIRMED).
- **CANCELLED:** Either role cancelled (from PROPOSED or CONFIRMED).

Terminal states: REJECTED, COMPLETED, CANCELLED — no further actions possible.

---

## Cross-Role Interactions

```
PATIENT                         DOCTOR                          ADMIN
  │                               │                               │
  │──── fills profile ────────────┤                               │
  │                               │◄── admin views patients ──────┤
  │                               │                               │
  │──── submits checkup ──────────┤                               │
  │     (triage result)           │◄── sees triage badge ─────────┤
  │                               │    on patient card            │
  │──── sends SOS alert ──────────►                               │
  │                               │─── claims alert ──────────────►
  │                               │    (status: CLAIMED)          │
  │                               │─── resolves alert ────────────►
  │                               │    (status: RESOLVED)         │
  │                               │                               │
  │◄─── doctor proposes RDV ──────┤                               │
  │     (status: PROPOSED)        │                               │
  │──── patient confirms ─────────►                               │
  │     (status: CONFIRMED)       │                               │
  │                               │─── doctor marks done ─────────►
  │                               │    (status: COMPLETED)        │
  │                               │                               │
  │                               │◄── admin enables/disables ────┤
  │                               │    (enabled: true/false)      │
  │                               │◄── admin invites doctor  ─────┤
  │                               │    (invite link by email)     │
```