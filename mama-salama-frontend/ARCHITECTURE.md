# Mama Salama — Frontend Architecture

> Application web de suivi prénatal destinée aux femmes enceintes au Maroc.  
> Stack : React 19 · Vite · TypeScript · Tailwind CSS v3 · React Router v6 · TanStack Query v5

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Architecture Overview](#architecture-overview)
4. [State Management](#state-management)
5. [API Layer](#api-layer)
6. [Authentication & Roles](#authentication--roles)
7. [Routing](#routing)
8. [Pages by Role](#pages-by-role)
9. [i18n & RTL](#i18n--rtl)
10. [Morocco Administrative Hierarchy](#morocco-administrative-hierarchy)
11. [Design System](#design-system)
12. [Key Patterns & Decisions](#key-patterns--decisions)
13. [Docker & Deployment](#docker--deployment)

---

## Tech Stack

| Layer | Library | Notes |
|---|---|---|
| UI framework | React 19 | Concurrent features enabled |
| Build tool | Vite | Dev proxy to backend |
| Language | TypeScript 5 | `verbatimModuleSyntax`, `noUnusedLocals` |
| Styling | Tailwind CSS 3 | Custom design tokens |
| Routing | React Router DOM 6 | Nested routes, protected routes |
| HTTP client | Axios | Two instances (public + authed) |
| Server state | TanStack React Query v5 | `useQuery` / `useMutation` |
| Forms | React Hook Form + Zod | Schema validation |
| Charts | Recharts | Checkup vitals history |

**No Redux, no Zustand.** Server state lives in TanStack Query; auth credentials live in `AuthContext`; UI state lives in `useState`.

---

## Project Structure

```
mama-salama-frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/                        # One file per domain
│   │   ├── axios.ts                # Two Axios instances
│   │   ├── auth.ts                 # register, login, OTP, forgot/reset password
│   │   ├── profile.ts              # patient getProfile, updateProfile
│   │   ├── checkup.ts              # submitCheckup, getCheckupHistory
│   │   ├── chat.ts                 # askQuestion, askVoice, getChatHistory
│   │   ├── alerts.ts               # createAlert, getPendingAlerts, claimAlert, resolveAlert
│   │   ├── appointments.ts         # propose, confirm, reject, cancel, complete
│   │   ├── doctor.ts               # getDoctorProfile, updateDoctorProfile, getMyPatients, getPatientById
│   │   └── admin.ts                # getAdminStats, getAdminPatients, getAdminDoctors, getAdminAlerts, toggleDoctorEnabled
│   ├── components/
│   │   ├── Layout.tsx              # Patient shell (sidebar + mobile bottom bar)
│   │   ├── DoctorLayout.tsx        # Doctor shell
│   │   ├── AdminLayout.tsx         # Admin shell
│   │   ├── ProtectedRoute.tsx      # Auth + role guard
│   │   ├── Logo.tsx                # LogoMark / Logo lockup
│   │   ├── TriageBadge.tsx         # GREEN / YELLOW / RED badge
│   │   └── LoadingSpinner.tsx
│   ├── context/
│   │   ├── AuthContext.tsx         # JWT token, role, login/logout
│   │   └── UILanguageContext.tsx   # FR/AR translations, isRTL
│   ├── i18n/
│   │   └── translations.ts         # Full FR + AR string maps
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── OtpPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ProfilePage.tsx         # Patient profile + region/ville/préfecture
│   │   ├── CheckupPage.tsx
│   │   ├── ChatPage.tsx            # AI assistant + SOS modal
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminPatients.tsx
│   │   │   ├── AdminDoctors.tsx
│   │   │   └── AdminAlerts.tsx
│   │   ├── doctor/
│   │   │   ├── DoctorDashboard.tsx  # Urgence queue + recent patients
│   │   │   ├── DoctorPatients.tsx   # Assigned patients list/detail
│   │   │   ├── DoctorAppointments.tsx
│   │   │   └── DoctorProfilePage.tsx
│   │   └── patient/
│   │       └── PatientAppointments.tsx
│   ├── types/
│   │   └── index.ts                # Shared interfaces (PatientProfile, etc.)
│   ├── App.tsx                     # Route tree
│   └── main.tsx
├── tailwind.config.js
├── vite.config.ts
├── Dockerfile
├── nginx.conf.template
├── docker-entrypoint.sh
└── index.html
```

---

## Architecture Overview

```
Browser
  │
  ├── Vite dev server (port 5173)
  │     └── /api  →  proxy  →  Backend (port 8081)
  │
  └── React App
        ├── QueryClientProvider       (TanStack Query global cache)
        ├── AuthProvider              (JWT + role in memory + localStorage)
        ├── UILanguageProvider        (FR/AR, isRTL)
        └── BrowserRouter
              ├── Public routes       /login, /register, /otp, /forgot-password
              └── ProtectedRoute      checks token + role
                    ├── Layout        → patient pages
                    ├── DoctorLayout  → doctor pages
                    └── AdminLayout   → admin pages
```

The app is a pure SPA. All routing is client-side. There is no SSR.

---

## State Management

### TanStack Query — server state

Every piece of data fetched from the API goes through TanStack Query. There is no manual `loading`/`error`/`data` state.

```ts
// Reading
const { data, isLoading } = useQuery({
  queryKey: ['patientAppts'],
  queryFn: getPatientAppointments,
})

// Writing
const { mutate } = useMutation({
  mutationFn: confirmAppointment,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['patientAppts'] }),
})
```

Global defaults (set in `main.tsx`):
- `staleTime: 5 * 60 * 1000` — 5-minute cache, avoids re-fetching on tab switch
- `refetchOnWindowFocus: false`

### AuthContext — credentials

`src/context/AuthContext.tsx` holds the JWT token, userId, and user role (PATIENT / DOCTOR / ADMIN) in React state, initialised from `localStorage` on first render.

```ts
interface AuthContextValue {
  token: string | null
  userId: string | null
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | null
  isAuthenticated: boolean
  login: (token: string, userId: string, role: string) => void
  logout: () => void
}
```

`login()` writes to both `localStorage` and React state. `logout()` clears both. `isAuthenticated` is `!!token`.

### UILanguageContext — i18n

`src/context/UILanguageContext.tsx` provides the current language (`'fr' | 'ar'`), a `t(key)` translation helper, and `isRTL: boolean`. Components call `t('someKey')` instead of hardcoding French strings. See [i18n & RTL](#i18n--rtl).

### Local component state

Form fields, modal open/close, filter selections, and other transient UI state use plain `useState`. Nothing is shared globally unless it crosses components.

---

## API Layer

### Two Axios Instances (`src/api/axios.ts`)

```
publicClient    No Authorization header, no 401 redirect.
                Used for: register, login, verify-otp, resend-otp,
                          forgot-password, reset-password.

apiClient       Attaches Bearer token on every request (request interceptor).
                On 401 response: clears localStorage + redirects to /login.
```

This separation prevents a stale JWT from being sent to auth endpoints, which would cause the backend to reject the request with a misleading error.

**Request interceptor (apiClient):**
```ts
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

**Response interceptor (apiClient):**
```ts
apiClient.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### API Response Format — Critical Split

This is the most important invariant to understand. The backend uses **two different response shapes** depending on the endpoint group:

**Unwrapped** (direct data) — Admin, Appointments, Alerts:
```ts
// GET /admin/patients → Patient[]
// GET /appointments/doctor → Appointment[]
// GET /admin/alerts → AdminAlert[]
apiClient.get<Patient[]>('/admin/patients').then((r) => r.data)
// r.data IS the array
```

**Wrapped** — Doctor patient/profile endpoints, Auth:
```ts
// GET /doctors/me → ApiResponse<{ success, message, data: DoctorProfile }>
interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}
apiClient.get<ApiResponse<DoctorProfile>>('/doctors/me').then((r) => r.data)
// r.data.data IS the profile — access via resp.data
```

When calling wrapped endpoints in components, extract `.data`:
```ts
const { data: patientsResp } = useQuery({ queryFn: getMyPatients })
const myPatients = patientsResp?.data ?? []   // unwrap the ApiResponse wrapper
```

### API Modules

| File | Key Functions | Response Shape |
|---|---|---|
| `auth.ts` | `register`, `login`, `verifyOtp`, `forgotPassword`, `resetPassword` | Wrapped |
| `profile.ts` | `getProfile`, `updateProfile` | Wrapped |
| `checkup.ts` | `submitCheckup`, `getCheckupHistory` | Wrapped |
| `chat.ts` | `askQuestion`, `askVoice`, `getChatHistory` | Wrapped |
| `alerts.ts` | `createAlert`, `getPendingAlerts`, `claimAlert`, `resolveAlert` | Unwrapped |
| `appointments.ts` | `proposeAppointment`, `getDoctorAppointments`, `getPatientAppointments`, `confirmAppointment`, `rejectAppointment`, `cancelAppointment`, `completeAppointment` | Unwrapped |
| `doctor.ts` | `getDoctorProfile`, `updateDoctorProfile`, `getMyPatients`, `getPatientById` | Wrapped |
| `admin.ts` | `getAdminStats`, `getAdminPatients`, `getAdminDoctors`, `getAdminAlerts`, `toggleDoctorEnabled` | Unwrapped |

---

## Authentication & Roles

### Login Flow

```
POST /auth/login
  → { token, userId, role }
  → AuthContext.login(token, userId, role)
  → localStorage: token, userId, role
  → navigate based on role:
      PATIENT → /profile
      DOCTOR  → /doctor/dashboard
      ADMIN   → /admin/dashboard
```

### Registration Flow (patients only)

```
POST /auth/register → userId, otpChannel → localStorage
  → navigate /otp
POST /auth/verify-otp → token, userId, role
  → AuthContext.login() → navigate /profile
```

### ProtectedRoute

`src/components/ProtectedRoute.tsx` accepts an optional `role` prop. It checks:
1. `isAuthenticated` — if false, redirect to `/login`
2. If `role` provided, check `AuthContext.role === role` — if mismatch, redirect to appropriate home

### localStorage Keys

| Key | Value |
|---|---|
| `token` | JWT Bearer token |
| `userId` | UUID |
| `role` | `PATIENT` / `DOCTOR` / `ADMIN` |
| `otpChannel` | `EMAIL` / `SMS` (registration only) |

---

## Routing

```
/                         → redirect to /login
/login                    → LoginPage
/register                 → RegisterPage
/otp                      → OtpPage
/forgot-password          → ForgotPasswordPage

── ProtectedRoute (role: PATIENT) ──────────────────────────
  Layout (sidebar + mobile bottom bar)
    /profile              → ProfilePage
    /checkup              → CheckupPage
    /chat                 → ChatPage
    /appointments         → PatientAppointments

── ProtectedRoute (role: DOCTOR) ───────────────────────────
  DoctorLayout
    /doctor/dashboard     → DoctorDashboard
    /doctor/patients      → DoctorPatients
    /doctor/patients/:id  → DoctorPatients (detail tab)
    /doctor/appointments  → DoctorAppointments
    /doctor/profile       → DoctorProfilePage

── ProtectedRoute (role: ADMIN) ────────────────────────────
  AdminLayout
    /admin/dashboard      → AdminDashboard
    /admin/patients       → AdminPatients
    /admin/doctors        → AdminDoctors
    /admin/alerts         → AdminAlerts

*                         → redirect to /login
```

---

## Pages by Role

### Patient

**ProfilePage** (`/profile`)
- Collects: fullName, age, weight, height, region, ville (stored as `province`), préfecture (stored as `arrondissement`), milieu, DDR, pregnancy week, gestité/parité, multiple pregnancy, blood type, supplements, medical history, allergies, follow-up type
- Région → Ville → Préfecture dropdowns are hierarchical and dependent (see [Morocco Administrative Hierarchy](#morocco-administrative-hierarchy))
- `pregnancyWeekCalculated` from API badge; client-side fallback from LMP if absent
- `PUT /patient/profile` on submit

**CheckupPage** (`/checkup`)
- Vital inputs: systolicBP, diastolicBP, bloodSugar, temperature, heartRate
- `POST /checkup` → returns triage level (GREEN / YELLOW / RED) + contextual message
- History charts: 4 Recharts graphs from `GET /checkup/history`
- "En parler avec l'assistant" button: if result exists, builds a French prompt and navigates to `/chat` with `{ state: { autoPrompt } }`

**ChatPage** (`/chat`)
- Text + voice AI assistant
- SOS button opens modal: optional note textarea (max 500 chars) → `POST /alerts` with source `MANUAL`
- Auto-send: reads `location.state.autoPrompt` on mount, sends once, clears state
- Alert detection: flags responses with "urgence", "immédiatement", "appelez le 15", etc. with ⚠️ styling
- Language toggle (FR/AR) and quick prompt chips

**PatientAppointments** (`/appointments`)
- Shows all appointments from `GET /appointments/patient`
- Doctor info card per appointment: name, email (mailto link), phone (tel link)
- PROPOSED status: slot picker + Confirmer/Refuser buttons
- Filter tabs: Tous / À confirmer (count) / Confirmés / Terminés

### Doctor

**DoctorDashboard** (`/doctor/dashboard`)
- Summary cards: active alerts count, pending RDV count, assigned patients count
- Emergency queue: polls `GET /alerts/pending` every 30 seconds
  - Patient name is a clickable link → `/doctor/patients/:patientId`
  - "Prendre en charge" button → `POST /alerts/:id/claim` → on success, navigates to `/doctor/appointments` with `{ state: { patientId } }` to pre-fill the new appointment form
- Recent patients: first 4 from `GET /doctors/patients`

**DoctorPatients** (`/doctor/patients` and `/doctor/patients/:id`)
- Two tabs: "Mes patients" (assigned list) and "Trouver un patient" (search/assign)
- Patient detail: profile data, latest checkup vitals, appointment history
- Search by name or email

**DoctorAppointments** (`/doctor/appointments`)
- "Proposer un RDV" form:
  - Patient: always a `<select>` dropdown populated from `GET /doctors/patients`
  - Pre-filled patient: if navigated from dashboard with `state.patientId`, the form auto-opens and the patient is pre-selected
  - Up to 3 time slots (1 required + 2 optional alternatives)
  - Type, location, notes
- Cards show patient full name, type, slot, status
- Filter: Tous / En attente (count) / Confirmés / Terminés

**DoctorProfilePage** (`/doctor/profile`)
- Fields: fullName, specialty, hospital, région (dropdown), ville (dropdown, depends on région), préfecture (dropdown, depends on ville)
- `GET /doctors/me` to load; `PUT /doctors/me` to save
- Uses the same `PROVINCES_BY_REGION` and `ARRONDISSEMENTS_BY_PROVINCE` maps as the patient profile

### Admin

**AdminDashboard** (`/admin/dashboard`)
- Stats cards from `GET /admin/stats`: patientCount, doctorCount, pendingAlertCount, proposedAppointmentCount, documentCount

**AdminPatients** (`/admin/patients`)
- Table: Nom (fullName), Email, Téléphone, Région, Ville (province), Préfecture (arrondissement), SA, Semaine grossesse
- Data from `GET /admin/patients`

**AdminDoctors** (`/admin/doctors`)
- Table: Nom, Email, Spécialité, Hôpital, Région, Ville, Préfecture, Statut
- `enabled: boolean` drives the status badge (Actif / Inactif) and toggle button
- Toggle: `PUT /admin/doctors/:id/toggle` with `{ enabled: !current }`

**AdminAlerts** (`/admin/alerts`)
- Status filter tabs: Toutes / En attente / Prise en charge / Résolue / Annulée
- Cards: patient name/email/ville/SA, source badge (Manuel / Chatbot), trigger message, claimed-by doctor email
- Data from `GET /admin/alerts?status=...`

---

## i18n & RTL

The app supports French (default) and Arabic. Both are implemented without any external i18n library.

**`src/i18n/translations.ts`** exports:
```ts
type TranslationKey = keyof typeof fr
const fr: Record<string, string> = { ... }
const ar: Record<string, string> = { ... }
export const translations = { fr, ar }
```

**`UILanguageContext`** provides:
```ts
interface UILanguageContextValue {
  language: 'fr' | 'ar'
  setLanguage: (l: 'fr' | 'ar') => void
  t: (key: TranslationKey) => string
  isRTL: boolean
}
```

Components consume `t('key')` via `useUILanguage()`. When `isRTL` is true, layout components add `dir="rtl"` and swap margin/padding directions.

**Key translation keys added this session:**
- `profileVille` / `profileVillePlaceholder` — Ville (major city, stored as `province` for patients, `city` for doctors)
- `profilePrefecture` / `profilePrefecturePlaceholder` — Préfecture (sub-area)
- `navAppointments` — mobile bottom bar Rendez-vous tab

---

## Morocco Administrative Hierarchy

The UI presents three levels: **Région → Ville → Préfecture**.

However, the field names in the database differ by role — this is a critical mapping to understand:

| UI Label | Patient field | Doctor field |
|---|---|---|
| Région | `region` | `region` |
| Ville | `province` | `city` |
| Préfecture | `arrondissement` | `province` |

The `ProfilePage` (patient) and `DoctorProfilePage` share the same dropdown data (`PROVINCES_BY_REGION`, `ARRONDISSEMENTS_BY_PROVINCE`) but save to different field names.

**Data maps (defined in both profile pages):**

```ts
const PROVINCES_BY_REGION: Record<string, string[]> = {
  'Grand Casablanca-Settat': ['Casablanca', 'Settat', 'Berrechid', ...],
  'Rabat-Salé-Kénitra': ['Rabat', 'Salé', 'Kénitra', ...],
  // 12 regions total
}

const ARRONDISSEMENTS_BY_PROVINCE: Record<string, string[]> = {
  'Casablanca': ['Aïn Chock', 'Aïn Sebaa', 'Ben M\'Sick', ...],
  'Rabat': ['Agdal-Riyad', 'Hassan', 'Souissi', ...],
  // Populated for major urban villes only
}
```

The Préfecture dropdown only appears when the selected Ville has entries in `ARRONDISSEMENTS_BY_PROVINCE`. For smaller villes, the Préfecture field is hidden.

---

## Design System

### Color Palette (`tailwind.config.js`)

| Token | Hex | Usage |
|---|---|---|
| `rose` | `#C2617A` | Primary brand, CTAs, active states |
| `rose-light` | `#F5DDE4` | Chip backgrounds, card tints |
| `rose-dark` | `#8B3A50` | Hover states, headings |
| `blush` | `#FAF0F3` | Page background |
| `sand` | `#F7F3EE` | Secondary backgrounds |
| `sand-mid` | `#EDE6DC` | Borders, dividers |
| `mauve` | `#7B5EA7` | Doctor accent, charts |
| `mauve-light` | `#EDE8F7` | Doctor card backgrounds |
| `sage` | `#5A8A6A` | Success, confirmed status |
| `sage-light` | `#E6F2EA` | Success backgrounds |
| `amber` | `#C47E2A` | Warnings, proposed status |
| `amber-light` | `#FDF3E3` | Warning backgrounds |
| `ink` | `#2D1F28` | Primary text |
| `ink-mid` | `#6B5560` | Labels, secondary text |
| `ink-light` | `#A08898` | Placeholders, hints |

### Typography

| Class | Font | Usage |
|---|---|---|
| `font-serif` | Playfair Display | Page headings, card titles |
| `font-sans` | DM Sans | Body text, labels, buttons |
| `font-arabic` | Amiri | Arabic wordmark |

Fonts loaded via Google Fonts in `index.html`.

---

## Key Patterns & Decisions

### Alert Claim → Appointment Pre-fill

When a doctor clicks "Prendre en charge" on an alert, the flow uses React Router state to hand off the patient ID to the appointments page:

```ts
// DoctorDashboard: on claim success
navigate('/doctor/appointments', { state: { patientId: claimingPatientId } })

// DoctorAppointments: on mount
const routerLocation = useLocation()
const prefilledPatientId = (routerLocation.state as { patientId?: string } | null)?.patientId ?? ''
const [patientId, setPatientId] = useState(prefilledPatientId)
useEffect(() => { if (prefilledPatientId) setShowForm(true) }, [prefilledPatientId])
```

The variable is named `routerLocation` (not `location`) because `location` is already used as a form field state for the appointment venue.

### Checkup → Chat Handoff

CheckupPage passes vitals context to ChatPage via router state:

```ts
navigate('/chat', { state: { autoPrompt: '...' } })
```

ChatPage reads it in a `useEffect` guarded by a `useRef` flag to prevent React StrictMode's double-invocation from sending the prompt twice. After use, the state is cleared with `window.history.replaceState({}, '')`.

### Voice Recording (MediaRecorder API)

```
User clicks mic
  → navigator.mediaDevices.getUserMedia({ audio: true })
  → MediaRecorder.start()  (mimeType: audio/webm, fallback audio/mp4)
User clicks mic again
  → MediaRecorder.stop()
  → onstop: Blob → POST /ai/ask-voice (multipart/form-data)
  → response.transcribedText → shown as "Vous avez demandé : «…»" for verification
```

`mediaRecorderRef` and `audioChunksRef` are `useRef` so they survive re-renders without re-triggering effects.

### Zod v4 Schema Validation

```ts
const schema = z.object({
  email: z.email('Adresse email invalide'),   // standalone in Zod v4
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})
```

`confirmPassword` is destructured out before the API call — it never reaches the server.

### Date Formatting

API returns ISO strings; displayed as `DD/MM/YYYY`:

```ts
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
```

Appointment slots use `toLocaleDateString('fr-MA', { dateStyle: 'long' })`.

### Vite Proxy (Development)

```ts
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8081',
    changeOrigin: true,
  }
}
```

No `rewrite` — the backend already handles `/api` prefix. All requests use relative URLs so the same build works against any backend by changing only the proxy target (or the Nginx upstream in production).

---

## Docker & Deployment

### Build

```dockerfile
# Multi-stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build          # output: dist/

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
```

### Nginx Config Template

`nginx.conf.template` uses environment variable substitution at container start. The key variables are:

| Variable | Purpose |
|---|---|
| `$API_URL` | Backend base URL (e.g. `http://api:8081`) |
| `$PORT` | Port Nginx listens on (default 80) |

The `docker-entrypoint.sh` runs `envsubst` on the template before starting Nginx, so the same image works against any backend URL without rebuilding.

### SPA Routing

The Nginx config must include:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Without this, direct navigation to `/doctor/dashboard` would return a 404 because the file doesn't exist on disk — only `index.html` does.

### API Proxy in Production

The Nginx config proxies `/api` to `$API_URL`, mirroring the Vite dev proxy:
```nginx
location /api/ {
  proxy_pass $API_URL;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

---

## Known Backend Dependencies

These frontend features exist but depend on backend changes not yet confirmed:

| Feature | Endpoint | Status |
|---|---|---|
| Doctor info in patient appointment cards | `doctorEmail`, `doctorPhone` in `GET /appointments/patient` response DTO | Backend needs to add fields |
| Doctor profile page | `GET /doctors/me`, `PUT /doctors/me` | Assumed present |
| Arrondissement/préfecture fields | `arrondissement` (patient), `province` (doctor) stored on profile | Backend needs to persist new fields |