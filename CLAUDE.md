# CLAUDE.md

Guidance for Claude Code working in this repository. Keep this file in sync with reality — if you change architecture, update it.

## Project Overview

**The Sovereign Companion** — a functional end-to-end prototype for the "Tech AI Future Indonesia" exhibition. Set in 2076, it stages a marketplace where a visitor designs, voice-tests, and "orders" a hyper-customizable AI humanoid companion. The demo captures real user data for product feedback, market research, and academic publication (Harvard-grade journal material).

## Strategic Framing (Triple Purpose — Not Just a Demo)

Every trade-off must be judged against these three goals, not generic product metrics:

1. **Investor Magnet** — secures funding at the exhibition. The theatrical physical box reveal at stage 6 (software↔hardware bridge) is the moment investors remember months later. Visual polish, cinematic countdown, and Gemini voice latency matter more than feature breadth.
2. **Harvard-Grade Research Dataset** — every selection, transcript, and Likert response feeds academic publication and a proprietary data moat. Data integrity is sacred. Session timestamps (registeredAt → customizedAt → assembledAt → encounterStartAt/EndAt → checkoutAt → surveyAt → completedAt) enable funnel analysis with academic rigor.
3. **Market Validation Before Hardware R&D** — the admin dashboard answers strategic questions (% enabling Synthetic Uterus, most popular role, popular physical combinations, word cloud topics) that determine the real-product roadmap before millions are committed to robotics. Charts are decision instruments, not decoration.

## Business Model (Future Revenue Streams)

The prototype itself is not monetized, but the architecture and copy are set up for six layered revenue streams:
1. Hardware sales (customized robot units, premium one-time)
2. Lifetime Companionship Subscription (cloud AI brain, recurring — named in checkout copy)
3. Biological module upgrades (Artificial Womb, Sperm Bank as premium add-ons)
4. Customization marketplace (30% platform commission, App Store model)
5. Biomechanic maintenance service (annual fee, warranty card in the physical box signals this)
6. B2B data licensing (aggregate insights to fashion / cosmetics / sex-tech / elderly-care / mental-health)

## Target Market

- **Primary (hyper-convert):** "Opting Out of Human Dating" — urban 25-40, high-income, technophile, ideologically ready
- **Primary:** "Single" — loneliness + dating fatigue
- **Secondary:** "Complicated" (escape fantasy), "Married" (domestic assistant — careful framing)
- **Geographic rollout:** Phase 1 Indonesia urban premium (Jakarta / Surabaya / Bali via exhibition) → Phase 2 East Asia (Japan / Korea, mature sex-tech + hikikomori culture) → Phase 3 global (US West Coast, Northern Europe)
- **Investor profile:** sex-tech, elderly care, mental health tech, luxury consumer

## Working Directory

All active code lives in `sovereign-companion/`. The root `src/` is leftover `create-next-app` boilerplate — ignore it.

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Framer Motion 12
- **Backend:** Next.js API Routes (Node.js)
- **Database:** SQLite via Prisma 6 (file at `sovereign-companion/prisma/dev.db`). The `pg` npm package is a leftover dependency and is not used — the datasource provider is `sqlite`.
- **State Management:** Zustand 5 with `persist` middleware → **localStorage** (survives refresh and tab close)
- **Voice AI:** Gemini 2.5 Flash Native Audio Preview (Live API) — model ID `gemini-2.5-flash-native-audio-preview-12-2025`, browser-direct WebSocket via `@google/genai`
- **Charts:** Recharts 3 (admin dashboard) + `d3-cloud` (word cloud)
- **Deployment:** Single-container Docker. `docker-compose.yml` defines only the `app` service; the SQLite file ships inside the container (for production with durable data, mount a volume at `/app/prisma/` or switch `DATABASE_URL` + provider)

## User Flow (8 Stages + Admin)

Stage numbers match `useSessionStore.currentStage` and the `RouteGuard` stage map at [src/components/layout/RouteGuard.tsx](sovereign-companion/src/components/layout/RouteGuard.tsx).

1. **Landing** — Cinematic intro. CTA "Mulai Rancang Companion-mu" **wipes all browser state** (`userStore.clearUser`, `companionStore.reset`, `encounterStore.reset`, `sessionStore.reset`) before routing to `/register`, so the next booth visitor starts clean. Records already in SQLite are untouched.
2. **Register** — Collects name, email, age, profession, relationship status, user nicknames (up to 3, what the companion will call the user), companion name, user gender → `User` + initial `CompanionConfig` + `Session`
3. **Creator Studio** — 8-step sequential picker (Gender → Face → Hair → Body → Skin → Extreme Features → Persona → Hobbies) → updates `CompanionConfig`. No runtime AI rendering; selections map to pre-generated hyper-realistic PNGs.
4. **Assembly** — 6.5-second cinematic animation (scanning lines, particle synthesis, phased log stream) → cinematic fade-in of the final composite portrait with feature badges and skin-tone CSS filter. Timestamp: `assembledAt`.
5. **The Encounter** — **5-minute** voice session with Gemini Live (`ENCOUNTER_DURATION_SECONDS = 300`). Persona config + hobbies + companion name + user nicknames injected as system prompt. Live transcription writes to `Transcript` with `sequenceOrder`. Tool calls: `smart_home`, `set_reminder`, `check_weather` (mocked).
6. **Checkout & Delivery** — Neuro-sigil QR simulation, address typewriter geo-lookup (hardcoded Jakarta Selatan drop point), 10-second countdown, staged "Companion Has Arrived" confirmation.
7. **Post-Demo Questionnaire** — Likert scale + feature attribution + freeform feedback → `SurveyResult`. Options include Physical Design, Biological Features, Persona & Personality, Hobbies & Interests, Voice Interaction, Final Reveal Moment.
8. *(completed state — final stage counter value)*

**Admin Dashboard** (`/admin`) — project-team only. Password-gated via `AdminLayout` in [src/app/admin/layout.tsx](sovereign-companion/src/app/admin/layout.tsx). Login POSTs to `/api/admin/login` which compares against the `ADMIN_PASSWORD` env var (no fallback — missing env = login always fails). On success the password is cached in `sessionStorage` under `sovereign-admin-pw` and re-used as the `x-admin-password` header on admin-gated API calls. `/admin` redirects to `/admin/overview`. The layout hosts a sticky `AdminTabBar` with seven segmented routes (Overview, Respondents, Transcripts, Insights, Research, Export, Settings):

- **Overview** ([admin/overview](sovereign-companion/src/app/admin/overview/page.tsx)) — KPIs with period-over-period deltas, daily session-activity area chart (7/30/90-day toggle), conversion funnel + per-step drop-off, hourly engagement line, live activity feed. API: [api/admin/overview](sovereign-companion/src/app/api/admin/overview/route.ts).
- **Respondents** ([admin/respondents](sovereign-companion/src/app/admin/respondents/page.tsx)) — Google-Forms-style searchable table with URL-synced filters (gender, role, face/hair/body/skin, extreme features tri-state, age, experience, NPS bucket, date range, completion/drop, relationship). Row click opens `RespondentDetailDrawer` showing profile / companion / survey / transcript / session tabs. APIs: [api/admin/respondents](sovereign-companion/src/app/api/admin/respondents/route.ts), [api/admin/respondents/[id]](sovereign-companion/src/app/api/admin/respondents/[id]/route.ts). Filter encoding lives in [lib/admin/filterBuilder.ts](sovereign-companion/src/lib/admin/filterBuilder.ts).
- **Transcripts** ([admin/transcripts](sovereign-companion/src/app/admin/transcripts/page.tsx)) — two-pane conversation viewer: session list with preview + metrics on the left, highlight-searchable transcript on the right, with copy / download-JSON controls. APIs: [api/admin/transcripts](sovereign-companion/src/app/api/admin/transcripts/route.ts), [api/admin/transcripts/[userId]](sovereign-companion/src/app/api/admin/transcripts/[userId]/route.ts).
- **Insights** ([admin/insights](sovereign-companion/src/app/admin/insights/page.tsx)) — NPS gauge (promoter / passive / detractor), purchase intent histogram, 4-point persona radar + per-role persona profile, role pie, physical attribute grouped bars, age buckets, relationship distribution, gender×role cross-tab heatmap, hobby popularity, extreme-feature adoption %, top-10 combinations gallery, word cloud. API: [api/admin/insights](sovereign-companion/src/app/api/admin/insights/route.ts).
- **Research** ([admin/research](sovereign-companion/src/app/admin/research/page.tsx)) — four sub-tabs: Likert histograms (grouped by survey section, with mean/median/n), single + multi-choice distributions, qualitative responses with regex-based positive/negative/neutral sentiment tagging + search, cross-tabs (experience × role, ranked Likert means table). API: [api/admin/research](sovereign-companion/src/app/api/admin/research/route.ts).
- **Export** ([admin/export](sovereign-companion/src/app/admin/export/page.tsx)) — dataset picker (respondents / survey-only / transcripts), CSV or JSON format, privacy anonymization toggle (replaces identifiers with `anon-*` opaque IDs), 9 filter presets. The Respondents tab also exports the current filter state directly. API: [api/admin/export](sovereign-companion/src/app/api/admin/export/route.ts) honors the same filter query params as `/api/admin/respondents`.

Shared admin primitives: [components/admin/AdminTabBar.tsx](sovereign-companion/src/components/admin/AdminTabBar.tsx), [components/admin/RespondentDetailDrawer.tsx](sovereign-companion/src/components/admin/RespondentDetailDrawer.tsx), [lib/admin/chartTheme.ts](sovereign-companion/src/lib/admin/chartTheme.ts), [lib/admin/labels.ts](sovereign-companion/src/lib/admin/labels.ts). The `LanguageSwitcher` hides itself on `/admin/*` since the dashboard is English-only.

## Visual Direction

- **Theme:** Utopian Cyber-Elegance (Apple × Westworld)
- **Colors:** Deep obsidian (`#0A0A0A`) background, glassmorphism panels, cyan (`#00F0FF`) and bio-green (`#39FF14`) accents
- **Typography:** Inter (body), Space Grotesk (display)
- **Animations:** Biological, Framer Motion throughout
- **Language:** Bilingual EN/ID via [src/lib/i18n/dictionary.ts](sovereign-companion/src/lib/i18n/dictionary.ts). Default locale is ID. **No em-dashes in user-facing strings** (removed per brand voice — code comments may still use them).

## Development Commands

```bash
cd sovereign-companion

npm install

# Database (SQLite — no Docker required)
npx prisma generate
npx prisma migrate dev
npx prisma studio

# Dev server (port 2970)
npm run dev

# Production build
npm run build
npm start

# Full Docker (app container only — SQLite inside the image)
docker-compose up --build
```

Default `.env` uses `DATABASE_URL="file:./dev.db"`, `NEXT_PUBLIC_APP_URL=http://localhost:2970`, and shared `GEMINI_API_KEY` / `NEXT_PUBLIC_GEMINI_API_KEY`.

## Creator Studio Customization Surface (8 sequential steps)

Refactored from continuous sliders → pre-generated combinatorial picker. The app is a pure lookup from (gender, face, hair, body) → hyper-realistic asset path. Zero runtime AI rendering makes it investor-demo-proof and zero-latency.

1. **Gender** — `female` / `male`. Gates face + hair options and the gender-locked bio module.
2. **Face Shape** — 2 gender-specific variants: `alpha`, `beta`.
3. **Hair Style** — 2 gender-specific variants: `hair1`, `hair2`.
4. **Body Build** — 2 gender-specific variants: `body1`, `body2`. Final composite preload is triggered here.
5. **Skin Tone** — 4 categorical strings (`fair` / `medium` / `tan` / `deep`) applied as a CSS `filter` overlay — not a separate image variant.
6. **Extreme Features** — 2 toggles (Artificial Womb for female, Sperm Bank for male). Spec-only; does NOT change the image. Renders as feature badges on the final portrait.
7. **Persona** — Role (Romantic Partner / Dominant Assistant / Passive Listener / Intellectual Rival) + 4 sliders (Dominance, Innocence, Emotional, Humor). Feeds Gemini system prompt.
8. **Hobbies** — 17-pill multi-select (Technology, Philosophy, Science, Literature, Finance, Arts, Music, Cooking, Photography, Sensuality, Sports, Travel, Survival, Nightlife, Fashion, Gaming, Intimacy). Feeds Gemini system prompt. **"Intimacy" vibe copy is 18+** because the description itself is part of the system prompt — do not soften it to "pillow-talk" wording. Vibe prose in [systemPromptBuilder.ts](sovereign-companion/src/lib/systemPromptBuilder.ts) is kept byte-for-byte in lockstep with `creator.hobbies.vibe.*` entries in [dictionary.ts](sovereign-companion/src/lib/i18n/dictionary.ts) — edit both when the copy changes.

**Asset manifest:** [src/lib/companionAssets.ts](sovereign-companion/src/lib/companionAssets.ts) maps selections → PNG paths under `sovereign-companion/public/assets/`:
- Final portraits: `/assets/combine/{Gender} (G) - Face {Face} - Hair {H} - Body {B}.png` → 2 × 2 × 2 × 2 = **16 composites**
- Category thumbnails: `/assets/detail-1on1/{GENDER}-FACE-{ALPHA|BETA}.png`, `/assets/detail-1on1/{FeMale|Male}-Hair-Style-{1|2}.png`, `/assets/detail-1on1/{FeMale|Male}-Body-Type-{1|2}.png`
- Feature overlays under `/assets/fiture/`, i18n illustrations under `/assets/id-en/`

Path resolution is URL-encoded (filenames contain spaces and parentheses). The full asset set is live — no SVG placeholders.

System prompt composition lives in [src/lib/systemPromptBuilder.ts](sovereign-companion/src/lib/systemPromptBuilder.ts) using `describeLevel()` linguistic mapping. Auto-save is debounced 2s to `/api/companion-config`. The companion's name is injected into user-facing CTAs and headings via `{name}` interpolation with a `.fallback` key used when the name is empty (e.g. `creator.awaken`, `assembly.ready`, `encounter.begin`, `checkout.delivered.heading`).

## State Persistence Model

All four Zustand stores (`useUserStore`, `useSessionStore`, `useCompanionStore`, `useLocaleStore`) persist to **localStorage** — refresh and tab close both preserve state. Three stores (`user`, `session`, `companion`) expose an `_hasHydrated` flag flipped true by `onRehydrateStorage`. Every page-level guard and `RouteGuard` **must** wait on that flag before evaluating redirect logic; otherwise first-render default values (`userId = null`, `currentStage = 1`) trigger a bounce to `/register` or `/` during the brief pre-hydration tick.

The landing CTA is the only authorized reset surface — it clears all four browser stores. Records already in SQLite are never touched by client resets.

## Audio Pipeline (Encounter)

- Input: `getUserMedia` 16 kHz mono + `ScriptProcessorNode` (4096 buffer) → Float32 → Int16 → base64 PCM
- Transport: `session.sendRealtimeInput({ audio: { data, mimeType: "audio/pcm;rate=16000" } })`
- Output: Gemini returns base64 PCM chunks + `inputTranscription` (user) and `outputTranscription` (companion)
- Playback: AudioContext 24 kHz + AnalyserNode feeds a circular canvas visualizer (128-bin FFT)
- Transcripts saved to `Transcript` via `/api/transcripts` with `sequenceOrder`. Stop-word filter (EN + ID) runs during word cloud generation in analytics.

## Prisma Schema Snapshot

Five models: `User`, `CompanionConfig` (1:1, JSON-string fields for `features`, `hobbies`, `fullConfig`), `Transcript` (N per user, ordered by `sequenceOrder`), `SurveyResult` (1:1), `Session` (1:1 with stage timestamps + drop tracking). Notable: `CompanionConfig.userNickname` is **singular** in the schema but the API route [src/app/api/companion-config/route.ts](sovereign-companion/src/app/api/companion-config/route.ts) accepts and normalizes both `userNicknames: string[]` (current client payload) and the legacy scalar — stored as a JSON-stringified array.

## Important Notes

- This is a demo prototype — payment is simulated, delivery is theatrical (physical box at the booth)
- Data collection is real and must persist — it feeds academic research and investor presentations
- The admin dashboard is project-team facing; keep it separated from the user flow
- Do not assume Gemini model capabilities from pre-training — use the exact model ID specified
- Ship production-ready code — no pseudo-code, no partial implementations
- [sovereign-companion/AGENTS.md](sovereign-companion/AGENTS.md) mandates reading `node_modules/next/dist/docs/` before touching Next.js APIs because this version has breaking changes from pre-16 docs

## Pre-Exhibition Gotchas

- `NEXT_PUBLIC_GEMINI_API_KEY` is exposed to the browser — add rate limiting and key rotation before public demos
- `/admin` is password-gated via server-side verification against `ADMIN_PASSWORD` env. Missing env = login always fails. Still add rate-limiting or a reverse-proxy allowlist before exposing publicly.
- SQLite file lives inside the Docker image — mount a volume or swap to managed Postgres if you need data to survive redeploys
- Gemini STT accuracy depends on Indonesian accent + booth noise — test with native speakers in a noisy environment
- The landing CTA wipes browser state but not the SQLite DB; between visitors, prior browser caches won't leak but analytics will reflect every session ever completed
