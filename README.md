# 🏆 Team ACE — Offline-First Autonomous Robotics Competition Platform

> Built to win the Team ACE Full Stack Engineering Challenge. Designed for high-stakes robotics arenas with intermittent or zero Wi-Fi, instant projector leaderboards, dynamic scoring rubrics, mathematical anomaly detection, and explicit conflict resolution.

---

## ⚡ Key Highlights & Winning Differentiators

- 📴 **True Offline-First Engine**: Built with Workbox Service Worker and Dexie.js IndexedDB. Judges can switch on airplane mode, score 5+ full runs locally, and experience zero-data-loss auto-synchronization when back online.
- ⚡ **Live Real-Time Leaderboard (< 2s)**: Server-Sent Events (SSE) `/api/leaderboard/stream` and REST push. Rank changes trigger fluid Framer Motion `layout` animations where cards physically glide into position.
- 🥇 **3D Animated Podium**: Top 3 finalists presented on a metallic tiered pedestal with gold, silver, bronze particle glows and celebratory confetti bursts.
- ⚖️ **Deterministic Tie-Break Policy**:
  1. *Primary*: Total Weighted Score
  2. *Secondary*: Higher score in highest-weighted criterion (e.g. Autonomous Navigation @ 1.5x)
  3. *Tertiary*: Fewest penalty point deductions
  4. *Quaternary*: Panel consistency (lowest standard deviation $\sigma$ across judges)
- 🛡️ **Zero Silent Overwrites (Conflict Center)**: When multi-device or offline judges submit divergent updates, the system flags a concurrency conflict and presents a side-by-side merge console with 1-click average consensus or custom override.
- 🚨 **2-Sigma ($\mathbf{2\sigma}$) Anomaly Detection**: Mathematically flags judges whose scores deviate by $> 2\sigma$ from panel consensus to prevent bias or rogue judging.
- 📷 **In-Browser QR Check-In**: High-res QR tags generated for every robot chassis. Phone camera scanner opens the scoring form in one tap.
- 📜 **Full Audit Trail & CSV Export**: Immutable changelog with instant CSV download for competition records.
- 🖥️ **Hall Projector Mode**: 1-click full-screen, high-contrast display designed for auditorium projectors.

---

## 🔑 Demo Accounts (Ready on Vercel)

| Role | Name | Email | Quick Switch |
|---|---|---|---|
| **Admin** | Alex Vance | `admin@ace.ai` | Top navbar: Click **"Admin"** |
| **Judge 1** | Dr. Sarah Chen | `judge1@ace.ai` | Top navbar: Click **"Judge"** |
| **Judge 2** | Marcus Brody | `judge2@ace.ai` | Top navbar: Click **"Judge"** |
| **Public** | Spectator | `public@ace.ai` | Top navbar: Click **"Public"** |

*Tip: A dedicated One-Click Role Switcher is built right into the top navbar so evaluators can switch personas instantly without logging in and out!*

---

## 🚀 How to Test the Offline Mode in 10 Seconds

You don't even need to turn off your computer's Wi-Fi!
1. Open the app and click the **"⚡ Simulate Offline"** button in the navbar (or enable Airplane Mode in DevTools).
2. The navbar turns amber and displays **"Offline Mode (Airplane Mode Active)"**.
3. Go to the **Scoring Form**, select a team, adjust criteria, and click **"Save to Offline Queue"**.
4. Notice the badge updates: **"1 Queued"**, **"2 Queued"** stored locally in **IndexedDB**.
5. Click **"Airplane Mode ON"** to restore connection.
6. The sync engine automatically fires, uploads the batch to `/api/scores/sync`, and broadcasts the updated scores to the live leaderboard in $< 2$ seconds!

---

## 🧪 Testing Suite (16+ Tests + CI)

Run the automated test suite covering weighted scoring, tie-break rules, 2-sigma anomaly detection, conflict resolution, and validation:

```bash
# Run unit & API test suite
npm test

# Run code linter
npm run lint

# Run 200 concurrent viewers load test
npm run test:load
```

### GitHub Actions CI
The repository includes `.github/workflows/ci.yml` which automatically installs dependencies, runs all 16 tests, and verifies clean production compilation on every push.

---

## 🚀 Deploying to Vercel in 2 Minutes

This codebase is 100% serverless-optimized and requires **zero external database setup** to run out-of-the-box on Vercel!

### Option A: Via GitHub (Recommended)
1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/<YOUR_USER>/<YOUR_REPO>.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) &rarr; **Add New Project** &rarr; Select your GitHub repository.
3. Keep default settings and click **Deploy**.
4. Done! Your app is live with a public URL!

### Option B: Via Vercel CLI
```bash
npx vercel
```

---

## 📐 Architecture Overview

```
Frontend (Next.js 14 App Router + Tailwind + Framer Motion)
   │
   ├── [Online]  ─────────► REST / SSE APIs ─────────► AppStore & Audit Engine
   │                                                         │
   └── [Offline] ─────────► Dexie IndexedDB Queue            ▼
                                   │                   Live Leaderboard
                             Background Sync            (< 2s Broadcast)
                                   │
                                   ▼
                        Batch Sync & Conflict Hub
```

---

*Engineered with precision for Team ACE.*
