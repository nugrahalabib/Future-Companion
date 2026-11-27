<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/banner-dark.svg"><img src="docs/readme/banner-light.svg" width="100%" alt="Future Companion. An exhibition piece set in 2075: design an AI companion, talk to it by voice, then answer a research survey."></picture>

<p align="center"><a href="#getting-started">Getting started</a> · <a href="https://github.com/nugrahalabib">More of my work</a> · <a href="https://nugrahalabib.com">nugrahalabib.com</a></p>

## Overview

Future Companion, called The Sovereign Companion inside the app, is an interactive exhibition piece for the Tech AI Future Indonesia exhibition. It stages a marketplace in the year 2075. A visitor designs a humanoid AI companion, talks with it by voice for five minutes, orders it in a staged checkout, and then answers a research questionnaire about the experience.

The point is the questionnaire. People answer questions on voice quality, comfort, ethics, price and use cases after they have tried a companion, not after reading about one. Every choice, transcript line and stage timestamp is linked to the answers, and an admin dashboard turns each session into charts and an exportable dataset.

Nothing here is a real product or a real purchase. The portraits are pre-rendered images, the checkout is theatre, and the voice comes from Gemini Live with a persona built from the visitor's choices. Visitors see a data use notice before they register, and exports can replace names and emails with anonymous ids.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/features-dark.svg"><img src="docs/readme/features-light.svg" width="100%" alt="What Future Companion does: Registration with notice, Nine-step Creator Studio, Assembly and reveal, Five-minute voice talk, Staged checkout, Editable questionnaire, Research dashboard, Booth controls."></picture>

## Why it exists

Future Companion (The Sovereign Companion in the app) is an exhibition piece and a research instrument in one. Visitors to the Tech AI Future Indonesia exhibition design an AI companion set in the year 2075, talk with it by voice for five minutes, go through a staged purchase, and then answer a questionnaire about what they felt and think. Nugraha Labib Mujaddid designed and built it while he was a master's student at Universitas Prasetiya Mulya. It is a prototype: no product is sold, and nothing is delivered except a small starter box handed over at the booth.

Ask people about AI companions in the abstract and you get abstract answers. The piece lets visitors try one first: they shape its looks and personality, hear it answer in real time, and go through the moment of ordering it. Only then are they asked about voice quality, comfort, ethical worries, price and possible uses.

An exhibition booth also has its own constraints. Many visitors use the same machine one after another, the voice API costs money for every minute it runs, staff need to know how many people finish, and the research needs each answer tied to what the person actually did. The app handles all of that itself.

| Who | What they do with it |
| --- | --- |
| **Booth visitor** | Registers after a data use notice, designs a companion, talks with it, completes the staged checkout and fills in the questionnaire on a phone via a QR code. |
| **Booth team** | Pauses or schedules the demo, resets the machine for the next visitor, hands over the starter box, and watches live activity in the dashboard. |
| **Researcher** | Edits the questionnaire and the companion's prompt, reads transcripts, compares answers by persona and attributes, and exports the dataset as CSV or JSON, anonymized if needed. |

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/before-after-dark.svg"><img src="docs/readme/before-after-light.svg" width="100%" alt="Before and after"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/journey-dark.svg"><img src="docs/readme/journey-light.svg" width="100%" alt="How it works, step by step"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/value-dark.svg"><img src="docs/readme/value-light.svg" width="100%" alt="What it changes"></picture>

## Tour

### 1. Landing and registration

The landing page sets the scene in 2075 and has one button. That button clears everything stored in the browser, so each visitor starts clean. Registration asks for a few details, explains how the data will be used, and then lets the visitor choose how the companion will address them and what it is called.

- Data use notice shown on the registration screen, in English and Indonesian
- Age is collected as a range, profession from a list of invented 2075 jobs
- Up to three nicknames for the visitor and a name for the companion
- A password so a visitor can resume a session later

<img src="docs/readme/screens/01-landing.jpg" width="100%" alt="Landing page, in English.">

<sub>Landing page, in English.</sub>

<p><img src="docs/readme/screens/02-register-consent.jpg" width="100%" alt="The bond step of registration with the data use notice underneath (demo visitor)."></p>

<sub>The bond step of registration with the data use notice underneath (demo visitor).</sub>

### 2. Creator Studio

Nine steps shape the companion: gender, face, hair, body, outfit, skin tone, optional life modules, persona and hobbies. A preview on the right updates with each pick. There is no image generation at runtime: each combination maps to a pre-rendered portrait, and options without a finished portrait are marked coming soon.

- Three genders, each with 16 pre-rendered portraits
- Skin tone applied as a CSS filter on the portrait
- Four roles and four sliders define the persona
- Choices autosave to the server two seconds after each change

<img src="docs/readme/screens/03-creator-face.jpg" width="100%" alt="Step 2, face shape, with the live preview.">

<sub>Step 2, face shape, with the live preview.</sub>

<p><img src="docs/readme/screens/04-creator-outfit.jpg" width="49%" alt="Step 5, outfit."> <img src="docs/readme/screens/05-creator-persona.jpg" width="49%" alt="Step 8, persona: a role, quick blends and four personality sliders."></p>

<sub>Left: Step 5, outfit. · Right: Step 8, persona: a role, quick blends and four personality sliders.</sub>

### 3. Assembly and reveal

After the last step the companion is assembled in a short terminal-style sequence, then the matching portrait fades in with the companion's name.

- 6.5 second sequence, then the reveal
- Assembly time is saved as a stage timestamp

<img src="docs/readme/screens/06-assembly.jpg" width="100%" alt="Assembly sequence.">

<sub>Assembly sequence.</sub>

<p><img src="docs/readme/screens/07-reveal.jpg" width="100%" alt="Reveal of the finished companion, Ava."></p>

<sub>Reveal of the finished companion, Ava.</sub>

### 4. Voice encounter

The visitor talks with the companion for up to five minutes. The browser asks the server for a one-use token, then streams microphone audio to Gemini Live and plays the reply. The system prompt is built from the visitor's choices: role, sliders, hobbies, names and language. Both sides of the conversation are transcribed and saved in order.

- Model gemini-2.5-flash-native-audio-preview-12-2025, browser to Gemini over WebSocket
- Audio capture in an AudioWorklet and a frequency visualizer
- Three tools the companion can call: smart home, reminder and weather (demo responses)
- No screenshot here: this stage needs a paid Gemini key, which was not used for this page

### 5. Checkout and farewell

The order is theatre. The visitor scans a neuro-sigil, sees a delivery address confirm itself, authorizes a subscription and watches a 10 second countdown. When the visitor confirms the package, the booth team hands over the starter box and the farewell screen shows a QR code to the questionnaire.

- Optional Tuya scene turns the booth lights bright white on delivery
- Farewell screen returns to the start on a timer for the next visitor

<img src="docs/readme/screens/08-checkout.jpg" width="100%" alt="Staged checkout with the neuro-sigil (address blurred).">

<sub>Staged checkout with the neuro-sigil (address blurred).</sub>

<p><img src="docs/readme/screens/09-farewell.jpg" width="100%" alt="Farewell with the QR code to the questionnaire (QR and link blurred)."></p>

<sub>Farewell with the QR code to the questionnaire (QR and link blurred).</sub>

### 6. Research questionnaire

The questionnaire opens on the visitor's phone. It first identifies the visitor by the email used at the booth, or creates a guest entry, then walks through sections on expectations, the Creator Studio, the reveal, the voice conversation, ethics and society, buying intent, emotional response and recommendation.

- Likert scales, an NPS scale, single and multi choice, and open questions
- Template stored in the database and edited in the admin
- Guest visitors can answer without a booth registration

<img src="docs/readme/screens/10-questionnaire.jpg" width="100%" alt="Questionnaire, identity section.">

<sub>Questionnaire, identity section.</sub>

### 7. Research dashboard

The admin opens on totals, completion rate, average conversation length and experience score, daily activity, a stage by stage funnel and activity by hour. Insights adds NPS, purchase intent, persona and attribute charts, popular combinations and a word cloud from feedback.

- Periods of 7, 30 and 90 days
- Drop-off counts between every pair of stages
- Live activity list of the latest visitors

<img src="docs/readme/screens/11-admin-overview.jpg" width="100%" alt="Overview with daily activity (invented demo data).">

<sub>Overview with daily activity (invented demo data).</sub>

<p><img src="docs/readme/screens/12-admin-funnel.jpg" width="49%" alt="Conversion funnel and activity by hour (invented demo data)."> <img src="docs/readme/screens/15-admin-insights.jpg" width="49%" alt="Insights: NPS, purchase intent, average persona and role charts (invented demo data)."></p>

<sub>Left: Conversion funnel and activity by hour (invented demo data). · Right: Insights: NPS, purchase intent, average persona and role charts (invented demo data).</sub>

<p><img src="docs/readme/screens/16-admin-attributes.jpg" width="100%" alt="Physical attributes, age ranges and relationship status (invented demo data)."></p>

<sub>Physical attributes, age ranges and relationship status (invented demo data).</sub>

### 8. Respondents, transcripts and research views

Respondents can be filtered by companion choices, persona, status, age and completion, and opened one by one. Transcripts shows every conversation line by line. Research shows each survey question with its average and distribution, grouped by section.

- Filters for gender, role, face, hair, body, outfit, skin, age and status
- Search across all conversations
- Per-question averages and medians

<img src="docs/readme/screens/13-admin-respondents.jpg" width="100%" alt="Respondents with filters (invented demo data).">

<sub>Respondents with filters (invented demo data).</sub>

<p><img src="docs/readme/screens/14-admin-transcripts.jpg" width="49%" alt="Transcripts of a conversation (invented demo lines)."> <img src="docs/readme/screens/17-admin-research.jpg" width="49%" alt="Research view per question (invented demo data)."></p>

<sub>Left: Transcripts of a conversation (invented demo lines). · Right: Research view per question (invented demo data).</sub>

### 9. Export and survey builder

Export downloads respondents, survey answers or conversations as CSV or JSON, with filter presets and an option to replace names and emails with anonymous ids. The survey builder edits sections and questions in both languages without code.

- Anonymize option for exports
- Questions, types and answer options editable per language
- Reset to the built-in default template

<img src="docs/readme/screens/18-admin-export.jpg" width="100%" alt="Export with dataset, format and filter presets.">

<sub>Export with dataset, format and filter presets.</sub>

<p><img src="docs/readme/screens/19-admin-survey-builder.jpg" width="100%" alt="Survey form builder."></p>

<sub>Survey form builder.</sub>

### 10. Booth controls

A master switch pauses the demo, and a daily schedule limits it to booth hours. When the demo is off, visitors see a paused screen and the server refuses new voice tokens. Other admin tabs edit the system prompt, the conversation suggestions, the welcome audio made with Gemini TTS, and the Tuya devices used for booth lighting.

- Manual pause and opening hours
- System prompt editor with defaults and overrides
- Welcome page that plays a chosen audio clip

<img src="docs/readme/screens/20-admin-demo-switch.jpg" width="100%" alt="Demo mode control with the master switch and schedule.">

<sub>Demo mode control with the master switch and schedule.</sub>

## How it is built

One Next.js 16 App Router app in sovereign-companion/. Each stage is a page guarded by a RouteGuard that compares the stage stored in the browser with the stage the page needs. Visitor state lives in Zustand stores persisted to localStorage, so a refresh does not lose progress, and every stage also writes to the server.

API routes use Prisma with SQLite. Visitor routes save users, companion configs, session timestamps, transcripts and survey answers; admin routes under /api/admin check an x-admin-password header against the ADMIN_PASSWORD environment variable.

Voice runs from the browser straight to Gemini Live. The server route /api/gemini-token builds the full live-session config (system prompt, voice, language, transcription) and mints a one-use ephemeral token with that config locked in, so the browser never holds the API key and cannot change the persona.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/architecture-dark.svg"><img src="docs/readme/architecture-light.svg" width="100%" alt="How Future Companion is built."></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/data-model-dark.svg"><img src="docs/readme/data-model-light.svg" width="100%" alt="Data model"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/flow-1-dark.svg"><img src="docs/readme/flow-1-light.svg" width="100%" alt="Starting a voice session"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/flow-2-dark.svg"><img src="docs/readme/flow-2-light.svg" width="100%" alt="Moving through the stages"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/flow-3-dark.svg"><img src="docs/readme/flow-3-light.svg" width="100%" alt="Saving the questionnaire"></picture>

### Security

- The Gemini API key is used only on the server; browsers receive a one-use token that expires.
- Admin API routes require the x-admin-password header to match ADMIN_PASSWORD; with no ADMIN_PASSWORD set, admin access is refused.
- Visitor passwords are hashed with scrypt and a random salt and compared with timingSafeEqual.
- Voice, session and config routes return HTTP 503 while the demo is paused or outside booth hours.
- The database file, .env files and respondent data are ignored by git.
- Known limits: the admin password is a plain comparison kept in sessionStorage and there is no login rate limiting, which suits a staffed booth on a closed network more than the open internet.

### Decisions

| Decision | Why |
| --- | --- |
| Pre-rendered portraits | No image generation at the booth: picks map to finished images, so the reveal is instant and always looks right. |
| Browser-direct voice with ephemeral tokens | Audio goes straight from the browser to Gemini for low latency, while the API key and the persona stay locked on the server. |
| SQLite in a mounted folder | One machine runs one booth. A single file is simple to back up and move, and it survives container rebuilds. |
| Survey answers kept twice | Known questions fill typed columns for the charts, and the full payload is kept raw so questions added later in the builder are not lost. |
| Demo switch on the server | Pausing in the admin stops new voice tokens at the source, so cost cannot run outside booth hours even if a tab is left open. |
| Everything in two languages | Visitors choose English or Indonesian, and the survey keeps both versions of every question. |

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/stack-dark.svg"><img src="docs/readme/stack-light.svg" width="100%" alt="Future Companion stack."></picture>

### Highlights

- The Gemini API key stays on the server: the browser gets a one-use token with the persona, voice and transcription settings locked into it.
- When the booth is paused or closed, the token, session and config routes answer HTTP 503, so nobody can run up voice cost after hours.
- Each stage writes a timestamp to one session row, from registration to the completed survey, which feeds the funnel chart and drop-off counts.
- Visitor passwords are hashed with scrypt and checked in constant time, and age is stored as a range rather than an exact age.
- The start button clears all browser state so the next visitor at the booth begins clean, while saved rows stay in the database.

## Getting started

All code lives in `sovereign-companion/`. Everything except the voice conversation and the welcome
audio generator works without any paid key: landing, registration, Creator Studio, assembly,
checkout, questionnaire and the whole admin dashboard.

### Requirements

- Node.js 22 (the Docker image uses `node:22-alpine`) and npm
- A Gemini API key only for the voice encounter and the TTS studio
- Tuya Cloud credentials only if you want the booth lighting scenes (entered in the admin, stored in the database)

### Run it locally

```bash
git clone https://github.com/nugrahalabib/Future-Companion.git
cd Future-Companion/sovereign-companion
npm install
```

Create `sovereign-companion/.env` (there is no `.env.example` in the repo):

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="choose-a-long-password"
# Optional, needed only for the voice encounter and the TTS studio:
GEMINI_API_KEY=""
```

Then create the Prisma client and the database, and start the app:

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open http://localhost:2970. The admin dashboard is at http://localhost:2970/admin and asks for
`ADMIN_PASSWORD`. If `ADMIN_PASSWORD` is not set, the admin stays locked.

`npx prisma generate` is required: without it every API route fails with "@prisma/client did not
initialize yet". The SQLite file is created at `sovereign-companion/prisma/dev.db` and is ignored by git.

### Environment variables

| Name | Needed for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | everything | SQLite path, relative to `prisma/`. |
| `ADMIN_PASSWORD` | the admin dashboard | Sent by the dashboard as the `x-admin-password` header. |
| `GEMINI_API_KEY` | voice encounter, TTS studio | Used only on the server to mint one-use tokens. |

`docker-compose.yml` also passes `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_GEMINI_API_KEY`, but no
source file reads them. Do not put a Gemini key in a `NEXT_PUBLIC_` variable.

### Scripts (in `sovereign-companion/`)

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 2970 |
| `npm run build` | Production build (standalone output) |
| `npm run start` | Serve the build on port 2970 |
| `npm run start:prod` | Same, bound to 0.0.0.0 |
| `npm run lint` | ESLint |

There are no automated tests yet.

### Docker

```bash
cd sovereign-companion
docker compose up --build
```

Put `DATABASE_URL`, `ADMIN_PASSWORD` and `GEMINI_API_KEY` in `sovereign-companion/.env` first; Compose
reads them from there. The entrypoint runs `prisma migrate deploy`, then starts the server on port
2970. `./prisma` is mounted into the container, so the database survives rebuilds. In production,
put a reverse proxy with HTTPS in front and bind the port to localhost only.

### Research data and consent

This app records personal data and conversations of real people: name or nickname, email, age range,
profession, relationship status, companion choices, the full voice transcript and survey answers.
If you run it with visitors:

- Keep the data use notice on the registration screen, and tell visitors in person that the
  conversation is recorded and transcribed.
- Get the approval your institution requires for research with human participants before you
  collect data for publication, and follow Indonesia's personal data protection law (UU PDP) or
  the rules where you run it.
- Use the anonymize option when you export, and remember it replaces names and emails only:
  transcripts and open answers can still contain personal details.
- Keep `prisma/dev.db` off shared drives and out of git, and delete it when the study ends.
- Only adults should take part: some persona options and prompts are written for adult visitors.

### What was run for this page

On 26 Nov 2026 a copy of `sovereign-companion/` in a temporary folder was run with `npm ci`,
`npx prisma migrate deploy`, `npx prisma generate` and `next dev` on a local port, with a locally
generated `ADMIN_PASSWORD` and no Gemini key. One demo visitor (`example.com` email) went through
registration, Creator Studio, assembly and checkout in the browser. The voice stage was skipped
because it needs a paid key, so its screen is not shown. The admin charts use 24 invented respondents
written straight into the local SQLite file (names marked "(demo)", `example.com` emails, invented
answers and transcript lines). They are not exhibition data.

### Corrections to the earlier README

- There is no `.env.example`; create `.env` by hand as above.
- `NEXT_PUBLIC_GEMINI_API_KEY` is not needed: the browser gets a one-use token from `/api/gemini-token`.
- `npx prisma generate` must be run before the first start.
- The schema has 12 models, not 6, and the Creator Studio has nine steps (an outfit step was added).
- Inside the app the setting is the year 2075 (page title, footer, prompt, profession list).
- The project folder is `sovereign-companion/`, not a root `Prototype-Future-AI/` folder.

### Project structure

```text
sovereign-companion/
  prisma/                schema.prisma (SQLite, 12 models) and migrations
  public/docs/readme/         pre-rendered portraits per gender, thumbnails, flags
  public/audio-worklets/ microphone recorder worklet
  src/app/               stages: page (landing), register, creator, assembly, encounter, checkout,
                         farewell, questionnaire, welcome; admin/* dashboard tabs
  src/app/api/           visitor routes (users, companion-config, sessions, transcripts, survey,
                         gemini-token, settings) and admin/* routes
  src/components/        creator steps, assembly, encounter, checkout, questionnaire, admin panels
  src/hooks/             useGeminiLive, useAudioRecorder, useAudioPlayer
  src/lib/               system prompt builder, survey template, analytics, demo mode, i18n, tuya
  src/stores/            Zustand stores persisted to localStorage
  Dockerfile, docker-compose.yml, docker-entrypoint.sh
```

The root also holds `BRIEF.md`, `CLAUDE.md` and `PROJECT-DEEP-DIVE.md`, the planning notes written
while the piece was built.

### License

MIT, see `LICENSE` (Copyright (c) 2026 Nugraha Labib Mujaddid). The portraits in `public/docs/readme/`
are AI-generated images; check the terms of the generator before reusing them elsewhere.

---

<sub>Made by [Nugraha Labib Mujaddid](https://github.com/nugrahalabib) · [nugrahalabib.com](https://nugrahalabib.com) · [nugrahalabib@gmail.com](mailto:nugrahalabib@gmail.com)</sub>
