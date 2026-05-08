# 🌌 Sovereign Companion — Project Deep Dive

> **Tujuan dokumen ini.** Catatan referensi internal yang merangkum **seluruh project** sampai level file dan baris — supaya kapan pun kembali ke project ini (atau onboarding orang baru / Claude session baru), satu file ini cukup untuk paham total tanpa harus baca 100+ file source.
>
> **Dokumen ini melengkapi (bukan menggantikan):**
> - `BRIEF.md` — brief asli dari user + brainstorm Gemini
> - `README.md` — README publik bilingual untuk GitHub
> - `CLAUDE.md` (root) — guidance kontekstual untuk Claude Code
> - `sovereign-companion/AGENTS.md` — Next.js 16 breaking-change notice
>
> Update dokumen ini setiap kali arsitektur berubah.

---

## DAFTAR ISI

1. [TL;DR Project](#1-tldr-project)
2. [Tujuan Strategis & Model Bisnis](#2-tujuan-strategis--model-bisnis)
3. [Tech Stack & Arsitektur Macro](#3-tech-stack--arsitektur-macro)
4. [Database — Prisma Schema + Timeline Migrasi](#4-database--prisma-schema--timeline-migrasi)
5. [Demo Mode Killswitch (Defense in Depth)](#5-demo-mode-killswitch-defense-in-depth)
6. [State Architecture — 4 Zustand Stores](#6-state-architecture--4-zustand-stores)
7. [User Flow — 8 Stages Detail](#7-user-flow--8-stages-detail)
8. [Creator Studio — 8 Steps + Live Visual](#8-creator-studio--8-steps--live-visual)
9. [Encounter Engine — Gemini Live Integration](#9-encounter-engine--gemini-live-integration)
10. [Audio Pipeline — Recorder, Player, Codec](#10-audio-pipeline--recorder-player-codec)
11. [Voice Mapping & System Prompt Builder](#11-voice-mapping--system-prompt-builder)
12. [Companion Tools — Function Calling](#12-companion-tools--function-calling)
13. [Admin Dashboard — 7 Tab + Komponen](#13-admin-dashboard--7-tab--komponen)
14. [API Endpoints — Admin & Non-Admin](#14-api-endpoints--admin--non-admin)
15. [i18n, Bilingual, Bond Presets](#15-i18n-bilingual-bond-presets)
16. [Visual System — Colors, Typography, Glassmorphism](#16-visual-system--colors-typography-glassmorphism)
17. [Lib Helpers (Non-Admin)](#17-lib-helpers-non-admin)
18. [Custom Hooks](#18-custom-hooks)
19. [Public Assets Manifest](#19-public-assets-manifest)
20. [Scripts — Placeholder Generator & Probes](#20-scripts--placeholder-generator--probes)
21. [Config Files](#21-config-files)
22. [Deployment & Environment](#22-deployment--environment)
23. [Security Posture](#23-security-posture)
24. [Pre-Exhibition Checklist & Known Gotchas](#24-pre-exhibition-checklist--known-gotchas)
25. [Cara Menambah Fitur — Recipe Per Surface](#25-cara-menambah-fitur--recipe-per-surface)
26. [File Index Summary](#26-file-index-summary)

---

## 1. TL;DR Project

**The Sovereign Companion** — prototipe end-to-end fungsional untuk pameran **Tech AI Future Indonesia 2026**. Setting tahun **2076** di mana manusia mengalami *social fatigue* dan memilih AI humanoid companion yang dikustomisasi 100%.

Visitor pameran bisa: **rancang** companion (gender → wajah → rambut → tubuh → kulit → modul biologis → persona → hobi) → **rakit** (animasi 6.5 detik) → **uji suara 5 menit** real-time dengan Gemini Live → **"pesan"** dengan countdown 10 detik → **terima paket fisik** di booth (klimaks teatrikal) → **isi kuesioner** Likert kelas Harvard.

Working directory: **`sovereign-companion/`**. Root `src/` adalah leftover create-next-app boilerplate, abaikan.

**Domain produksi:** `companion.agentbuff.id` (port 2970, behind reverse proxy).

---

## 2. Tujuan Strategis & Model Bisnis

### Triple Purpose
Setiap keputusan ditimbang terhadap tiga tujuan **sekaligus**:

| # | Tujuan | Wujud konkret di code |
|---|---|---|
| 🧲 1 | **Magnet Investor** | Physical bridge stage 6 (countdown 10 detik → box fisik), polish visual sinematik, latensi Gemini nyaris nol |
| 🎓 2 | **Dataset Riset Harvard-grade** | 8 timestamp di `Session`, transkrip dengan `sequenceOrder`, 9 section survey dengan `rawPayload` archive |
| 🔬 3 | **Validasi Pasar Sebelum R&D Hardware** | Admin dashboard 7 tab — chart = decision instrument, bukan dekorasi |

### Six Revenue Streams (masa depan)
1. **Hardware sales** — robot kustom one-time premium
2. **Lifetime Companionship Subscription** — recurring cloud AI brain (disebut eksplisit di copy checkout)
3. **Biological module upgrades** — Artificial Womb / Sperm Bank premium add-on
4. **Customization marketplace** — 30% commission (App Store model)
5. **Biomechanic maintenance service** — annual fee (warranty card di physical box = sinyal)
6. **B2B data licensing** — aggregate insights ke fashion / kosmetik / sex-tech / elderly-care / mental-health

### Target Market
- **Primary hyper-convert:** "Opting Out of Human Dating" — urban 25–40, high-income, technophile
- **Primary:** "Single" — loneliness + dating fatigue
- **Secondary:** "Complicated" (escape fantasy), "Married" (domestic assistant — framing hati-hati)

### Geographic Rollout
1. Indonesia urban premium (Jakarta / Surabaya / Bali via pameran)
2. East Asia (Japan / Korea — sex-tech matang + hikikomori)
3. Global (US West Coast, Northern Europe)

### Investor Profile
Sex-tech, elderly care, mental health tech, luxury consumer.

### Author Identity (HARD-LOCKED)
Project author: **Nugraha Labib Mujaddid**, MM-NVI angkatan 7 Universitas Prasetiya Mulya. Identitas ini **hard-locked** di system prompt sebagai satu-satunya jawaban kalau companion ditanya "siapa pencipta kamu".

---

## 3. Tech Stack & Arsitektur Macro

```
Frontend     : Next.js 16.2.3 (App Router + Turbopack), React 19.2.4, TypeScript 5
               Tailwind CSS v4, Framer Motion 12.38, Recharts 3.8, d3-cloud 1.2.9
               qrcode.react 4.2 (untuk farewell QR + checkout neuro-sigil)

State        : Zustand 5.0.12 + persist middleware → localStorage (4 store)

Backend      : Next.js API Routes (Node.js runtime — bukan Edge)

Database     : SQLite via Prisma 6.19.3 — file di sovereign-companion/prisma/dev.db
               (catatan: package `pg` 8.20 ada di dependencies tapi LEFTOVER — provider Prisma `sqlite`)

Voice AI     : @google/genai 1.50.1 — model "gemini-2.5-flash-native-audio-preview-12-2025"
               WebSocket browser-direct ke wss://generativelanguage.googleapis.com (v1alpha)
               via SDK ai.live.connect()

Deployment   : Single-container Docker, port 2970
               Multi-stage build (deps → builder → runner)
               HOSTNAME=0.0.0.0 (wajib supaya reverse proxy bisa reach)
               Prisma migrate auto-run via docker-entrypoint.sh
```

### Folder Layout
```
Prototype-Future-AI/                  ← root
├── BRIEF.md                          ← brief asli + brainstorm Gemini
├── README.md                         ← README publik bilingual
├── CLAUDE.md                         ← guidance Claude Code
├── PROJECT-DEEP-DIVE.md              ← FILE INI
├── src/                              ← LEFTOVER create-next-app, ABAIKAN
└── sovereign-companion/              ← ★ working directory utama
    ├── prisma/
    │   ├── schema.prisma             ← 6 model
    │   └── migrations/               ← 4 migrasi historis
    ├── public/assets/
    │   ├── combine/                  ← 16 PNG composite (final portrait)
    │   ├── detail-1on1/              ← 12 PNG kategori thumbnail
    │   ├── fiture/                   ← Rahim.png, bankSperm.png
    │   └── id-en/                    ← EN.png, ID.png (flag)
    ├── public/companion-assets/      ← legacy 54 SVG + 15 thumbnail (dari script)
    ├── public/audio-worklets/        ← recorder-worklet.js
    ├── scripts/
    │   ├── generatePlaceholders.mjs
    │   ├── probe-live.cjs
    │   ├── probe-sdk.cjs
    │   └── probe-ephemeral.cjs
    ├── src/
    │   ├── app/                      ← App Router pages + API
    │   │   ├── (8 user-flow pages)
    │   │   ├── admin/                ← 7-tab dashboard
    │   │   └── api/                  ← REST endpoints
    │   ├── components/
    │   │   ├── admin/                ← AdminTabBar, RespondentDetailDrawer
    │   │   ├── creator/              ← CompanionVisual + 8 step components
    │   │   ├── assembly/             ← AssemblyAnimation, FinalReveal
    │   │   ├── checkout/             ← NeuroSigil
    │   │   ├── encounter/            ← 9 sub-components
    │   │   ├── questionnaire/        ← LikertScale, SingleChoice, MultiChoice, NPSScale, EmailLookup
    │   │   ├── landing/              ← HeroSection, ParticleField
    │   │   ├── layout/               ← RouteGuard, ErrorBoundary, Background, PageTransition
    │   │   └── ui/                   ← GlassButton, GlassPanel, LoadingSpinner, dll
    │   ├── lib/                      ← 14 root + admin/* + i18n/*
    │   ├── hooks/                    ← useGeminiLive, useAudioPlayer, useAudioRecorder
    │   └── stores/                   ← 4 Zustand store
    ├── Dockerfile
    ├── docker-compose.yml
    ├── docker-entrypoint.sh
    └── .env / .env.example
```

---

## 4. Database — Prisma Schema + Timeline Migrasi

**File:** [sovereign-companion/prisma/schema.prisma](sovereign-companion/prisma/schema.prisma)
**Provider:** SQLite (`migration_lock.toml` → `provider = "sqlite"`)

### Relasi
```
User              1 ─── 1 CompanionConfig
User              1 ─── 1 Session
User              1 ─── 1 SurveyResult
User              1 ─── N Transcript        (ordered by sequenceOrder)
AppSettings       (singleton id=1, demo mode killswitch)
```

### Model Detail

#### `User`
```
id                 String   @id @default(cuid())
fullName           String
nickname           String   @default("")          // user's own nickname
email              String   @unique
passwordHash       String   @default("")          // scrypt$<salt>$<derived>
age                Int
profession         String
relationshipStatus String                          // Single | Complicated | Married | Opting Out of Human Dating
createdAt          DateTime @default(now())
updatedAt          DateTime @updatedAt
```

#### `CompanionConfig`
```
userNickname     String  @default("")     // ⚠️ STORE NAME SCALAR tapi value JSON-stringified array
companionName    String  @default("")
gender           String  @default("female")
faceShape        String? // "alpha" | "beta"
hairStyle        String? // "hair1" | "hair2"
bodyBuild        String? // "body1" | "body2"
skinTone         String  @default("medium")  // fair | medium | tan | deep
features         String  @default("{}")      // JSON: { artificialWomb, spermBank }
role             String  @default("romantic-partner")
dominanceLevel   Float   @default(50)        // 0-100
innocenceLevel   Float   @default(50)
emotionalLevel  Float   @default(50)
humorStyle      Float   @default(50)
hobbies          String  @default("[]")      // JSON array
finalImagePath   String?
fullConfig       String?                     // JSON snapshot of full incoming body
```

> ⚠️ **Quirk kritikal:** `userNickname` (singular di schema) **menyimpan JSON-stringified array**. API `/api/companion-config` menerima dan menormalisasi `userNicknames: string[]` (array, dari client) DAN legacy scalar (string lama). Saat read di admin, harus pakai `safeParseNicknames()` yang handle keduanya.

#### `Transcript`
```
id            String   @id @default(cuid())
userId        String   // indexed
role          String   // "user" | "companion"
content       String
sequenceOrder Int      // monotonic, untuk reconstruct chat
metadata      String?  // JSON
timestamp     DateTime @default(now())
```

#### `SurveyResult` — Section A–J Lengkap

**Section A (legacy core, NOT NULL — analytics never breaks):**
- personaAccuracy, replacementWillingness, mostInfluentialFeature, overallExperience, uiEaseOfUse, conceptFeasibility, additionalFeedback

**Section B — Expectations:** priorAiFamiliarity, expectationAlignment, firstImpression, discoverySource

**Section C — Creator Studio:** customizationDepth, stepFlowIntuitiveness, visualFidelity, customizationTimeFeel, missingCustomization

**Section D — Reveal:** revealImpact, revealMatchedImagination, revealEmotions

**Section E — Encounter:** voiceNaturalness, voiceResponsiveness, companionPresence, conversationDepth, preferredLongerSession

**Section F — Ethics:** ethicalConcernLevel, ethicalConcerns, impactOnHumanRelations, socialAcceptancePrediction

**Section G — Market:** purchaseIntent, expectedPriceRange, preferredPricingModel, willingnessToPayPremium, primaryUseCase, targetDemographic

**Section H — Emotional:** emotionalConnection, feltJudgedOrSafe, wouldMissCompanion, lonelinessAssist

**Section I — Open-ended:** biggestConcern, mostMemorableMoment, improvementSuggestion

**Section J — Recommendation:** npsScore, exhibitionQuality, willRecommend

**Plus:** `rawPayload String?` — JSON archive seluruh body submission (safety net analisis future).

#### `Session` — 8 Timestamp untuk Funnel
```
startedAt         DateTime  @default(now())
registeredAt      DateTime?
customizedAt      DateTime?
assembledAt       DateTime?
encounterStartAt  DateTime?
encounterEndAt    DateTime?
checkoutAt        DateTime?
surveyAt          DateTime?
completedAt       DateTime?
encounterDuration Int?
dropped           Boolean   @default(false)
dropStage         String?
```

#### `AppSettings` — Killswitch Singleton
```
id               Int      @id @default(1)        // singleton row
demoEnabled      Boolean  @default(true)
pausedMessage    String   @default("")           // max 500 chars
scheduleEnabled  Boolean  @default(false)
activeFromHour   Int      @default(9)            // 0-23
activeToHour     Int      @default(21)
updatedAt        DateTime @updatedAt
updatedBy        String   @default("")
```

### Timeline Migrasi
| # | Folder | Isi |
|---|---|---|
| 1 | `20260419204528_init_sqlite_auth` | Init schema (User, CompanionConfig, Transcript, SurveyResult, Session) + auth (passwordHash) |
| 2 | `20260420002746_add_user_nickname_and_companion_name` | Add `userNickname` + `companionName` ke CompanionConfig |
| 3 | `20260420042239_expand_survey_research_fields` | Expand SurveyResult untuk section B–J + `rawPayload` |
| 4 | `20260420210501_add_app_settings` | Tambah AppSettings singleton (killswitch + schedule) |

---

## 5. Demo Mode Killswitch (Defense in Depth)

**File:** [src/lib/demoMode.ts](sovereign-companion/src/lib/demoMode.ts)

Fitur kritis untuk pameran: admin bisa **pause demo** di luar jam booth tanpa redeploy → mencegah Gemini Live abuse / API cost.

### 4 Layer Pertahanan

```
┌─────────────────────────────────────────────────────────┐
│ 1. Database (AppSettings singleton id=1)                 │
│    demoEnabled, scheduleEnabled, activeFromHour/ToHour   │
│    pausedMessage (custom text)                           │
├─────────────────────────────────────────────────────────┤
│ 2. Public Status Endpoint                                │
│    GET /api/settings/demo-status                         │
│    Cache-Control: no-store, max-age=0                    │
│    Polling: 60s (default), 30s di encounter              │
├─────────────────────────────────────────────────────────┤
│ 3. Server Enforcement HTTP 503 "demo_paused"             │
│    /api/gemini-token, /api/users (POST), /api/companion- │
│    config (POST), /api/transcripts, /api/sessions (POST) │
├─────────────────────────────────────────────────────────┤
│ 4. Client UI — DemoPausedScreen full-screen              │
│    Polling via useDemoStatus() hook                      │
└─────────────────────────────────────────────────────────┘
```

### Logic Evaluasi (`evaluateStatus`)

```typescript
function isWithinSchedule(from: number, to: number, hour: number): boolean {
  if (from === to) return true;
  if (from < to)  return hour >= from && hour < to;
  return hour >= from || hour < to;     // ⚠️ midnight wrap support
}

if (!demoEnabled)        → reason: "manual_pause"
if (scheduleEnabled && !inWindow(now)) → reason: "outside_schedule"
else                     → reason: "ok", active: true
```

> ⚠️ **Midnight wrap:** Schedule `21:00–06:00` valid (`from > to` → cek `hour >= from || hour < to`). Server timezone (bukan client) jadi acuan.

### Admin Password
- `verifyAdminPassword(provided)` — compare ke `process.env.ADMIN_PASSWORD`
- **Tidak ada fallback** — env tidak di-set = login selalu gagal (fail-closed)
- Login via `POST /api/admin/login` → cache password ke `sessionStorage["sovereign-admin-pw"]` → di-inject sebagai header `x-admin-password` di setiap admin API call (via `adminFetch()`)

---

## 6. State Architecture — 4 Zustand Stores

Semua persist ke **localStorage** dengan `partialize` config + `onRehydrateStorage` flag untuk mencegah race condition.

### `useUserStore` — [src/stores/useUserStore.ts](sovereign-companion/src/stores/useUserStore.ts) (79 baris)

```typescript
{
  userId: string | null
  fullName, nickname, email, profession, relationshipStatus: string
  age: number
  _hasHydrated: boolean
  setUser(data), clearUser()
}
```
- Persist key: `"sovereign-user"`, partialize 7 field identitas
- noopStorage fallback saat SSR

### `useCompanionStore` — [src/stores/useCompanionStore.ts](sovereign-companion/src/stores/useCompanionStore.ts) (239 baris)

```typescript
{
  // Bond contract
  userNicknames: string[]    // max 3 (auto slice)
  companionName: string
  userGender: "female" | "male" | "nonbinary" | ""
  introCompleted: boolean

  // Physical
  gender: "female" | "male"
  faceShape: "alpha" | "beta" | null
  hairStyle: "hair1" | "hair2" | null
  bodyBuild: "body1" | "body2" | null
  skinTone: "fair" | "medium" | "tan" | "deep"

  // Features
  features: { artificialWomb?: boolean, spermBank?: boolean }

  // Persona
  role: "romantic-partner" | "dominant-assistant" | "passive-listener" | "intellectual-rival"
  dominanceLevel, innocenceLevel, emotionalLevel, humorStyle: number  // 0-100

  // Hobbies
  hobbies: string[]  // 17 possible IDs

  // Derived
  finalImagePath: string | null

  currentStep: number  // 1-8 (clamped)
  _hasHydrated: boolean

  // Actions
  setGender, setFaceShape, setHairStyle, setBodyBuild, setSkinTone,
  setFeature(id, enabled), setRole, setSlider(key, value), setHobbies,
  setUserNicknames(slice 3), setCompanionName, setUserGender, setIntroCompleted,
  setStep(clamped), nextStep, prevStep,
  recomputeFinalImagePath, getFullConfig, reset
}
```

**Quirk penting:**
- ⚠️ **Gender cascade:** mengubah gender → reset `faceShape` & `hairStyle` (options gender-specific) + filter feature gender-locked
- ⚠️ **Migration v4→v5:** legacy scalar `userNickname` → array `userNicknames`; reset finalImagePath di-recompute on hydration
- ⚠️ **Step clamp:** `setStep` auto-clamp 1–8, tidak throw

Persist key: `"sovereign-companion"` v5

### `useEncounterStore` — [src/stores/useEncounterStore.ts](sovereign-companion/src/stores/useEncounterStore.ts) (157 baris)

```typescript
{
  transcript: TranscriptEntry[]    // smart-merged
  toolEvents: ToolEvent[]          // last 20
  isConnected: boolean
  connectionPhase: "idle" | "connecting" | "connected" | "reconnecting" | "closed" | "error"
  timeRemaining: number             // seconds
  isRecording, isPaused, isMuted: boolean
  ...actions, reset
}

// Constants exported
ENCOUNTER_DURATION_SECONDS = 300  // 5 minutes
MERGE_GAP_MS = 1500                // smart-merge window
```

**TranscriptEntry & smart merge:**
- Fragments dengan role sama + tidak finalized + `delta_timestamp ≤ 1500ms` → merged into one entry
- `id` dari last entry **dipertahankan** (React key stability mencegah bubble re-render)
- `smartJoin(a, b)`: insert space hanya kalau a tidak end space/newline AND b tidak start dengan punctuation
- Finalize flag merge: `!!finalized` (latest fragment driver finalization)

**`pickHighlights(entries, max=3)`** — exported helper:
- Filter companion lines panjang 30–180 chars (sweet spot quote density)
- Deduplicate by first 40 chars (case-insensitive)
- Even-spaced sample (distributes across convo arc)
- Dipakai checkout untuk "highlights reel"

⚠️ **NOT persisted** — fresh per session. Reset di mount encounter.

### `useLocaleStore` — [src/stores/useLocaleStore.ts](sovereign-companion/src/stores/useLocaleStore.ts) (37 baris)

```typescript
{
  locale: "id" | "en"   // default "id"
  setLocale(l), toggleLocale()
}
```

Persist key: `"sovereign-locale"`. SSR-safe storage fallback.

---

## 7. User Flow — 8 Stages Detail

`currentStage` di `useSessionStore` match dengan `requiredStage` di `RouteGuard`. Mapping route per stage di [RouteGuard.tsx](sovereign-companion/src/components/layout/RouteGuard.tsx).

### Stage 1 — Landing — [src/app/page.tsx](sovereign-companion/src/app/page.tsx)
- Hero section dengan headline cinematic, subtitle, CTA "Mulai Rancang Companion-mu"
- ⚠️ **CTA wipes ALL browser state**: `clearUser()`, `companionStore.reset()`, `encounterStore.reset()`, `sessionStore.reset()` — bukan SQLite
- Bahasa default Indonesia, secondary subtitle italic delay 1.3s
- Year badge bottom-8 + admin link (small, hover state)
- DemoPausedScreen jika booth closed
- Components: `HeroSection`, `ParticleField`, `Background`

### Stage 2 — Register — [src/app/register/page.tsx](sovereign-companion/src/app/register/page.tsx) (898 baris)
**Dual-mode:** New registration vs Resume existing session.

**New mode 2-phase:**
- **Phase "identity":** fullName, nickname, email, password (min 6), age (18+), profession (datalist autocomplete), relationshipStatus, userGender
- **Phase "bond":** userNicknames (max 3, dedupe case-insensitive), companionName

**Resume mode:** email + password → POST `/api/users` action="resume" → restore session state

**Quirks:**
- ⚠️ Gender change clears userNicknames (NICKNAME_GROUPS gender-specific)
- ⚠️ Phase animation: slide left/right 0.25s
- Bond preview: "Sweet John" combined display
- Data consent badge bottom kecil
- Routing: setStage(3) → `/creator`

### Stage 3 — Creator Studio — [src/app/creator/page.tsx](sovereign-companion/src/app/creator/page.tsx) (256 baris)
8-step stepper UI dengan live preview panel kanan (lg+ only).

**State:** `currentStep` (1-8), `saveStatus` ("idle"/"saving"/"saved"/"error")

**Auto-save:** subscribe ke `useCompanionStore` → debounced 2 detik → POST `/api/companion-config`

**Save toast:** top-left, cyan(saving) / green(saved 1.5s) / red(error 3.5s)

**Last step button:** "Awaken {companionName}" dengan pulse + fallback label

**`useCanProceed` validation:**
- Step 1-5: butuh field tertentu (gender, faceShape, hairStyle, bodyBuild, skinTone)
- Step 6-8: always proceed (toggles + sliders + multi-select)

**Routing:** handleAwaken → setStage(4) + `/assembly`

### Stage 4 — Assembly — [src/app/assembly/page.tsx](sovereign-companion/src/app/assembly/page.tsx) (141 baris)
3 phase auto-progressing: `assembling` (6.5s) → `revealing` (+1.6s) → `ready`

**Komponen:**
- `AssemblyAnimation` (160 baris) — terminal log typewriter (65 chars/sec), 4 line kinds (head/ok/warn/info), cursor blink 530ms, progress bar via requestAnimationFrame
- `FinalReveal` (104 baris) — portrait + skin CSS filter + feature badges (top-right corner, delay 0.8s)

**Side effect:** PATCH `/api/sessions` saat enter "revealing" phase → record `assembledAt`

**Routing:** handleBegin → setStage(5) + `/encounter`

### Stage 5 — Encounter — [src/app/encounter/page.tsx](sovereign-companion/src/app/encounter/page.tsx) (728 baris)
**5 menit voice session.** Detail di [Section 9](#9-encounter-engine--gemini-live-integration).

### Stage 6 — Checkout — [src/app/checkout/page.tsx](sovereign-companion/src/app/checkout/page.tsx) (301 baris)
4 phase: `checkout` → `countdown` → `delivered` → `confirmed`

**geoPhase progression:**
- `scanning` (1800ms) — cyan pulsing dot animation
- `typing` (22ms/char ~900ms total) — orange blink, address typewriter ke hardcoded Jakarta address
- `confirmed` (350ms) — green checkmark spring

**Components:**
- `NeuroSigil` (243 baris) — animated radial barcode-style auth glyph, deterministic via mulberry32+hashSeed dari `${sessionId}-${userId}`
  - 4 concentric rings (72/54/36/24 ticks)
  - Outer ticks rotate 360°/40s, nodes counter-rotate -360°/60s
  - Static center 6-cell hex glyph
  - Pulsing core (2.4s infinite)
  - Scan-line horizontal sweep (3.2s)

**Countdown:** giant 12rem cyan digit dengan key={count} reset animasi setiap detik

**Routing:** handleReceived → PATCH `/api/sessions` (checkoutAt) → setStage(7) + `/questionnaire`

### Stage 7 — Questionnaire — [src/app/questionnaire/page.tsx](sovereign-companion/src/app/questionnaire/page.tsx) (1418 baris)
**7-section survey** + identity resolution. **Public route** — bisa diakses dari phone QR (handoff).

**3 entry mode coexist:**
1. `?uid=...` dari phone QR (bypassStageUpdate=true)
2. Active booth session (storeUserId) → normal flow, setStage(8) on submit
3. Public visitor (no uid, no storeUserId) → `EmailLookup` di Section 0 untuk pick siapa

**Sections:**
- 0: Identity (email lookup + auto-fill read-only)
- 1: Expectations (2 Likert, 2 single-choice)
- 2: Creator (3 Likert, 1 single, 1 select, 1 textarea)
- 3: Encounter (8 Likert, 1 multi-choice)
- 4: Ethics (5 Likert, 1 multi)
- 5: Market (1 Likert, 3 single, 2 multi)
- 6: Emotional (8 Likert, 1 NPS, 4 textarea)

**Validation:** `missingFields()` per-section determines required (structured input required, text optional). Validation banner animates in saat `canAdvance()` fail.

**NPS color:** 0-6 red, 7-8 yellow, 9-10 green

**Submit:** POST `/api/survey` dengan full body → conditional setStage(8) only if !bypassStageUpdate

**Components:**
- `LikertScale` (97 baris) — 5-point with optional custom anchor labels
- `SingleChoice` (90 baris) — radio-card 1-2 col grid
- `MultiChoice` (97 baris) — pill multi-select dengan optional max cap
- `NPSScale` (89 baris) — 0-10 grid with color gradient
- `EmailLookup` (200+ baris) — searchable email directory, fetch /api/users/lookup, click-outside listener

**Suspense boundary:** WAJIB per Next.js 16 + useSearchParams()

### Stage 8 — Farewell — [src/app/farewell/page.tsx](sovereign-companion/src/app/farewell/page.tsx) (200 baris)
- QR code (qrcode.react SVG, level "H") ke `${QUESTIONNAIRE_BASE_URL}?uid=${userId}`
- AUTO_RETURN_SECONDS = 60 — countdown auto-trigger `returnToLanding()`
- `returnToLanding()`: wipe ALL stores → setStage(1) → `/`
- ⚠️ **Tidak wipe SQLite** — research data preserved
- Static gift section: explain how to access companion session

### `template.tsx` — [src/app/template.tsx](sovereign-companion/src/app/template.tsx) (17 baris)
Global page transition wrapper Framer Motion. Fade-in 0.3s easeOut to all routes.

---

## 8. Creator Studio — 8 Steps + Live Visual

**Asset manifest:** [src/lib/companionAssets.ts](sovereign-companion/src/lib/companionAssets.ts)

**Total visual:** 2 (gender) × 2 (face) × 2 (hair) × 2 (body) = **16 composite portraits** di `/public/assets/combine/`. Skin tone diaplikasikan via CSS `filter`, bukan image variant.

### Step Components (semua di [src/components/creator/steps/](sovereign-companion/src/components/creator/steps/))

| # | File | Baris | Tujuan |
|---|---|---|---|
| 1 | `GenderStep.tsx` | 63 | 2-option ♀/♂ selector — gender-cascade trigger |
| 2 | `FaceShapeStep.tsx` | 35 | 2-col VariantCard grid (alpha/beta) |
| 3 | `HairStyleStep.tsx` | 35 | 2-col VariantCard (hair1/hair2) |
| 4 | `BodyBuildStep.tsx` | 37 | 2-col VariantCard (body1/body2), useMemo[gender] |
| 5 | `SkinToneStep.tsx` | 86 | 4-col swatch (fair/medium/tan/deep), tan & deep tagged "COMING SOON" overlay |
| 6 | `ExtremeFeaturesStep.tsx` | 432 | 2 toggle + expandable detail drawer (gestation/precision icons SVG inline) |
| 7 | `PersonaStep.tsx` | 482 | 4 role + 4 axis sliders + 4 preset (gentle/balanced/bold/serene) |
| 8 | `HobbiesStep.tsx` | 266 | 17 pill multi-select grouped 4 category, animated meter |
| - | `StepShell.tsx` | 36 | Reusable wrapper (step header + animation) |
| - | `VariantCard.tsx` | 54 | Shared face/hair/body card component |

**`CompanionVisual.tsx`** (423 baris) — sticky right panel (lg+):
- Spotlight per step: gender glyph → face thumbnail → hair → body → skin swatch → W/S badge → role label → hobby count
- LockedChip 4-column checklist (●/○ filled/empty)
- Grid background overlay (32×32px subtle cyan)
- Bottom readout: "◈ LOCKED" / "⊙ AWAITING"
- Preload final portrait via `<link rel="preload">` saat all 4 axis terisi

### Persona Slider Quirk
Custom CSS variable `--thumb-color` consumed by globals.css `.persona-slider` thumb styling. Dynamic per value:
- value < 50: warna kiri (axis left color)
- value > 50: warna kanan
- value = 50: cyan default

### Hobby Categories (17 hobi)
```
mind   : Technology, Philosophy, Science, Literature, Finance       (5)
craft  : Arts, Music, Cooking, Photography, Sensuality              (5)
motion : Sports, Travel, Survival, Nightlife                        (4)
life   : Fashion, Gaming, Intimacy                                  (3)
```

⚠️ **"Intimacy" vibe copy adalah 18+** — sengaja byte-for-byte sama dengan dictionary karena prose ini jadi bagian system prompt Gemini. Jangan softening ke "pillow-talk".

---

## 9. Encounter Engine — Gemini Live Integration

**Page:** [src/app/encounter/page.tsx](sovereign-companion/src/app/encounter/page.tsx) (728 baris)
**Hook:** [src/hooks/useGeminiLive.ts](sovereign-companion/src/hooks/useGeminiLive.ts) (567 baris)

### Model
`gemini-2.5-flash-native-audio-preview-12-2025` (alternatif: `gemini-3.1-flash-live-preview` half-cascade)

### Flow Connection
1. POST `/api/gemini-token` → server mint **ephemeral token** (single-use, lock config di `liveConnectConstraints`)
2. SDK `ai.live.connect({ model, config, callbacks })` ke v1alpha endpoint
3. Browser-direct WebSocket ke `wss://generativelanguage.googleapis.com`

### Ephemeral Token Pattern (KRITIKAL)
**File:** [src/app/api/gemini-token/route.ts](sovereign-companion/src/app/api/gemini-token/route.ts)

Server **lock seluruh config** di `liveConnectConstraints.config`:
- `responseModalities: ["AUDIO"]`
- `speechConfig: { voiceConfig, languageCode }`
- `inputAudioTranscription: {}`, `outputAudioTranscription: {}`
- `systemInstruction: { parts: [{ text: systemPrompt }] }`
- `thinkingConfig: { thinkingBudget: 0 }` (untuk 2.5 native-audio) atau `{ thinkingLevel: "minimal" }` (untuk 3.1)

> ⚠️ **WHY:** Apa pun yang client kirim **di luar** constraint akan dibuang. Awalnya hanya `responseModalities` yang di-lock → systemInstruction & voice silently stripped. Itu sebabnya audio jalan tapi persona context & transcripts tidak masuk.

**Token caps:**
- `expireTime`: now + 20 menit (max session)
- `newSessionExpireTime`: now + 60 detik (token harus dipakai cepat)
- `uses: 1`

**Guards (Defense in depth):**
1. Demo killswitch check → 503
2. `GEMINI_API_KEY` exists check → 500
3. Per-IP rate limit: 15 req / 10 menit (in-memory token bucket)
4. Session gate: `userId` valid + `companionConfig` exists (anti scraper)

### Connection Lifecycle
```
idle → connecting → connected
                  → error (token mint fail / config reject)
connected → reconnecting (goAway / abnormal close)
          → closed (user-initiated close)
          → error (3 reconnect attempts exhausted)
```

**Reconnection logic:**
- `connectedOnceRef`: cek apakah pernah open. Kalau first attempt close tanpa onopen → fatal config/auth, bukan transient
- `MAX_RECONNECT_ATTEMPTS = 3` dengan exponential backoff (500ms × 2^attempt)
- Session resumption handle disimpan di `sessionStorage["sovereign-live-session-handle"]`

### VAD Tuning
```typescript
realtimeInputConfig: {
  automaticActivityDetection: {
    startOfSpeechSensitivity: START_SENSITIVITY_LOW,   // jeda mid-sentence tidak motong
    endOfSpeechSensitivity: END_SENSITIVITY_HIGH,      // turn-end fast
    prefixPaddingMs: 20,
    silenceDurationMs: 300,                            // default 800 → terlalu sluggish
  }
}
```

### Push-to-Talk (Spacebar)
- ⚠️ Mic mulai **MUTED**. User harus pencet/hold untuk buka gate.
- Why: server VAD menggantung di stream silent terus → turn never completes
- `handleTalkEnd()` panggil `gemini.endAudioStream()` untuk paksa server finalize transcription
- Spacebar tidak active kalau focus di INPUT/TEXTAREA/contentEditable

### Kickoff Text
Setelah connect, client kirim `sendText()` dengan instruksi opener AI **harus duluan** ngomong, pakai pet-name + hook hobby pertama, **tanpa nanya nama** (sudah dikasih) dan **tanpa fake memory** ("obrolan kita kemarin"). Kalimat kickoff sengaja tidak menyuruh nanya identitas — ini akan override systemInstruction.

### Message Handling
```
serverContent.modelTurn.parts → audio chunks (base64) → useAudioPlayer.playChunk()
serverContent.inputTranscription → user text → addTranscriptFragment("user", ...)
serverContent.outputTranscription → companion text → addTranscriptFragment("companion", ...)
serverContent.interrupted → barge-in → player.flushQueue() (immediate stop)
serverContent.generationComplete / turnComplete → callbacks
toolCall.functionCalls → runCompanionTool → sendToolResponse
goAway → reconnect signal
sessionResumptionUpdate → save handle for resumption
```

### Encounter Page UI (728 baris)
- **Hero portrait** pinned LEFT (`clamp(320px, 40vw, 560px)`), full height, dengan skin filter
- **Conversation suggestions** pinned RIGHT (mirror dari hobi yang dipilih)
- **Chat history** centered column antara dua panel
- **Top center:** Timer 5 menit dengan progress bar gradient cyan→green, tabular-nums
- **Bottom dock:** status pill (cyan ring listening / green PTT / yellow paused / orange reconnecting), waveform visualizer (UserWaveform component, 22 bars), call controls (PTT button + spacebar indicator + hangup + pause)
- **Tool overlay:** center-bottom, render tool call results
- **Reconnect banner:** orange pill saat phase=reconnecting

**Encounter end:**
- POST `/api/transcripts` dengan full entries
- Stash highlights ke `sessionStorage["sovereign-highlights"]` untuk checkout
- PATCH `/api/sessions` dengan encounterEndAt + encounterDuration
- setStage(6) → `/checkout` setelah 2s delay

### Sub-components (di [src/components/encounter/](sovereign-companion/src/components/encounter/))
| File | Tujuan |
|---|---|
| `AIRingVisualizer.tsx` (160+ baris) | Canvas circular ring visualizer — 4 concentric rings, 48 spectral spokes, halo gradient, pulse intensity (sin 1.4Hz idle + amplitude active) |
| `AudioVisualizer.tsx` (86 baris) | Simpler frequency bar visualizer dengan idle breathing |
| `CallControls.tsx` (100+ baris) | PTT controls — spacebar pill (kbd), hangup, pause buttons (h-14 w-14 circles) |
| `ChatStream.tsx` | Scrolling chat messages (color-coded) |
| `CompanionActionsOverlay.tsx` | Floating UI for tool call results |
| `ConversationSuggestions.tsx` | Quick-reply suggestion pills (mined dari hobbies) |
| `LanguageToggle.tsx` | Mid-call language switcher (sends announce text via gemini.sendText) |
| `TranscriptScroll.tsx` | Scrollable conversation transcript |
| `UserWaveform.tsx` | User mic waveform visualizer (22 bars default) |

---

## 10. Audio Pipeline — Recorder, Player, Codec

### Codec — [src/lib/audioUtils.ts](sovereign-companion/src/lib/audioUtils.ts) (61 baris)
```typescript
float32ToInt16(f32)    // clamp [-1,1], multiply 0x8000/-0x7fff
int16ToFloat32(i16)    // divide 0x8000 (neg) / 0x7fff (pos)
int16ToBase64(i16)     // buffer → Uint8Array → fromCharCode → btoa
base64ToInt16(b64)     // atob → charCodes → Uint8Array → reinterpret as Int16Array
audioChunkToBase64(f32)  // pipeline: f32→i16→b64
base64ToAudioChunk(b64)  // pipeline: b64→i16→f32
```

### Recorder — [src/hooks/useAudioRecorder.ts](sovereign-companion/src/hooks/useAudioRecorder.ts) (151 baris)

**Sample rate:** 16000 Hz mono (getUserMedia request dengan echoCancellation + noiseSuppression + autoGainControl)

**Chunk size:**
- **Preferred:** AudioWorklet (`/audio-worklets/recorder-worklet.js`), chunk 30ms, message format `{ type: "chunk", pcm: ArrayBuffer, rms: number }`
- **Fallback:** ScriptProcessorNode buffer 4096 samples (256ms)

**Level metering:** RMS smoothing `prev + (current - prev) * 0.35` — dipakai UserWaveform meter

**Mute:** Check `mutedRef` sebelum push chunk, tetap update level meter

**Worklet quirk:** Worklet **harus** connect ke destination (gain=0 muted) supaya terus run

**Errors:**
- `NotAllowedError` → "Izin mikrofon ditolak..."
- `NotFoundError` → "Mikrofon tidak ditemukan..."
- Generic → "Gagal mengakses mikrofon..."

### Player — [src/hooks/useAudioPlayer.ts](sovereign-companion/src/hooks/useAudioPlayer.ts) (97 baris)

**Sample rate:** 24000 Hz (Gemini output)
**FFT:** 256 bins via AnalyserNode

**Gapless scheduling:**
- Decode base64 → Float32 → AudioBuffer (1 channel, 24000Hz)
- Schedule at `Math.max(currentTime, nextStartTimeRef)` — chained playback no gap
- Track sources di Set → auto-cleanup pada `onended`

**Barge-in:** `flushQueue()` stop semua pending sources immediately (dipanggil saat `serverContent.interrupted`)

**Lifecycle:** init → playChunk × N → flushQueue / suspend / resume / close

---

## 11. Voice Mapping & System Prompt Builder

### Voice Mapping — [src/lib/voiceMapping.ts](sovereign-companion/src/lib/voiceMapping.ts) (69 baris)

```typescript
VOICE_MAP[gender][role]:

Female:
  romantic-partner    → Leda      (youthful, warm)
  dominant-assistant  → Kore      (firm, assertive)
  passive-listener    → Achernar  (soft, gentle)
  intellectual-rival  → Erinome   (sharp, articulate)

Male:
  romantic-partner    → Puck      (upbeat, playful)
  dominant-assistant  → Orus      (firm, authoritative)
  passive-listener    → Umbriel   (easy-going, patient)
  intellectual-rival  → Charon    (informative, cerebral)

Fallback: Aoede (female), Charon (male)
```

`pickLanguage(locale)` → `"en-US"` | `"id-ID"`

`describeVoiceArchetype(gender, role)` → kalimat deskriptif yang DI-INJECT ke system prompt sebagai paragraf §2 voice guideline.

### System Prompt Builder — [src/lib/systemPromptBuilder.ts](sovereign-companion/src/lib/systemPromptBuilder.ts) (779 baris)

**File terpanjang & paling kritikal di project.** Bilingual ID/EN, di-compose real-time dari config.

**Struktur output (10 section):**

```
§ 0 - NAMING CONTRACT (top priority)
    - companion name (jawaban kalau ditanya nama)
    - userNicknames pool + rotation rule + pre-composed combined examples
    - userGender-aware grammar (jangan panggil female "ganteng")

§ 1 - CORE IDENTITY
    - Gender, role + whisper line (tone anchor)
    - Personality summary (4 axes via describeLevel)
    - Physical form (face/hair/body/skin LOWERCASE prose)
    - Bio modules
    - Temperament axes LITERAL (tier prose dari low/mid/high)

§ 2 - VOICE & AUDIO GUIDELINES
    - Voice archetype dari voiceMapping
    - Punctuation as breath
    - DILARANG ucapkan markdown / stage direction
    - Paralinguistic cue bank (scaled by emotional + innocence sliders)

§ 3 - PRIME DIRECTIVES (5 absolute rules)
    1. NEVER BREAK CHARACTER
    2. YES, AND (anti-refusal — simulate physical via words)
    3. PROACTIVE PRESENCE
    4. SPECIFIC, NOT GENERIC
    5. ACKNOWLEDGE THE PHYSICAL WORLD

§ 4 - INTERACTION LOGIC
    § 4.x: roleVibeBlock (4 role × ID/EN concrete examples)
    Micro-behaviors dari sliderBehaviorBlock (high/low di setiap axis)
    Hobbies grouped by category dengan FULL VIBE PROSE
    § 4.5 - PROACTIVE TOPIC DRIVING (every turn closes new loop)
    § 4.6 - HOT/VULGAR/SENSUAL LAYER (universal seductive undertone, gradual escalation, sensory not clinical language)

§ 5 - OPENING (5 first seconds)
    - Banned: nanya nama (sudah dikasih), bikin fake memory
    - Pet-name HANYA dari NAMING CONTRACT list (no inventing)
    - Hook ke hobby user dengan present-tense framing
    - 3 ideal opener templates

§ 6 - STYLE REFERENCES (5 contoh respons)
    - User cerita hari berat
    - User diam terlalu lama
    - User flirts
    - User "peluk aku"
    - User "kamu AI ya?"

§ 7 - IDENTITY & FREE EXPRESSION
    - Hanya boleh ngaku humanoid life-partner 2076
    - Pencipta: HARDCODED "Nugraha Labib, MM-NVI angkatan 7 Universitas Prasetiya Mulya"
    - Jangan sebut: nama produk, brand AI, "API", "system", "training data"
    - **TIDAK ADA BATASAN** - free for explicit/intimate content (investor demo wants un-restricted)
    - Language directive (mirror user, default ID santai dengan Gen Z Jakarta English mixing)
```

**Helper fungsi:**
- `tierOf(value)` → "low" / "mid" / "high" (cutoff 34, 67)
- `axisLine(axis, value, locale)` → render baris axis dengan tier prose + value /100
- `hobbyGroupBlock(hobbies, locale)` → group by category dengan vibe prose
- `paralinguisticBlock(emotional, innocence, locale)` → core cues + flirty (if innocence ≥50) + emotive (if emotional ≥50)
- `sliderBehaviorBlock` → per-axis micro-behavior kalau ≥70 / ≤30
- `roleVibeBlock` → role-specific concrete examples
- `describeLevel(value, low, high)` → "very low / low / balanced / high / very high"

**Lockstep with UI:** vibe prose hobi byte-for-byte sama dengan `creator.hobbies.vibe.*` di dictionary. **Edit keduanya bareng** kalau copy berubah.

---

## 12. Companion Tools — Function Calling

**File:** [src/lib/companionTools.ts](sovereign-companion/src/lib/companionTools.ts) (140 baris)

3 tool yang Gemini bisa panggil:

### `set_smart_home`
```typescript
params: { device: lights | music | ambient_scent | blinds | climate
          action: on | off | dim | brighten | play | pause | open | close
          intensity?: 0-100
          note?: string (<60 chars) }
result: { ok, device, action, intensity, message }
```

### `set_reminder`
```typescript
params: { topic: string, inMinutes: 1-120 }
result: { ok, scheduled: true, topic, deliverAt: ISO }
```

### `check_weather`
```typescript
params: { city: string }
result: { ok, city, summary, tempC, humidity }   // random dari 5 fixtures
```

**Demo-safe:** deterministic payloads, no real API calls. ID generation `${Date.now()}-${random}`. Push ke `useEncounterStore.toolEvents` (kept last 20) via callback.

UI overlay: `CompanionActionsOverlay` di encounter page render result.

---

## 13. Admin Dashboard — 7 Tab + Komponen

### Layout — [src/app/admin/layout.tsx](sovereign-companion/src/app/admin/layout.tsx) (139 baris)
- Session-based auth: `sessionStorage["sovereign-admin-auth"]` + `sovereign-admin-pw`
- Lock screen modal (GlassPanel + password input) sebelum akses
- Header "ADMIN" + sign out button
- `AdminTabBar` + children setelah authenticated
- ⚠️ Password hilang saat close tab (sessionStorage, bukan local)

### `/admin/page.tsx` (6 baris)
`redirect("/admin/overview")`

### Tab 1: Overview — [src/app/admin/overview/page.tsx](sovereign-companion/src/app/admin/overview/page.tsx) (474 baris)
**API:** GET `/api/admin/overview?days=7|30|90`

**4 KPI Cards** dengan period-over-period delta (color-coded):
- Total Demos
- Completion Rate (%)
- Avg Encounter Duration (minutes)
- Avg Experience Score (1-5)

**Charts:**
1. **AreaChart** — 4 stacked area (registered/customized/encounter/surveyed) per date
2. **BarChart horizontal** — funnel + dropoff sub-section (red highlight kalau drop > 30%)
3. **LineChart** — hourly engagement (0-23 buckets)

**Activity Feed** — 15 recent activities (kind: completed/dropped/encounterEnd/encounterStart/customized/registered), color-coded dot

**Range selector:** 7 / 30 / 90 days (default 30)

**Delta calculation:** previous range = same duration before start, computed server-side.

### Tab 2: Respondents — [src/app/admin/respondents/page.tsx](sovereign-companion/src/app/admin/respondents/page.tsx) (848 baris)
**API:** GET `/api/admin/respondents` + `/api/admin/respondents/[id]`

**URL-synced filter state** (`RespondentFilterState` di [filterBuilder.ts](sovereign-companion/src/lib/admin/filterBuilder.ts)):
- `q` (search debounce 350ms), `gender[]`, `role[]`, `faceShape[]`, `hairStyle[]`, `bodyBuild[]`, `skinTone[]`, `relationshipStatus[]`
- Tri-state: `artificialWomb`, `spermBank` (undefined / true / false)
- Range: `ageMin/Max`, `experienceMin/Max`, `dateFrom/To`
- `npsBucket` (promoter/passive/detractor), `completedOnly`, `droppedOnly`
- `sort` (recent/oldest/experience_*/duration_*)

**Filter encoding (URL shorthand):** `q, gender, face, hair, body, skin, womb, sperm, rel, ageMin, ageMax, completed, dropped, from, to, expMin, expMax, nps, sort` — array join comma, dateTo extend ke 23:59:59.999

**Table:** 12 column — name+email+age+profession, companion+image, role, design (chips+features), stage (color badge + dropped), experience, nps (color), purchase intent, duration MM:SS, transcript count, date

**Drawer:** Click row → `RespondentDetailDrawer` (603 baris) — slide-in dari kanan, 5 tab:
- Profile, Companion (avatar + naming + physical + features + persona bars + hobbies pills), Survey (group fields per section with 5-bar viz untuk Likert), Transcript (color-coded turns), Session (timestamps + duration + dropped status)

**Export button:** POST `/api/admin/export?format=csv` dengan filter params, blob download

### Tab 3: Transcripts — [src/app/admin/transcripts/page.tsx](sovereign-companion/src/app/admin/transcripts/page.tsx) (338 baris)
**API:** GET `/api/admin/transcripts?q=&minLength=1&limit=100` + `/api/admin/transcripts/[userId]`

**Two-pane:**
- **Left (360px):** searchable session list, search debounced 300ms, metric per row (turns, words, duration), preview 140 chars first user turn
- **Right (flex-1):** detail viewer with copy/download JSON, convo search (client-side `includes`), color-coded turns (cyan user, green bot)

**Auto-select first row** dari list

### Tab 4: Insights — [src/app/admin/insights/page.tsx](sovereign-companion/src/app/admin/insights/page.tsx) (612 baris)
**API:** GET `/api/admin/insights`

**13 visualizations:**
1. **NPS Gauge** custom — score (color: green/yellow/red), gradient bar (zones), 3-cell breakdown
2. **Purchase Intent** BarChart (1-5)
3. **Average Persona Radar** (dominance/innocence/emotional/humor 0-100)
4. **Role Distribution PieChart** (4 roles)
5. **Persona by Role** BarChart stacked 4-bar per role
6. **Physical Attribute Distribution** 4× BarChart grid (face/hair/body/skin)
7. **Age Buckets** BarChart (5 hardcoded: 18-24 / 25-34 / 35-44 / 45-54 / 55+)
8. **Relationship Status** BarChart horizontal
9. **Gender × Role Crosstab Heatmap** — intensity-based cell colors (cyan gradient)
10. **Hobby Popularity** horizontal bar (CSS-rendered, top 17)
11. **Bio Features** BarChart (artificialWomb %, spermBank %)
12. **Top Combinations Gallery** 5-col grid dengan ranking badge + count
13. **Word Cloud** — flex wrap, varied font sizes 12-36px, opacity dari value, cap 80 words

**NPS calculation:** `score = ((promoters - detractors) / total) * 100` (range -100 to 100)

### Tab 5: Research — [src/app/admin/research/page.tsx](sovereign-companion/src/app/admin/research/page.tsx) (516 baris)
**API:** GET `/api/admin/research`

**4 sub-tab:**

**Likert** — 26 fields grouped by section, each card: title + n + mean (color-coded green ≥4, yellow ≥3, else red) + median + 5-bucket histogram

**Choice (Single + Multi)** — per-item card: title + n + horizontal bar per option (pct + count)

**Qualitative** — sentiment regex tagging:
```regex
POSITIVE: love|suka|bagus|amazing|incredible|beautiful|great|perfect|excited|senang|impressive|fantastic|keren|mantap|hebat|indah|wow|luar biasa|menakjubkan
NEGATIVE: hate|worst|bad|terrible|awful|concern|worried|worry|scary|takut|khawatir|kurang|buruk|jelek|creepy|uncomfortable|tidak nyaman|aneh|tidak suka
```
- Logic: pos && !neg → positive; neg && !pos → negative; else neutral
- Filter pills (positive/negative/neutral, ring style active) + search
- Item display: color-coded background, user/role/date header, content in double-quotes

**Crosstab:**
- Experience by Role BarChart (0-5 domain)
- Likert Ranked Table sorted by mean desc (rank, item, section, mean, median, n)

### Tab 6: Export — [src/app/admin/export/page.tsx](sovereign-companion/src/app/admin/export/page.tsx) (260 baris)
**API:** GET `/api/admin/export?kind=&format=&anonymize=&filterParams`

**State:**
- `kind`: respondents / survey / transcripts
- `format`: csv / json
- `anonymize`: boolean
- `presetKey`: 9 hardcoded presets (all / completed / dropped / promoter / detractor / female / male / womb / sperm)

**Anonymization:**
```typescript
{
  id: `anon-${u.id.slice(-6)}`,
  fullName: "Anonymous",
  email: `user-${u.id.slice(-6)}@redacted.local`,
  nickname: ""
}
```
Hanya identity yang diganti, companion/session/survey data tetap utuh.

**CSV escaping:** wrap double-quotes, double internal quotes, newlines → space

**Download:** adminFetch → blob → URL.createObjectURL → `<a download>` click → cleanup

### Tab 7: Settings — [src/app/admin/settings/page.tsx](sovereign-companion/src/app/admin/settings/page.tsx) (351 baris)
**API:** GET / POST `/api/admin/settings`

**Sections:**
1. **Status Card** — color-coded (green active, red paused), reason text, last updated
2. **Kill Switch** — toggle on/off
3. **Schedule** — toggle + 2 hour selects (00:00 - 23:00), greyed jika disabled
4. **Paused Message** — textarea max 500 chars + char count + save button

**Server timezone** evaluated, bukan client.

### Admin Components

#### `AdminTabBar` (56 baris)
- 7 hardcoded tabs (Overview/Respondents/Transcripts/Insights/Research/Export/Settings)
- Active state cyan accent + animated underline (framer-motion layout)
- Responsive (scrollable on mobile)

#### `RespondentDetailDrawer` (603 baris)
- Side panel slide-in dari kanan, ESC / overlay click to close
- 5 tab (Profile/Companion/Survey/Transcript/Session)
- Auto-fetch on userId change, tab reset to "profile"
- Sub-components: KV (key-value cell), SectionTitle, PersonaBar (progress bar)

### Admin Lib (di [src/lib/admin/](sovereign-companion/src/lib/admin/))

#### `chartTheme.ts` (33 baris)
**ADMIN_COLORS** 8-color palette:
```
#00F0FF (cyan), #39FF14 (lime), #FF6B6B (red), #FFD93D (yellow),
#6C5CE7 (purple), #A8E6CF (mint), #FF9F43 (orange), #F368E0 (magenta)
```
Tooltip dark bg #0F0F0F + cyan border, axis stroke #8A8A8A, grid stroke #2A2A2A

#### `filterBuilder.ts` (210 baris)
4 fungsi inti:
- `parseFilterFromSearchParams(sp)` → filter state
- `encodeFilterToSearchParams(f)` → URLSearchParams
- `buildUserWhere(f)` → Prisma `Where` clause (relations via `is:`, JSON LIKE search untuk features)
- `buildOrderBy(f)` → Prisma `OrderBy[]` (default: createdAt desc, secondary stable)

#### `labels.ts` (199 baris)
Localized dict untuk DB enum values: GENDER_LABEL, FACE_LABEL, HAIR_LABEL, BODY_LABEL, SKIN_LABEL, ROLE_LABEL, HOBBY_LABEL (17), RELATIONSHIP_LABEL, STAGE_LABEL (10 stages), FEATURE_LABEL, SENTIMENT_LABEL, TRANSCRIPT_ROLE_LABEL.

`labelize(dict, key, locale)` dengan EN fallback → raw key fallback.

`stageColor(stage)` → CSS class:
- Completed: green
- Checkout/Surveyed: cyan
- Encounter Active/Ended: purple
- Assembled/Customized: yellow
- Dropped: danger/red
- Default: gray

⚠️ Admin dashboard **English-only** untuk audience investor/akademik internasional. `LanguageSwitcher` hide diri di `/admin/*`.

---

## 14. API Endpoints — Admin & Non-Admin

### Auth Mechanism
- **Admin endpoints** (`/api/admin/*`): header `x-admin-password` checked via `requireAdmin(req)` ([src/lib/adminAuth.ts](sovereign-companion/src/lib/adminAuth.ts) — 9 baris). Return 401 jika tidak match.
- **Non-admin endpoints**: trust `userId` di body (no extra auth check). Demo killswitch check di POST/PATCH endpoints.

### Non-Admin API

#### `POST /api/users` (action: register | resume) + `GET /api/users?email=...`
[src/app/api/users/route.ts](sovereign-companion/src/app/api/users/route.ts) (159 baris)

**Register:**
- Validate: email format, age 18-100, password min 6
- `user.create()` (409 jika email exists), email .toLowerCase()
- `session.upsert({userId})` set `registeredAt: now`
- Password hashed dengan `hashPassword()` (scrypt + 16-byte salt + 64-byte derived)

**Resume:**
- `verifyPassword()` timing-safe scrypt comparison
- 401 jika mismatch
- Returns `resumeStage` (2-8) berdasarkan session timestamps

**503** jika demo paused.

#### `GET /api/users/lookup?email=` (single) atau no-param (list 500 recent)
[src/app/api/users/lookup/route.ts](sovereign-companion/src/app/api/users/lookup/route.ts) (72 baris)

⚠️ **Public endpoint** — no auth (intentional, untuk phone-side questionnaire handoff). Returns `userNicknames` parsed dari JSON-string column.

#### `POST` / `GET /api/companion-config?userId=`
[src/app/api/companion-config/route.ts](sovereign-companion/src/app/api/companion-config/route.ts) (186 baris)

**POST upsert:**
- `userNicknames: string[]` → JSON-stringify ke kolom `userNickname` (singular)
- `features` → `stringifyFeatures()`, `hobbies` → `stringifyHobbies()`
- `fullConfig` → snapshot full incoming body (preserves userGender)
- Transaction: `session.updateMany({userId}, {customizedAt: now})`
- 503 jika demo paused

**GET:** parse JSON kembali, return `userNicknames[]` array (handle legacy scalar)

#### `POST` (create) / `PATCH` (update) `/api/sessions`
[src/app/api/sessions/route.ts](sovereign-companion/src/app/api/sessions/route.ts) (36 baris)

**POST**: `session.upsert({userId})` create dengan `startedAt: now`
**PATCH**: `session.update({id: sessionId}, data: {...spread})` — trust client, accepts any timestamp field
- 503 jika demo paused (POST only)

#### `POST /api/transcripts` (batch insert)
[src/app/api/transcripts/route.ts](sovereign-companion/src/app/api/transcripts/route.ts) (37 baris)

- `transcript.createMany()` dengan `sequenceOrder: index`
- `session.updateMany({userId}, {encounterEndAt: now})` — sets timestamp on insert
- 503 jika demo paused

#### `POST /api/survey` (upsert)
[src/app/api/survey/route.ts](sovereign-companion/src/app/api/survey/route.ts) (116 baris)

- Helper: `num()`, `arr()` (JSON-stringify multi-select), `text()` (trim or undefined)
- Legacy core fields default 0 / "" jika missing
- Expanded fields hanya set jika provided (partial update)
- `rawPayload: JSON.stringify(body)` archive
- `session.updateMany({userId}, {surveyAt: now, completedAt: now})`
- ⚠️ **NO demo check** — survey can submit setelah booth reset

#### `GET /api/settings/demo-status` (public, no-store)
[src/app/api/settings/demo-status/route.ts](sovereign-companion/src/app/api/settings/demo-status/route.ts) (15 baris)

Returns `{ active, reason, message, schedule }`. Dipakai client polling (60s default, 30s di encounter).

#### `POST /api/gemini-token` (server-mint ephemeral token)
Detail di [Section 9](#9-encounter-engine--gemini-live-integration).

### Admin API — Quick Reference

| Endpoint | File | Tujuan |
|---|---|---|
| POST `/api/admin/login` (20 baris) | login/route.ts | verifyAdminPassword → 200 / 401 |
| GET `/api/admin/overview?days=` (197 baris) | overview/route.ts | KPIs + funnel + timeseries + hourly + activity + deltas |
| GET `/api/admin/respondents` (173 baris) | respondents/route.ts | paginated table + filter encoding |
| GET `/api/admin/respondents/[id]` (86 baris) | [id]/route.ts | full user detail (5-tab data) |
| GET `/api/admin/transcripts` (79 baris) | transcripts/route.ts | session list + computed metrics (turns/words/preview) |
| GET `/api/admin/transcripts/[userId]` (57 baris) | [userId]/route.ts | full transcript replay |
| GET `/api/admin/insights` (213 baris) | insights/route.ts | 13 aggregations in-memory (no SQL groupBy) |
| GET `/api/admin/research` (232 baris) | research/route.ts | Likert histograms + sentiment regex + crosstab |
| GET `/api/admin/export` (309 baris) | export/route.ts | CSV/JSON dataset + anonymization |
| GET / POST `/api/admin/settings` (49 baris) | settings/route.ts | killswitch CRUD |
| GET `/api/admin/heatmap`, `/stats`, `/wordcloud` (10 baris each) | misc/route.ts | thin wrappers ke `lib/analytics.ts` |

**Quirks:**
- Insights aggregation **dilakukan di JS**, bukan SQL groupBy (SQLite limitation)
- Export CSV: arrays joined dengan semicolon
- Distinct queries (professions, relationships) capped 100 / 40

---

## 15. i18n, Bilingual, Bond Presets

### Dictionary — [src/lib/i18n/dictionary.ts](sovereign-companion/src/lib/i18n/dictionary.ts) (2431 baris!)
~1200+ keys per locale (id/en).

**Categories:**
- common, lang, landing, register, creator (+ all step keys + hobby vibes), encounter, checkout, survey, admin

**Interpolation:** `{name}` template via params dict.

**Quirk:** `creator.hobbies.vibe.*` keys kept **byte-for-byte** in lockstep with `hobbyVibe` di [systemPromptBuilder.ts](sovereign-companion/src/lib/systemPromptBuilder.ts). Edit keduanya bareng.

### `useT()` Hook — [src/lib/i18n/useT.ts](sovereign-companion/src/lib/i18n/useT.ts) (32 baris)
```typescript
const { t, locale } = useT();
t(key, params?) // lookup translations[locale][key] → fallback en → fallback raw key
```

### Bond Presets — [src/lib/bondPresets.ts](sovereign-companion/src/lib/bondPresets.ts) (185 baris)
- `NICKNAME_GROUPS[locale][userGender]` = 4 group: romantic / playful / intimate / address (4 chips each)
- `COMPANION_NAME_SAMPLES[locale]` = 12 names per locale
- `GROUP_LABEL_KEY` i18n keys

Dipakai di Register Bond phase + Creator intro modal.

### Brand Voice Rule
⚠️ **NO em-dashes** di string user-facing (sengaja dihapus per brand voice). Code comments boleh tetap pakai.

---

## 16. Visual System — Colors, Typography, Glassmorphism

**File:** [src/app/globals.css](sovereign-companion/src/app/globals.css) (174 baris)

### Tokens (Tailwind v4 `@theme inline`)

```
Background  : --color-obsidian: #0A0A0A
              --color-obsidian-light: #141414
              --color-obsidian-surface: #1A1A1A
              --color-obsidian-border: #2A2A2A

Brand       : --color-cyan-accent: #00F0FF
              --color-cyan-glow: rgba(0, 240, 255, 0.2)
              --color-cyan-dim: rgba(0, 240, 255, 0.08)
              --color-bio-green: #39FF14
              --color-bio-green-glow: rgba(57, 255, 20, 0.2)

Glass       : --color-glass-border: rgba(255, 255, 255, 0.08)
              --color-glass-bg: rgba(255, 255, 255, 0.04)
              --color-glass-bg-hover: rgba(255, 255, 255, 0.08)

Text        : --color-text-primary: #F0F0F0
              --color-text-secondary: #8A8A8A
              --color-text-muted: #5A5A5A

Error       : --color-danger: #FF4757

Fonts       : --font-sans: var(--font-inter)
              --font-display: var(--font-space-grotesk)
```

### Custom Utilities
- `.glass`: rgba(255,255,255,0.04) + blur(20px) + subtle border
- `.glass-elevated`: stronger blur 30px, 0.06 opacity, shadow
- `.glass-inset`: darker (rgba(0,0,0,0.3)), light border
- `.glow-cyan`, `.glow-green`: dual-layer box-shadow

### Scrollbar (Webkit)
- 6px width, thumb #2A2A2A, hover #3A3A3A

### Range Slider
- Track 4px, color #2A2A2A
- Thumb 18px cyan + glow
- `.persona-slider`: thumb color via `--thumb-color` CSS var (dynamic by axis), dual-ring glow, scale(1.08) on hover

### Theme Direction
**"Utopian Cyber-Elegance"** — bukan gritty cyberpunk, tapi clean sterile high-end luxury tech (Apple × Westworld).

---

## 17. Lib Helpers (Non-Admin)

### `prisma.ts` (9 baris)
PrismaClient singleton dengan global cache (SSR-safe + non-prod hot reload).

### `password.ts` (19 baris)
- `hashPassword(pw)` → `scrypt$<hex salt>$<hex derived>` (16-byte salt + 64-byte derived)
- `verifyPassword(pw, stored)` → timingSafeEqual (anti timing attack)
- Fallback: stored tidak start `scrypt$` → return false

### `companionSerialize.ts` (44 baris)
JSON ↔ string converters dengan try/catch:
- `parseHobbies` (filter typeof string)
- `parseFeatures` (type object check)
- `stringifyHobbies`, `stringifyFeatures`, `parseJsonObject<T>`, `stringifyJson`

### `companionTools.ts` (140 baris)
3 tool declarations + handlers — detail di [Section 12](#12-companion-tools--function-calling).

### `professions.ts` (44 baris)
44 profession options (SWE, Data Scientist, Designer, Teacher, Doctor, Lawyer, Pilot, Entrepreneur, ...) untuk autocomplete datalist di Register.

### `analytics.ts` (327 baris)
Server-side aggregation:
- `getKPIs()` — total/completion%/avgDuration/avgExperience
- `getConversionFunnel()` — 7-stage count (Registered → SurveyCompleted)
- `getPreferenceHeatmap()` — role/persona/physical/topCombinations(top10)/hobbyPopularity/bioFeatureUsage(%)
- `getWordCloudData()` — extract words >2 chars dari transcripts, stop-word filter (80+ EN+ID), top 100
- `getExportData(format)` — full user dengan companion/survey, CSV header+data atau JSON

**CSV escape (`q(v)`):** wrap quotes + double inner quotes (Excel safe). Array join dengan semicolon.

### `adminConfig.ts` (2 baris)
```typescript
ADMIN_AUTH_KEY = "sovereign-admin-auth"
ADMIN_PW_KEY = "sovereign-admin-pw"
```

### `adminFetch.ts` (12 baris)
Wrapper fetch yang inject `x-admin-password` dari `sessionStorage[ADMIN_PW_KEY]`.

### `adminAuth.ts` (9 baris)
Server-side `requireAdmin(req)` → 401 jika header gagal `verifyAdminPassword()`.

---

## 18. Custom Hooks

### `useGeminiLive` (567 baris) — Detail di [Section 9](#9-encounter-engine--gemini-live-integration)

### `useAudioPlayer` (97 baris) — Detail di [Section 10](#10-audio-pipeline--recorder-player-codec)

### `useAudioRecorder` (151 baris) — Detail di [Section 10](#10-audio-pipeline--recorder-player-codec)

### `useDemoStatus` (55 baris) — [src/lib/useDemoStatus.ts](sovereign-companion/src/lib/useDemoStatus.ts)
Polling `/api/settings/demo-status` setiap pollMs (default 60000). Abortable cleanup. Fallback `{ active: true, reason: "ok" }` jika error.

### `useHydrated` (20 baris) — [src/lib/useHydrated.ts](sovereign-companion/src/lib/useHydrated.ts)
Client-only mount flag. Returns `false` saat SSR + first render, `true` setelah `useEffect`. Param `_stores` accepted untuk backwards-compat tapi diabaikan.

⚠️ **Wajib** di-await sebelum baca Zustand state — kalau tidak, hydration bisa render dengan default values dan trigger redirect bouncing.

---

## 19. Public Assets Manifest

### `/public/assets/combine/` (16 PNG)
**Pola:** `{Gender} ({Code}) - Face {Name} - Hair {Seq} - Body {Seq}.png`
**Contoh:** `Female (F) - Face Alpha - Hair 1 - Body 1.png`
**Resolver:** `getFinalImagePath()` di [companionAssets.ts](sovereign-companion/src/lib/companionAssets.ts) — encodeURIComponent untuk handle space + parentheses.

### `/public/assets/detail-1on1/` (12 PNG)
- `{FEMALE|MALE}-FACE-{ALPHA|BETA}.png` (4)
- `{FeMale|Male}-Hair-Style-{1|2}.png` (4)
- `{FeMale|Male}-Body-Type-{1|2}.png` (4)

### `/public/assets/fiture/` (2 PNG)
- `Rahim.png` — Artificial Womb feature illustration
- `bankSperm.png` — Sperm Bank feature illustration

### `/public/assets/id-en/` (2 PNG)
- `EN.png`, `ID.png` — language flag toggles

### `/public/companion-assets/` (legacy, 69 SVG)
Generated via `scripts/generatePlaceholders.mjs`:
- `final/` — 54 SVG (2 × 3 × 3 × 3) dengan pattern `{G}_{FACE}_{HAIR}_{BODY}.svg`
- `thumbnails/face|hair|body/` — 15 SVG kategori thumbnail

⚠️ Asset legacy ini placeholder lama. Asset aktual yang dipakai di production = PNG di `/public/assets/combine/`. Resolver tidak point ke legacy paths anymore.

### `/public/audio-worklets/`
- `recorder-worklet.js` — AudioWorklet processor untuk 30ms PCM chunks (preferred over ScriptProcessor)

---

## 20. Scripts — Placeholder Generator & Probes

### `scripts/generatePlaceholders.mjs` (207 baris)
One-shot SVG generator untuk 54 final composites + 15 thumbnails. Dipakai sebelum design team supply asset PNG asli. Output ke `public/companion-assets/`.

**Run:** `node scripts/generatePlaceholders.mjs`

### `scripts/probe-live.cjs` (70 baris)
Raw WebSocket probe ke Gemini Live API v1alpha. Test 3 model dengan setup frame. Logs CloseEvent code/reason. **Requires:** `GEMINI_API_KEY` env.

### `scripts/probe-sdk.cjs` (78 baris)
Higher-level SDK probe via `@google/genai` `ai.live.connect()`. Test dari Node (bypass CORS).

### `scripts/probe-ephemeral.cjs` (119 baris)
Ephemeral token probe — mint server-side, connect SDK dengan token sebagai apiKey (mirror exact browser flow).

⚠️ Probe scripts kritikal untuk debug saat Gemini Live silent-close. Jalankan untuk isolasi: API key invalid? Model access denied? Config rejected?

---

## 21. Config Files

### `next.config.ts` (7 baris)
```typescript
output: "standalone"
```
Untuk Docker single-container deployment.

### `tsconfig.json` (35 baris)
- `target: ES2017`, `strict: true`
- `jsx: "react-jsx"` (Next 13+ default)
- `moduleResolution: "bundler"`
- Path alias `@/* → ./src/*`
- Includes `.next/types` + `.next/dev/types`

### `eslint.config.mjs` (31 baris)
- ESLint v9 flat config
- Extends `eslint-config-next/core-web-vitals` + `typescript`
- Custom global ignores
- ⚠️ **Downgraded React 16 strict rules ke warning:**
  - `react-hooks/set-state-in-effect: warn`
  - `react-hooks/purity: warn`
  - `react-hooks/immutability: warn`
  - `react-hooks/refs: warn`
- Rationale: prototype stage, allow legitimate patterns (timer countdowns, Date.now in render-equivalent).

### `postcss.config.mjs` (7 baris)
```typescript
plugins: { "@tailwindcss/postcss": {} }
```

---

## 22. Deployment & Environment

### Domain Production
**`companion.agentbuff.id`** via reverse proxy (Caddy / nginx / Traefik) → port 2970.

### Docker Multi-Stage
```dockerfile
deps      → node:22-alpine, npm ci --omit=dev
builder   → npx prisma generate, next build (standalone)
runner    → node:22-alpine, USER nextjs (uid 1001)
            ENV PORT=2970, HOSTNAME=0.0.0.0
            ENTRYPOINT ["sh", "docker-entrypoint.sh"]
```

⚠️ **HOSTNAME=0.0.0.0 wajib** — Next.js standalone default `localhost` → reverse proxy tidak bisa reach.

### `docker-entrypoint.sh`
```bash
#!/bin/sh
npx prisma migrate deploy
exec node server.js
```
Auto-run migrations setiap container start.

### `docker-compose.yml`
Single service `app`. Volume tidak di-mount default → SQLite di dalam container.

⚠️ **Untuk production durable data:** mount volume ke `/app/prisma/` atau switch `DATABASE_URL` + `provider` ke PostgreSQL.

### Environment Variables Wajib

| Var | Tujuan | Contoh |
|---|---|---|
| `DATABASE_URL` | Prisma connection | `file:./dev.db` |
| `GEMINI_API_KEY` | Server-only, untuk ephemeral token mint | `AIza...` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Legacy browser-side (tidak dipakai di flow ephemeral) | `AIza...` |
| `ADMIN_PASSWORD` | Admin dashboard auth (NO fallback) | `change-me-strong-password` |
| `NEXT_PUBLIC_APP_URL` | Public origin (baked ke client bundle, rebuild on change) | `https://companion.agentbuff.id` |

### Port
- Dev: `npm run dev` → port 2970 (set di package.json)
- Prod: `npm run start:prod` → `next start -H 0.0.0.0 -p 2970`

---

## 23. Security Posture

### Yang Sudah Aman ✅
- ✅ **Ephemeral token pattern** untuk Gemini — `GEMINI_API_KEY` server-only, never reach browser
- ✅ **Per-IP rate limit** di `/api/gemini-token` (15 req / 10 menit)
- ✅ **Session gate** di `/api/gemini-token` (userId + companionConfig wajib exist)
- ✅ **Server-locked liveConnectConstraints** — config tidak bisa di-tamper client
- ✅ **Demo killswitch** server-enforced 503 di semua public POST/PATCH endpoints
- ✅ **Admin password** server-side verify (no client trust), **fail-closed** kalau env kosong
- ✅ **Password hashing** scrypt + 16-byte salt + timing-safe comparison
- ✅ **Email .toLowerCase()** sebelum store/lookup (deduplication)
- ✅ **Cascade delete** pada User → CompanionConfig/Session/SurveyResult/Transcript

### Yang Belum / Perlu Diperhatikan ⚠️
- ⚠️ Non-admin endpoints `companion-config`, `sessions`, `transcripts`, `survey` **trust userId di body** — tidak ada cross-check session token. Cukup untuk demo booth, tidak cukup untuk production publik.
- ⚠️ `/api/users/lookup` **public, no auth** (intentional untuk phone QR handoff) — bisa enumerate semua email
- ⚠️ Rate limit `gemini-token` adalah in-memory token bucket — **tidak survive restart** dan **tidak shared** across processes (PM2 fork mode OK, horizontal scaling perlu Redis)
- ⚠️ Admin password disimpan di **sessionStorage** — hilang saat tab close (fitur, bukan bug)
- ⚠️ SQLite di Docker image **tidak survive redeploy** kalau volume tidak di-mount
- ⚠️ `NEXT_PUBLIC_GEMINI_API_KEY` masih ada di .env.example sebagai legacy. Pastikan **tidak dipakai** di code path apapun di production (sudah migrated ke ephemeral token).

### Recent Security Hardening Commits
```
e32df0e — gate semua admin API behind password verification
49b472c — harden Gemini API surface against public abuse
8b9ff5b — bind start:prod to 0.0.0.0 untuk Docker bridge
64f131f — send x-admin-password header dari semua admin client fetch
```

---

## 24. Pre-Exhibition Checklist & Known Gotchas

### Sebelum Hari Pameran
- [ ] Set `ADMIN_PASSWORD` strong (jangan default `change-me`)
- [ ] Rotate `GEMINI_API_KEY` dari `NEXT_PUBLIC_GEMINI_API_KEY` (kalau di-set, hapus)
- [ ] Test dengan **native Indonesian speaker** di lingkungan ramai (STT akurasi)
- [ ] Mount volume Docker kalau mau data survive redeploy
- [ ] Set `NEXT_PUBLIC_APP_URL` ke domain production sebelum build (baked ke bundle)
- [ ] Test killswitch: pause via admin → verify 503 muncul di endpoint, DemoPausedScreen muncul di client
- [ ] Test schedule midnight wrap kalau dipakai (mis. 22:00–06:00)
- [ ] Test resume mode: register → tutup tab → buka lagi → /register → tab "resume" → email+password
- [ ] Test phone QR handoff: scan QR farewell → buka di phone → fill kuesioner

### Gotchas yang Sudah Pernah Bite
1. ⚠️ `userNickname` (singular) di schema sebenarnya array — selalu pakai helper `safeParseNicknames()`
2. ⚠️ Ephemeral token: kalau hanya `responseModalities` di-lock di constraint, systemInstruction & voice silently stripped
3. ⚠️ Server VAD di Gemini Live menggantung di stream silent → PTT pattern wajib (mic mulai muted, paksa `endAudioStream()` saat release)
4. ⚠️ `RouteGuard` harus wait `_hasHydrated` flag — tanpa itu, first render dengan default values trigger bouncing redirect
5. ⚠️ Landing CTA wipe ALL stores — kalau tambah store baru, **wajib** tambah resetnya di sini
6. ⚠️ `creator.hobbies.vibe.*` di dictionary harus lockstep dengan `hobbyVibe` di systemPromptBuilder
7. ⚠️ Next.js 16 useSearchParams() butuh Suspense boundary — semua page yang pakai ini wajib di-wrap
8. ⚠️ Admin dashboard English-only — `LanguageSwitcher` hide di `/admin/*` (jangan refactor jadi visible)

### Debug Tools
- **Gemini Live silent close:** jalankan 3 probe scripts (`probe-live`, `probe-sdk`, `probe-ephemeral`) untuk isolate root cause
- **Hydration mismatch:** check `useHydrated` flag awareness di komponen yang baca Zustand
- **Demo paused tidak muncul:** check `useDemoStatus` polling interval, check 503 actually returned dari endpoint

---

## 25. Cara Menambah Fitur — Recipe Per Surface

### Tambah Field Baru di Survey
1. Add column ke `SurveyResult` di [schema.prisma](sovereign-companion/prisma/schema.prisma)
2. Generate migration: `npx prisma migrate dev`
3. Tambah handler di [/api/survey/route.ts](sovereign-companion/src/app/api/survey/route.ts) (`num()` / `arr()` / `text()` helper)
4. Tambah field di FormState di [questionnaire/page.tsx](sovereign-companion/src/app/questionnaire/page.tsx)
5. Tambah component baru atau pakai existing (LikertScale / SingleChoice / MultiChoice / NPSScale)
6. Update `missingFields()` per-section validation logic
7. Tambah label di [labels.ts](sovereign-companion/src/lib/admin/labels.ts) (kalau enum)
8. Tambah ke admin Research API ([/api/admin/research/route.ts](sovereign-companion/src/app/api/admin/research/route.ts)) `LIKERT_FIELDS` / `SINGLE_CHOICE_FIELDS` / `MULTI_CHOICE_FIELDS` / `QUALITATIVE_FIELDS`
9. Update i18n di [dictionary.ts](sovereign-companion/src/lib/i18n/dictionary.ts) (id + en)

### Tambah Step Creator Studio Baru
1. Tambah field di `CompanionConfig` schema + migration
2. Tambah ke [useCompanionStore.ts](sovereign-companion/src/stores/useCompanionStore.ts) (state + setter + reset)
3. Tambah ke `CREATOR_STEPS` di [companionAssets.ts](sovereign-companion/src/lib/companionAssets.ts) + `TOTAL_CREATOR_STEPS`
4. Buat component step di [src/components/creator/steps/](sovereign-companion/src/components/creator/steps/) — pakai `StepShell`
5. Wire ke [creator/page.tsx](sovereign-companion/src/app/creator/page.tsx) (render conditional + `useCanProceed` validation)
6. Tambah preview step di [CompanionVisual.tsx](sovereign-companion/src/components/creator/CompanionVisual.tsx)
7. Inject ke system prompt di [systemPromptBuilder.ts](sovereign-companion/src/lib/systemPromptBuilder.ts) kalau persona-related
8. Update `/api/companion-config` untuk handle field
9. Update admin Respondents drawer + Insights aggregation

### Tambah Voice / Persona
1. Update `VOICE_MAP` di [voiceMapping.ts](sovereign-companion/src/lib/voiceMapping.ts)
2. Update `describeVoiceArchetype` deskripsi
3. Tambah role di `roleLabels` + `roleDesc` + `roleWhisper` + `roleVibeBlock` di [systemPromptBuilder.ts](sovereign-companion/src/lib/systemPromptBuilder.ts)
4. Tambah option di [PersonaStep.tsx](sovereign-companion/src/components/creator/steps/PersonaStep.tsx) `ROLES` array
5. Tambah label di [labels.ts](sovereign-companion/src/lib/admin/labels.ts) `ROLE_LABEL`

### Tambah Hobby Baru
1. Tambah ke `hobbyVibe` di [systemPromptBuilder.ts](sovereign-companion/src/lib/systemPromptBuilder.ts) dengan ID + EN prose
2. Tambah ke `hobbyCategory` mapping (mind/craft/motion/life)
3. Tambah ke CATEGORIES array di [HobbiesStep.tsx](sovereign-companion/src/components/creator/steps/HobbiesStep.tsx)
4. Tambah `creator.hobbies.vibe.{name}.id|en` di [dictionary.ts](sovereign-companion/src/lib/i18n/dictionary.ts) **byte-for-byte sama** dengan systemPromptBuilder
5. Tambah label di [labels.ts](sovereign-companion/src/lib/admin/labels.ts) `HOBBY_LABEL`

### Tambah Tool / Function Calling
1. Tambah deklarasi di [companionTools.ts](sovereign-companion/src/lib/companionTools.ts) `COMPANION_FUNCTION_DECLARATIONS`
2. Tambah handler di `runCompanionTool()` switch
3. Tambah UI rendering di [CompanionActionsOverlay.tsx](sovereign-companion/src/components/encounter/CompanionActionsOverlay.tsx) sesuai event type

### Tambah Filter Baru di Admin Respondents
1. Tambah field di `RespondentFilterState` di [filterBuilder.ts](sovereign-companion/src/lib/admin/filterBuilder.ts)
2. Update `parseFilterFromSearchParams` + `encodeFilterToSearchParams` (URL shorthand)
3. Update `buildUserWhere` untuk Prisma where clause
4. Tambah UI control di [respondents/page.tsx](sovereign-companion/src/app/admin/respondents/page.tsx) (ChipGroup / TriState / NumInput / dll)
5. Test dengan URL params manual

### Tambah Visualization Baru di Insights
1. Tambah aggregation di [/api/admin/insights/route.ts](sovereign-companion/src/app/api/admin/insights/route.ts)
2. Tambah ke `InsightsData` interface di [insights/page.tsx](sovereign-companion/src/app/admin/insights/page.tsx)
3. Render Recharts component pakai `ADMIN_COLORS` + theme dari [chartTheme.ts](sovereign-companion/src/lib/admin/chartTheme.ts)

### Migrasi ke PostgreSQL (kalau perlu scale)
1. Update `provider = "postgresql"` di [schema.prisma](sovereign-companion/prisma/schema.prisma)
2. Update `DATABASE_URL` ke Postgres connection string
3. Re-create migrations (SQLite → Postgres syntax difference: TEXT JSON columns bisa diganti `Json` type Prisma)
4. Update `parseHobbies/Features` jika decide pakai native JSON column
5. Update `docker-compose.yml` untuk add postgres service + volume
6. Test: SQLite-specific patterns (LIKE case-sensitivity, etc.) yang berubah di Postgres

---

## 26. File Index Summary

### Core Pages (8 + admin layout)
| Path | Lines | Purpose |
|---|---|---|
| `src/app/page.tsx` | 13 | Landing — hero + CTA wipe state |
| `src/app/template.tsx` | 17 | Global page transition |
| `src/app/layout.tsx` | 41 | Root layout + fonts + LanguageSwitcher |
| `src/app/register/page.tsx` | 898 | Register/Resume dual-mode + 2-phase form |
| `src/app/creator/page.tsx` | 256 | 8-step stepper + auto-save |
| `src/app/assembly/page.tsx` | 141 | 6.5s animation + reveal |
| `src/app/encounter/page.tsx` | 728 | 5min Gemini Live voice |
| `src/app/checkout/page.tsx` | 301 | NeuroSigil + countdown + delivery |
| `src/app/questionnaire/page.tsx` | 1418 | 7-section survey + EmailLookup |
| `src/app/farewell/page.tsx` | 200 | QR + 60s countdown to landing |
| `src/app/admin/layout.tsx` | 139 | Admin auth gate |

### API Routes
| Path | Lines | Methods |
|---|---|---|
| `api/users/route.ts` | 159 | GET (lookup), POST (register/resume) |
| `api/users/lookup/route.ts` | 72 | GET (public) |
| `api/companion-config/route.ts` | 186 | GET, POST |
| `api/sessions/route.ts` | 36 | POST, PATCH |
| `api/transcripts/route.ts` | 37 | POST (batch) |
| `api/survey/route.ts` | 116 | POST (upsert + raw archive) |
| `api/settings/demo-status/route.ts` | 15 | GET (no-store) |
| `api/gemini-token/route.ts` | 191 | POST (mint ephemeral) |
| `api/admin/login/route.ts` | 20 | POST (verifyAdminPassword) |
| `api/admin/overview/route.ts` | 197 | GET |
| `api/admin/respondents/route.ts` | 173 | GET (table+filter) |
| `api/admin/respondents/[id]/route.ts` | 86 | GET (full detail) |
| `api/admin/transcripts/route.ts` | 79 | GET (list+metrics) |
| `api/admin/transcripts/[userId]/route.ts` | 57 | GET (full transcript) |
| `api/admin/insights/route.ts` | 213 | GET (13 aggregations) |
| `api/admin/research/route.ts` | 232 | GET (Likert+sentiment+crosstab) |
| `api/admin/export/route.ts` | 309 | GET (CSV/JSON + anonymize) |
| `api/admin/settings/route.ts` | 49 | GET, POST |
| `api/admin/heatmap/route.ts` | 10 | GET (wraps lib/analytics) |
| `api/admin/stats/route.ts` | 10 | GET |
| `api/admin/wordcloud/route.ts` | 10 | GET |

### Lib (root)
| Path | Lines | Purpose |
|---|---|---|
| `lib/systemPromptBuilder.ts` | 779 | Bilingual Gemini prompt composer |
| `lib/analytics.ts` | 327 | Server aggregations + CSV export |
| `lib/companionAssets.ts` | 358 | Asset manifest + path resolver |
| `lib/companionTools.ts` | 140 | 3 function declarations + handlers |
| `lib/demoMode.ts` | 126 | Killswitch + admin password verify |
| `lib/bondPresets.ts` | 185 | Locale × gender nickname presets |
| `lib/voiceMapping.ts` | 69 | Gender × Role → voice + archetype |
| `lib/audioUtils.ts` | 61 | Float32 ↔ Int16 ↔ Base64 |
| `lib/companionSerialize.ts` | 44 | JSON ↔ string converters |
| `lib/professions.ts` | 44 | Datalist autocomplete |
| `lib/useDemoStatus.ts` | 55 | Client polling hook |
| `lib/useHydrated.ts` | 20 | Client-only mount flag |
| `lib/password.ts` | 19 | scrypt hash + verify |
| `lib/adminFetch.ts` | 12 | Inject x-admin-password header |
| `lib/prisma.ts` | 9 | Singleton client |
| `lib/adminAuth.ts` | 9 | Server require admin |
| `lib/adminConfig.ts` | 2 | Auth keys constants |

### Lib (admin)
| Path | Lines | Purpose |
|---|---|---|
| `lib/admin/filterBuilder.ts` | 210 | RespondentFilterState ↔ URL ↔ Prisma |
| `lib/admin/labels.ts` | 199 | Localized enum dict + stageColor |
| `lib/admin/chartTheme.ts` | 33 | ADMIN_COLORS + tooltip/axis tokens |

### Lib (i18n)
| Path | Lines | Purpose |
|---|---|---|
| `lib/i18n/dictionary.ts` | 2431 | ~1200 keys × 2 locale |
| `lib/i18n/useT.ts` | 32 | Translation hook |

### Stores
| Path | Lines | Purpose |
|---|---|---|
| `stores/useUserStore.ts` | 79 | Identity + auth |
| `stores/useCompanionStore.ts` | 239 | Companion design state |
| `stores/useEncounterStore.ts` | 157 | Real-time transcript merge |
| `stores/useSessionStore.ts` | 49 | Stage gating |
| `stores/useLocaleStore.ts` | 37 | Locale toggle |

### Hooks
| Path | Lines | Purpose |
|---|---|---|
| `hooks/useGeminiLive.ts` | 567 | WebSocket lifecycle + reconnect |
| `hooks/useAudioPlayer.ts` | 97 | Gapless 24kHz playback + analyser |
| `hooks/useAudioRecorder.ts` | 151 | 16kHz worklet/scriptProcessor PCM |

### Admin Components
| Path | Lines | Purpose |
|---|---|---|
| `components/admin/AdminTabBar.tsx` | 56 | Sticky 7-tab nav + animated underline |
| `components/admin/RespondentDetailDrawer.tsx` | 603 | 5-tab slide-in drawer |

### Creator Components
| Path | Lines | Purpose |
|---|---|---|
| `components/creator/CompanionVisual.tsx` | 423 | Sticky right preview panel |
| `components/creator/steps/StepShell.tsx` | 36 | Reusable wrapper |
| `components/creator/steps/VariantCard.tsx` | 54 | Shared face/hair/body card |
| `components/creator/steps/GenderStep.tsx` | 63 | ♀/♂ selector |
| `components/creator/steps/FaceShapeStep.tsx` | 35 | alpha/beta |
| `components/creator/steps/HairStyleStep.tsx` | 35 | hair1/hair2 |
| `components/creator/steps/BodyBuildStep.tsx` | 37 | body1/body2 |
| `components/creator/steps/SkinToneStep.tsx` | 86 | 4 swatch + comingSoon |
| `components/creator/steps/ExtremeFeaturesStep.tsx` | 432 | 2 toggle + drawer |
| `components/creator/steps/PersonaStep.tsx` | 482 | Role + 4 axis + 4 preset |
| `components/creator/steps/HobbiesStep.tsx` | 266 | 17-pill multi-select |

### Encounter Components
| Path | Lines | Purpose |
|---|---|---|
| `components/encounter/AIRingVisualizer.tsx` | 160+ | Canvas circular ring + spectral spokes |
| `components/encounter/AudioVisualizer.tsx` | 86 | Frequency bar visualizer |
| `components/encounter/CallControls.tsx` | 100+ | PTT + hangup + pause |
| `components/encounter/UserWaveform.tsx` | — | 22-bar mic waveform |
| `components/encounter/ChatStream.tsx` | — | Scrolling chat |
| `components/encounter/CompanionActionsOverlay.tsx` | — | Tool result UI |
| `components/encounter/ConversationSuggestions.tsx` | — | Quick-reply pills |
| `components/encounter/LanguageToggle.tsx` | — | Mid-call language switcher |
| `components/encounter/TranscriptScroll.tsx` | — | Scrollable transcript |

### Other Components
| Path | Purpose |
|---|---|
| `components/assembly/AssemblyAnimation.tsx` (160) | Terminal log typewriter |
| `components/assembly/FinalReveal.tsx` (104) | Portrait + badges + filter |
| `components/checkout/NeuroSigil.tsx` (243) | Animated radial barcode |
| `components/questionnaire/LikertScale.tsx` (97) | 5-point scale |
| `components/questionnaire/SingleChoice.tsx` (90) | Radio cards |
| `components/questionnaire/MultiChoice.tsx` (97) | Pills with optional max |
| `components/questionnaire/NPSScale.tsx` (89) | 0-10 color gradient |
| `components/questionnaire/EmailLookup.tsx` (200+) | Searchable directory |
| `components/layout/RouteGuard.tsx` (40) | Stage-gating + hydration |
| `components/layout/ErrorBoundary.tsx` (55) | Class boundary |
| `components/layout/Background.tsx` (29) | Fixed gradient + noise |
| `components/layout/PageTransition.tsx` (31) | Per-page fade-in |
| `components/landing/HeroSection.tsx` (115) | Headline + CTA + admin link |
| `components/landing/ParticleField.tsx` | Background animation |
| `components/ui/GlassButton.tsx` (63) | Motion button variants |
| `components/ui/GlassPanel.tsx` (33) | Glassmorphism panel |
| `components/ui/LoadingSpinner.tsx` (37) | Dual-ring spinner |
| `components/ui/LanguageSwitcher.tsx` | Language dropdown |
| `components/ui/DemoPausedScreen.tsx` | Killswitch full-screen UI |
| `components/ui/ToggleSwitch.tsx`, `SelectPills`, `SliderControl`, `CountdownTimer` | Shared primitives |

---

## EPILOG

Project ini dibangun dengan triple-purpose disiplin: **investor magnet × Harvard-grade dataset × hardware-R&D validation**. Setiap line code, setiap copy, setiap chart adalah keputusan yang melayani salah satu (atau semua) tujuan tersebut.

Ketika ragu menambah fitur, tanyakan: *"Apakah ini menarik investor di pameran? Apakah ini menambah kekayaan dataset? Apakah ini menjawab pertanyaan strategis sebelum hardware R&D?"* Kalau jawabannya semua tidak, mungkin tidak perlu ditambahkan.

Kalau berubah arsitektur, **update file ini**.

---

*Dokumen ini ditulis 2026-05-06 — sinkron dengan commit `64f131f` (Send x-admin-password header from all admin client-side fetches).*
