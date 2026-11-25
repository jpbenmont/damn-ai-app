# DAMN — Gym, Discipline & Personal AI Assistant App (v1.0)

> **Status:** `v1.0` — Initial working release under active development. Future releases (`v1.1+`) will expand workout programming, offline sync, and automated AI coaching workflows.

**DAMN** is a voice-first mobile personal assistant, fitness discipline tracker, and family/squad coordination app built with **React Native (Expo SDK 52), TypeScript, Firebase, and Google Gemini AI**.

---

## Core v1 Features

* **Voice-First AI Assistant (`src/services/gemini.ts`, `wisprFlowService.ts`, `voiceService.ts`):** Natural voice commands with filler-word cleanup, conversational self-correction resolution, and concise spoken responses.
* **Gym & Discipline Tracking (`WorkoutScreen`, `SupplementsScreen`, `HydrationCard`, `StepsCard`, `DisciplineMatrix`):** Daily workout routines, supplement reminders, hydration & step tracking, and Lock-In discipline scoring.
* **Smart Escalating Reminders (`RemindersScreen`, `reminderService.ts`):** Local push notifications with heads-up warnings and interactive alerts.
* **GPS Departure Shopping Radar (`shoppingLocationService.ts`):** Location-aware reminders alerting you with household grocery/errand items when leaving home.
* **Family Circle & Squad Sync (`FamilyScreen`, `SquadScreen`, `firebase.ts`):** Shared errands, accountability tracking, and real-time Firestore synchronization.
* **Web PWA Companion:** Lightweight web companion (`index.html`, `api.php`) with a server-side PHP proxy for Gemini API requests.

---

## Security & Credential Setup

**Zero API keys or Firebase secrets are stored in this repository.** All credentials are loaded at runtime from environment variables.

### 1. Mobile App Setup (Expo / React Native)

```bash
# 1. Clone the repository & install dependencies
npm install

# 2. Create your local environment file from the template
cp .env.example .env
# Open `.env` and fill in your own GEMINI and FIREBASE keys

# 3. Verify TypeScript compiles cleanly
npm run ts:check

# 4. Start Expo development server
npm start
# Or build & run on Android device/emulator:
npm run android
```

### 2. Web PWA Companion Setup (Optional)

```bash
# Copy the browser config template and add your local Firebase keys (config.js is gitignored)
cp config.example.js config.js
# Ensure GEMINI_API_KEY is set inside `.env` for api.php
```

---

## Project Structure

```text
Damn App/
├── App.tsx                       # Root React Native application entry
├── app.json                      # Expo app manifest & native permissions
├── package.json                  # Dependencies & scripts
├── .env.example                  # Environment variable template (safe for Git)
├── config.example.js             # Web companion config template (safe for Git)
├── assets/                       # Active app icons, avatar & notification assets
├── android/                      # Native Android Gradle project
└── src/
    ├── config/config.ts          # Env-driven runtime config (EXPO_PUBLIC_*)
    ├── context/AppContext.tsx     # Global app & sync state
    ├── components/               # Reusable UI cards, dock nav & voice orb
    ├── modals/                   # AI chat, lock-in & routine editor modals
    ├── screens/                  # Dashboard, Workout, Supplements, Reminders, Family, Squad
    ├── services/                 # Gemini AI, Firebase, Wispr voice, notifications & GPS radar
    ├── theme/                    # Color palette & typography tokens
    └── types/                    # Shared TypeScript interfaces
```

---

## Roadmap

* [x] **v1.0:** Core Expo mobile app, Gemini voice assistant, workout/supplement/hydration tracking, Firebase Family & Squad sync, GPS shopping radar, and secure `.env` credential isolation.
* [ ] **v1.1:** Progressive overload workout logging, PR analytics charts, and macro tracking.
* [ ] **v1.2:** Backend proxy for mobile Gemini calls + automated CI checks.
