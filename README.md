<div align="center">

# 🌌 The Sovereign Companion

**Prototipe fungsional end-to-end untuk masa depan companionship AI — dipamerkan di Tech AI Future Indonesia 2076.**

*Sebuah marketplace tempat manusia merancang, menguji dengan suara, dan "memesan" companion humanoid AI yang dapat dikustomisasi secara mendalam — dari bentuk rahang, warna kulit, persona psikologis, hingga modul biologis sintetis.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![Gemini Live](https://img.shields.io/badge/Gemini%202.5-Native%20Audio-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

> "Perfection is No Longer a Myth. It's Engineered."

</div>

---

## 📖 Daftar Isi

- [Konsep & Premis](#-konsep--premis)
- [Tujuan Strategis (Triple Purpose)](#-tujuan-strategis-triple-purpose)
- [Alur User 8 Tahap](#-alur-user-8-tahap)
- [Fitur Unggulan](#-fitur-unggulan)
- [Arsitektur Teknis](#-arsitektur-teknis)
- [Model Bisnis](#-model-bisnis-masa-depan)
- [Admin Dashboard](#-admin-dashboard)
- [Demo Mode Killswitch](#-demo-mode-killswitch-proteksi-biaya--keamanan)
- [Setup Lokal](#-setup-lokal)
- [Deployment](#-deployment)
- [Struktur Project](#-struktur-project)
- [Roadmap](#-roadmap)
- [Kontribusi & Lisensi](#-kontribusi--lisensi)

---

## 🌠 Konsep & Premis

**Tahun 2076.** Manusia telah mencapai titik kelelahan batin (*social fatigue*) dalam berinteraksi dengan sesama manusia. Dating burnout, urban loneliness, dan fragmentasi hubungan sosial membuka pasar baru yang masif — **companionship artificial yang dikustomisasi 100% sesuai kebutuhan individu**.

The Sovereign Companion adalah prototipe marketplace tersebut. Dari depan PC, user dapat:

1. **Merancang** robot humanoid mereka — wajah, rambut, bentuk tubuh, warna kulit, hingga modul biologis sintetis (rahim buatan, bank sperma).
2. **Mengatur persona psikologis** — dominasi, kepolosan, emosi, humor, dan hobi (17 kategori minat).
3. **Menguji dengan suara langsung** — percakapan real-time 5 menit dengan companion via Gemini 2.5 Flash Native Audio.
4. **"Memesan"** dengan simulasi checkout futuristik → countdown 10 detik → pengantaran fisik langsung ke depan booth (teatrikal di pameran).
5. **Memberikan feedback** lewat kuesioner skala Likert kelas riset akademik.

Setiap pergerakan slider, setiap pilihan toggle, setiap kata yang diucapkan, dan setiap respon kuesioner **tercatat secara real-time ke database** — membentuk dataset riset yang belum pernah ada sebelumnya di industri ini.

---

## 🎯 Tujuan Strategis (Triple Purpose)

Prototipe ini bukan sekadar demo. Setiap keputusan desain ditimbang terhadap **tiga tujuan sekaligus**:

### 1. 🧲 Magnet Investor
Pameran Tech AI Future Indonesia menjadi panggung untuk memenangkan pendanaan. Momen *physical bridge* di tahap checkout — di mana paket fisik benar-benar muncul di meja user setelah countdown 10 detik — adalah kejutan teatrikal yang diingat investor berbulan-bulan setelah pameran. Polish visual, latensi suara Gemini yang nyaris nol, dan koreografi sinematik diprioritaskan di atas breadth fitur.

### 2. 🎓 Dataset Riset Kelas Harvard
Setiap sesi menghasilkan data yang layak publikasi ilmiah:

- **Timestamps** lengkap (registered → customized → assembled → encounter start/end → checkout → survey → completed) untuk analisis funnel akademik.
- **Pola kustomisasi** lintas demografi (gender × role × usia × status hubungan).
- **Transkrip percakapan** yang di-tag sentimen untuk analisis topik behavioral.
- **Skala Likert** multi-dimensi tentang kesediaan pengganti interaksi manusia.

Ini adalah *moat data* proprietary untuk jurnal ilmiah dan positioning akademik jangka panjang.

### 3. 🔬 Validasi Pasar Sebelum R&D Hardware
Sebelum menghabiskan jutaan dolar pada R&D robotika fisik, dashboard admin menjawab pertanyaan strategis:

- Berapa persen user mengaktifkan **Artificial Womb** atau **Sperm Bank**?
- Role mana yang paling diminati? (Romantic Partner / Dominant Assistant / Passive Listener / Intellectual Rival)
- Kombinasi fisik mana yang paling populer? (Top-10 chart)
- Apa yang sebenarnya dibicarakan user dengan companion-nya? (Word cloud dari transkrip)

Setiap chart adalah **instrumen keputusan bisnis**, bukan dekorasi.

---

## 🚶 Alur User 8 Tahap

```
  1. Landing        →   Intro sinematik + CTA "Mulai Rancang Companion-mu"
  2. Register       →   Nama, email, usia, profesi, status, nickname, gender
  3. Creator Studio →   8-step sequential picker (Gender → Face → Hair → Body
                        → Skin → Extreme Features → Persona → Hobbies)
  4. Assembly       →   Animasi perakitan 6.5 detik + reveal potret sinematik
  5. Encounter      →   5 menit percakapan suara real-time dengan Gemini Live
  6. Checkout       →   Neuro-sigil QR + alamat + countdown 10 detik
  7. Questionnaire  →   Likert 1-5 + feature attribution + freeform feedback
  8. Completed      →   Sesi selesai, data tersimpan
```

Setiap stage dilindungi **`RouteGuard`** berbasis Zustand — user tidak bisa melompat ke tahap yang belum terbuka, dan dapat melanjutkan sesi jika halaman di-refresh (state persist ke `localStorage`).

### Creator Studio — 8 Langkah Sekuensial

Berbeda dari versi awal yang memakai continuous sliders, Creator Studio saat ini menggunakan **pre-generated combinatorial picker**:

| Step | Pilihan | Efek |
|------|---------|------|
| 1. Gender | Female / Male | Gate untuk varian face, hair, dan modul biologis |
| 2. Face Shape | Alpha / Beta (gender-specific) | Varian PNG hiper-realistik |
| 3. Hair Style | Hair 1 / Hair 2 (gender-specific) | Varian PNG |
| 4. Body Build | Body 1 / Body 2 (gender-specific) | Varian PNG — trigger preload |
| 5. Skin Tone | Fair / Medium / Tan / Deep | CSS `filter` overlay (bukan varian image) |
| 6. Extreme Features | Artificial Womb / Sperm Bank | Spec-only + feature badge overlay |
| 7. Persona | Role + 4 slider trait | System prompt Gemini |
| 8. Hobbies | 17-pill multi-select | System prompt Gemini |

**Total kombinasi visual:** 2 × 2 × 2 × 2 = **16 komposit hiper-realistik**. Zero runtime AI rendering → investor-demo-proof + zero-latency.

---

## ✨ Fitur Unggulan

### 🎙️ Real-Time Voice AI dengan Gemini Live
- Model: `gemini-2.5-flash-native-audio-preview-12-2025`
- WebSocket browser-direct via `@google/genai` SDK
- **Audio pipeline end-to-end**: `getUserMedia` 16 kHz → `ScriptProcessorNode` → Float32 → Int16 → base64 PCM → Gemini
- **Output playback**: base64 PCM 24 kHz → AudioContext → AnalyserNode → circular canvas visualizer (128-bin FFT)
- **Live transcription** bidirectional (user + companion) tersimpan dengan `sequenceOrder` untuk replay akurat
- **Tool calling** mock: `smart_home`, `set_reminder`, `check_weather` — menunjukkan kemampuan agentic
- Ephemeral token minting server-side untuk keamanan API key

### 🧠 Dynamic Persona Injection
System prompt di-compose real-time dari pilihan user:
```
You are [CompanionName], a humanoid companion designed for [UserName].
Role: [Romantic Partner]. Dominance: [very dominant]. Innocence: [naive].
Emotional depth: [highly expressive]. Humor: [dry, sarcastic].
Interests: Technology, Philosophy, Intimacy, Nightlife, Fashion.
```
Slider numerik dimapping ke deskripsi linguistik via `describeLevel()` — AI merespons dengan karakterisasi yang sangat berbeda antara "dominant" vs "submissive".

### 🎨 Visual Direction: *Utopian Cyber-Elegance*
- Background obsidian `#0A0A0A` + glassmorphism panels
- Accent **cyan `#00F0FF`** + **bio-green `#39FF14`**
- Font: Inter (body) + Space Grotesk (display)
- **Framer Motion 12** untuk transisi biologis & sinematik
- **Tanpa em-dash** di string user-facing (sesuai brand voice)

### 🌏 Bilingual EN/ID
Seluruh UI tersedia dalam Bahasa Indonesia dan English via custom `useT()` hook + dictionary flat-key. Default locale: Indonesia. Admin dashboard: English-only (audience investor/akademik internasional).

### 💾 State Persistence yang Tahan Refresh
Empat Zustand store (`user`, `session`, `companion`, `locale`) persist ke **localStorage** dengan `onRehydrateStorage` hydration flag untuk mencegah race condition saat first render. User dapat menutup tab di tengah Creator Studio dan melanjutkan sesi saat kembali.

### 🔒 Session Reset Terkontrol
Landing page CTA adalah **satu-satunya** surface yang me-wipe state browser — memastikan pengunjung booth berikutnya mulai fresh tanpa mengganggu data SQLite yang sudah tersimpan.

---

## 🏗️ Arsitektur Teknis

### Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend                                                    │
│  ├─ Next.js 16 (App Router + Turbopack)                      │
│  ├─ React 19.2                                               │
│  ├─ TypeScript 5                                             │
│  ├─ Tailwind CSS v4                                          │
│  ├─ Framer Motion 12 (animasi)                               │
│  ├─ Recharts 3 (admin charts)                                │
│  └─ d3-cloud (word cloud)                                    │
├─────────────────────────────────────────────────────────────┤
│  State                                                       │
│  └─ Zustand 5 + persist middleware → localStorage            │
├─────────────────────────────────────────────────────────────┤
│  Backend (Next.js API Routes — Node runtime)                 │
│  ├─ /api/users           — Registrasi & fetch profil         │
│  ├─ /api/companion-config — Auto-save konfigurasi (debounce) │
│  ├─ /api/transcripts      — Persist transkrip percakapan     │
│  ├─ /api/sessions         — Stage timestamp tracker          │
│  ├─ /api/gemini-token     — Ephemeral token minter           │
│  ├─ /api/admin/*          — Dashboard endpoints (gated)      │
│  └─ /api/settings/demo-status — Public killswitch status     │
├─────────────────────────────────────────────────────────────┤
│  Database                                                    │
│  └─ SQLite via Prisma 6 — 6 model (User, CompanionConfig,    │
│     Transcript, SurveyResult, Session, AppSettings)          │
├─────────────────────────────────────────────────────────────┤
│  Voice AI                                                    │
│  └─ Gemini 2.5 Flash Native Audio Preview                    │
│     (browser-direct WebSocket via @google/genai)             │
├─────────────────────────────────────────────────────────────┤
│  Deployment                                                  │
│  └─ Single-container Docker (SQLite di-mount via volume)     │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

```prisma
User              1 ─── 1 CompanionConfig
User              1 ─── 1 Session
User              1 ─── 1 SurveyResult
User              1 ─── N Transcript  (ordered by sequenceOrder)
AppSettings       (singleton id=1 — demo mode state)
```

**Notable fields:**
- `CompanionConfig.features` — JSON string: `{ artificialWomb: bool, spermBank: bool }`
- `CompanionConfig.hobbies` — JSON string array
- `CompanionConfig.userNickname` — JSON string array (client kirim `userNicknames: string[]`, API normalisasi)
- `Session.*At` — 8 timestamp kolom untuk funnel analysis
- `Transcript.sequenceOrder` — integer monotonic untuk reconstruction chat

### Audio Pipeline Detail

**Input (user → Gemini):**
```
navigator.mediaDevices.getUserMedia()
  → AudioContext (16 kHz mono)
  → ScriptProcessorNode (buffer 4096)
  → Float32Array → Int16Array → base64
  → session.sendRealtimeInput({ audio: { data, mimeType: "audio/pcm;rate=16000" } })
```

**Output (Gemini → user):**
```
session.onmessage → base64 PCM chunks
  → AudioContext (24 kHz)
  → AudioBufferSourceNode
  → AnalyserNode (FFT 128)
  → CanvasVisualizer (circular waveform)
  → speakers
```

**Transkripsi:**
- `inputTranscription` (user speech → text) disimpan real-time
- `outputTranscription` (companion response → text) disimpan real-time
- Setelah session end: batch POST ke `/api/transcripts`

---

## 💼 Model Bisnis Masa Depan

Prototipe ini sendiri tidak dimonetisasi, tetapi arsitektur dan copy ditulis untuk mendukung **enam layer revenue stream** masa depan:

| # | Revenue Stream | Model |
|---|---|---|
| 1 | **Hardware Sales** | One-time premium per unit robot kustom |
| 2 | **Lifetime Companionship Subscription** | Recurring cloud AI brain (disebut eksplisit di checkout copy) |
| 3 | **Biological Module Upgrades** | Add-on premium (Artificial Womb / Sperm Bank) |
| 4 | **Customization Marketplace** | 30% platform commission (model App Store) |
| 5 | **Biomechanic Maintenance Service** | Annual fee (warranty card dalam physical box = sinyal ini) |
| 6 | **B2B Data Licensing** | Aggregate insights ke fashion / kosmetik / sex-tech / elderly-care / mental-health |

### Target Market

**Primary (hyper-convert):** "Opting Out of Human Dating" — urban 25-40, high-income, technophile, ideologically ready.

**Primary:** "Single" — loneliness + dating fatigue.

**Secondary:** "Complicated" (escape fantasy), "Married" (domestic assistant — framing hati-hati).

### Geographic Rollout

```
Phase 1: Indonesia urban premium (Jakarta / Surabaya / Bali via exhibition)
Phase 2: East Asia (Japan / Korea — sex-tech matang + kultur hikikomori)
Phase 3: Global (US West Coast, Northern Europe)
```

### Investor Profile

Sex-tech, elderly care, mental health tech, luxury consumer.

---

## 📊 Admin Dashboard

Dashboard khusus tim project (`/admin`) — password-gated via `AdminLayout` dengan server-side verifikasi. Terdiri dari **7 tab segmented**:

### 1. Overview
KPI dengan *period-over-period delta*, area chart aktivitas sesi (toggle 7/30/90 hari), conversion funnel + drop-off per step, engagement hourly line, live activity feed.

### 2. Respondents
Tabel Google-Forms-style searchable dengan **URL-synced filters**:
- Gender, role, face/hair/body/skin, extreme features (tri-state), age, experience, NPS bucket
- Date range, completion/drop, relationship status
- Row click → `RespondentDetailDrawer` dengan tab profil / companion / survey / transcript / session

### 3. Transcripts
Viewer percakapan two-pane: daftar sesi + preview & metrik di kiri, transkrip dengan highlight-search di kanan, plus kontrol copy / download-JSON.

### 4. Insights
- **NPS gauge** (promoter / passive / detractor)
- **Purchase intent histogram**
- **4-point persona radar** + per-role persona profile
- **Role pie** + physical attribute grouped bars
- **Age buckets** + relationship distribution
- **Gender × role cross-tab heatmap**
- **Hobby popularity** + extreme-feature adoption %
- **Top-10 combinations gallery** (`F_FACE01_HAIR02_BODY01` dll)
- **Word cloud** dari transkrip (stop-word filter EN + ID)

### 5. Research
Empat sub-tab — Likert histograms (grouped + mean/median/n), single/multi-choice distributions, qualitative responses dengan regex-based positive/negative/neutral sentiment tagging, cross-tabs (experience × role, ranked Likert means table).

### 6. Export
Dataset picker (respondents / survey-only / transcripts) × format (CSV / JSON) × privacy anonymization toggle (replace identifiers dengan `anon-*` opaque IDs). **9 filter presets** built-in.

### 7. Settings
**Demo mode killswitch** dan konfigurasi global aplikasi (detail di section berikutnya).

---

## 🛡️ Demo Mode Killswitch (Proteksi Biaya & Keamanan)

Fitur kritis untuk pameran: admin dapat **menjeda seluruh demo** di luar jam kerja untuk mencegah penggunaan Gemini Live yang tidak diinginkan (biaya API) tanpa perlu redeploy.

### Defense in Depth

```
┌─────────────────────────────────────────────────────────┐
│ 1. Database (AppSettings singleton)                      │
│    ├─ demoPaused: boolean                                │
│    ├─ scheduleEnabled: boolean                           │
│    ├─ scheduleStart: "09:00"                             │
│    ├─ scheduleEnd: "17:00"                               │
│    └─ pausedMessage: custom text per locale              │
├─────────────────────────────────────────────────────────┤
│ 2. Public Status Endpoint (/api/settings/demo-status)    │
│    └─ No-store cache, polling 60s (30s saat encounter)   │
├─────────────────────────────────────────────────────────┤
│ 3. Server Enforcement (HTTP 503 "demo_paused")           │
│    ├─ /api/gemini-token      — Block Gemini token        │
│    ├─ /api/users             — Block registrasi          │
│    ├─ /api/companion-config  — Block save config         │
│    ├─ /api/transcripts       — Block save transkrip      │
│    └─ /api/sessions          — Block session tracking    │
├─────────────────────────────────────────────────────────┤
│ 4. Client UI (DemoPausedScreen)                          │
│    └─ Full-screen paused state dengan custom message     │
└─────────────────────────────────────────────────────────┘
```

### Logic Evaluasi

```typescript
function evaluateStatus(settings: AppSettings): DemoStatus {
  if (settings.demoPaused) return "paused";
  if (!settings.scheduleEnabled) return "active";

  const now = currentTimeHHMM();
  const { scheduleStart, scheduleEnd } = settings;

  // Midnight wrap support (e.g., start=22:00, end=06:00)
  if (scheduleStart <= scheduleEnd) {
    return now >= scheduleStart && now < scheduleEnd ? "active" : "paused";
  } else {
    return now >= scheduleStart || now < scheduleEnd ? "active" : "paused";
  }
}
```

Admin tidak perlu SSH ke server untuk mematikan demo — cukup toggle di dashboard.

### Admin Password — Server-Side Verified

Login admin dilakukan via `POST /api/admin/login` yang verifikasi terhadap `process.env.ADMIN_PASSWORD`. **Tidak ada hardcode password di source code**. Jika env tidak di-set, login akan selalu gagal (fail-closed).

Admin-gated endpoint menerima header `x-admin-password` yang divalidasi ulang di setiap request — tidak hanya trust client-side session.

---

## 🛠️ Setup Lokal

### Prerequisites

- Node.js 20+ (recommended LTS)
- npm atau pnpm
- Gemini API key dari [Google AI Studio](https://aistudio.google.com/app/apikey)

### Langkah

```bash
# 1. Clone repo
git clone https://github.com/nugrahalabib/Future-Companion.git
cd Future-Companion/sovereign-companion

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env dan isi:
#   - GEMINI_API_KEY (dari Google AI Studio)
#   - NEXT_PUBLIC_GEMINI_API_KEY (sama, untuk browser)
#   - ADMIN_PASSWORD (ganti dari default!)

# 4. Generate Prisma client + apply migrations
npx prisma generate
npx prisma migrate dev

# 5. Start dev server (port 2970)
npm run dev
```

Buka http://localhost:2970 — siap digunakan.

### Optional: Prisma Studio (DB inspector)

```bash
npx prisma studio
```

### Optional: Production Build

```bash
npm run build
npm start
```

---

## 🚢 Deployment

### Docker (Recommended)

```bash
cd sovereign-companion
docker-compose up --build
```

`docker-compose.yml` mendefinisikan single service `app`. SQLite file ada di dalam container — untuk production dengan data durable, **mount volume** ke `/app/prisma/` atau switch `DATABASE_URL` + provider ke PostgreSQL.

### Environment Variables Wajib

| Variable | Deskripsi | Contoh |
|---|---|---|
| `DATABASE_URL` | Connection string Prisma | `file:./dev.db` |
| `GEMINI_API_KEY` | Server-side Gemini key (ephemeral token minter) | `AIza...` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Browser-side (expose terbatas) | `AIza...` |
| `ADMIN_PASSWORD` | Password dashboard admin | `change-me-in-prod` |
| `NEXT_PUBLIC_APP_URL` | Public origin untuk absolute URL | `https://domain.com` |

### Pre-Exhibition Gotchas

⚠️ **`NEXT_PUBLIC_GEMINI_API_KEY` terekspos ke browser** — pasang rate limiting + key rotation sebelum public demo.

⚠️ **SQLite di dalam Docker image** — mount volume atau migrasi ke Postgres jika data harus survive redeploy.

⚠️ **Akurasi STT Gemini bergantung aksen Indonesia + noise booth** — test dengan native speaker di lingkungan ramai.

⚠️ **Landing CTA hanya wipe browser state**, bukan SQLite — antar pengunjung booth tidak saling leak cache, tapi analytics merekam semua sesi.

---

## 📁 Struktur Project

```
Prototype-Future-AI/
├── sovereign-companion/           ← Working directory utama
│   ├── prisma/
│   │   ├── schema.prisma          ← 6 model (User, CompanionConfig, dll)
│   │   └── migrations/            ← Migration history
│   ├── public/
│   │   └── assets/
│   │       ├── combine/           ← 16 composite portraits
│   │       ├── detail-1on1/       ← Thumbnail category
│   │       ├── fiture/            ← Feature overlays
│   │       └── id-en/             ← i18n illustrations
│   ├── src/
│   │   ├── app/                   ← Next.js App Router pages + API routes
│   │   │   ├── (8 user-flow pages)
│   │   │   ├── admin/             ← 7-tab dashboard
│   │   │   └── api/               ← REST endpoints
│   │   ├── components/
│   │   │   ├── admin/             ← AdminTabBar, RespondentDetailDrawer, dll
│   │   │   ├── creator/           ← 8 step components
│   │   │   ├── assembly/          ← AssemblyAnimation, FinalReveal
│   │   │   ├── encounter/         ← Voice visualizer, transcript panel
│   │   │   └── ui/                ← Shared primitives
│   │   ├── lib/
│   │   │   ├── companionAssets.ts ← Asset manifest + path resolver
│   │   │   ├── systemPromptBuilder.ts ← Gemini prompt composer
│   │   │   ├── demoMode.ts        ← Killswitch logic + password verify
│   │   │   ├── analytics.ts       ← Dashboard aggregations
│   │   │   └── i18n/dictionary.ts ← EN + ID translations
│   │   └── stores/                ← Zustand stores (4 persisted)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── AGENTS.md                  ← Next.js 16 breaking-change notice
│   └── .env.example               ← Template environment
├── BRIEF.md                       ← Project brief asli + brainstorm
├── CLAUDE.md                      ← Guidance internal tim
└── README.md                      ← File ini
```

---

## 🗺️ Roadmap

### ✅ Selesai
- [x] 8-stage user flow end-to-end
- [x] Creator Studio 8-step sequential (16 composite assets)
- [x] Gemini Live voice encounter 5 menit
- [x] Transcript persistence + word cloud
- [x] Admin dashboard 7 tab (Overview / Respondents / Transcripts / Insights / Research / Export / Settings)
- [x] Demo mode killswitch (manual + schedule)
- [x] Bilingual EN/ID
- [x] Server-side admin auth
- [x] Single-container Docker deployment

### 🚧 In Progress
- [ ] Key rotation + rate limiting untuk `NEXT_PUBLIC_GEMINI_API_KEY`
- [ ] Migrasi optional ke PostgreSQL untuk production scale
- [ ] Sentiment analysis real-time (tidak hanya post-hoc regex)

### 🔮 Future
- [ ] Integrasi CRM untuk follow-up investor post-pameran
- [ ] A/B testing framework untuk variasi copy landing
- [ ] Multi-booth sync (centralized dashboard untuk pameran multi-kota)
- [ ] Jurnal ilmiah publikasi dengan dataset anonymized

---

## 🤝 Kontribusi & Lisensi

Proyek ini dikembangkan oleh **Nugraha Labib Mujaddid** untuk pameran Tech AI Future Indonesia 2026.

Pull request, issue report, dan diskusi fitur sangat diterima. Jika kamu investor, akademisi, atau calon mitra, silakan reach out via email project.

### ⭐ Support

Jika kamu menemukan proyek ini menarik — **beri GitHub Star**. Ini membantu kami mengukur reach komunitas dan meningkatkan visibilitas di ekosistem AI Indonesia.

### 📧 Kontak

**Author:** Nugraha Labib Mujaddid
**Email:** nugrahalabib@gmail.com
**GitHub:** [@nugrahalabib](https://github.com/nugrahalabib)
**Instagram:** [@nugrahalabib](https://instagram.com/nugrahalabib)
**TikTok:** [@nugrahalabib](https://tiktok.com/@nugrahalabib)

### 📄 Lisensi

MIT — bebas digunakan untuk riset akademik dan inspirasi. Atribusi dihargai.

---

<div align="center">

**"Welcome to the future of companionship. Design your ultimate reality without the friction of human flaws."**

*Dibuat dengan obsidian, cyan neon, dan sedikit sentuhan bio-green. 🌌*

</div>
