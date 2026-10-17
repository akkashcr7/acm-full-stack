# Team ACE Autonomous Robotics Championship — Platform Handover & Verification Guide

This guide provides everything needed to operate, demonstrate, verify, and evaluate the **Team ACE Offline-First Competition Judging Platform**.

---

## 1. Executive Summary & Live Links

- **Production Deployment:** [https://acm-full-stack.vercel.app](https://acm-full-stack.vercel.app)
- **GitHub Repository (Public):** [https://github.com/akkashcr7/acm-full-stack](https://github.com/akkashcr7/acm-full-stack)
- **Primary Mission:** Built specifically for the **Team ACE Autonomous Robotics Championship**, designed to operate reliably in noisy, high-interference arena environments where Wi-Fi drops frequently.

---

## 2. Complete Technology Stack

| Layer | Technology | Purpose & Implementation Details |
| :--- | :--- | :--- |
| **Framework** | **Next.js 14 (App Router)** | Modern React server & client components, dynamic API routes, zero-lag client transitions. |
| **Language** | **TypeScript 5 (Strict Mode)** | Full end-to-end type safety across domain models (`Team`, `ScoreSubmission`, `Criterion`, `AuditLog`). |
| **Styling & UI** | **Tailwind CSS + Glassmorphism** | Custom dark cyber-robotics design system with glowing borders, neon accents, and responsive layout. |
| **Offline Storage** | **IndexedDB (`idb` v8)** | Local browser database storing all teams, criteria, pending score submissions, and sync queues when offline. |
| **Offline Worker** | **Service Worker (`public/sw.js`)** | Caches shell assets and pages for instantaneous offline loading when network is disconnected. |
| **Real-Time Duplex** | **Server-Sent Events (SSE)** | Dynamic streaming endpoint at `/api/leaderboard/stream` pushing updates to all clients in `< 2s`. |
| **Authentication** | **Firebase Auth (`v10`)** | Live Google OAuth Popup sign-in with project `team-ace-a1c81`, auto-assigning Judge/Admin roles. |
| **Audio Intelligence** | **Web Speech API** | Built-in browser text-to-speech engine providing real-time voice announcements on leaderboard lead changes. |
| **Computer Vision / QR**| **`html5-qrcode` & `qrcode`** | Camera-based barcode scanner for field check-in and dynamic SVG badge generation for robot chassis. |
| **Data Visualization** | **Custom SVG Radar Spider Chart** | Multi-axial capability comparison chart (Navigation, Clearance, Robustness, Code Quality). |
| **Quality & Tests** | **Vitest 2.1** | 16 automated unit tests validating 2-sigma anomaly detection, weighted scoring formulas, and conflict resolution. |

---

## 3. How to Use the Platform (User Guide by Role)

### Role A: Admin (`/admin`)
1. **Sign In:** Go to [acm-full-stack.vercel.app/login](https://acm-full-stack.vercel.app/login) and sign in using **Continue with Google** or switch to the **Admin** role.
2. **Team Registration:**
   - Click the **Teams** tab in Admin Hub.
   - Enter Team Name, Robot Name, Robot Model, and Organization.
   - Click **Register Team**.
3. **Scoring Criteria Management:**
   - Click the **Criteria** tab.
   - Modify weights, maximum scores, or add specialized criteria for different robotics tracks.
4. **Conflict Resolution & Anomalies:**
   - Click the **Conflicts** tab.
   - The platform automatically detects and flags when two judges give conflicting scores or when a judge deviates by $> 2\sigma$ from the panel mean.
   - Admins can review discrepancies and resolve them with a single click.
5. **Audit Logs & Export:**
   - Click **Audit Logs** to view immutable timestamped records of every score submission and modification.
   - Click **Export CSV** to download official competition results.

---

### Role B: Judge (`/judge`)
1. **Select a Team:**
   - Choose an assigned team from the dropdown or scan their robot badge using the camera scanner.
2. **Arena HUD Match Stopwatch:**
   - Select trial duration (**3 min** or **5 min**).
   - Click **Start Run** when the robot leaves the starting gate.
   - Click **Add Penalty (-5 pts)** during the run if the robot strikes a boundary—the timer automatically logs the exact timestamp into your field notes (e.g. `[01:42] Penalty recorded`).
3. **Score the 4 Weighted Criteria:**
   - **Autonomous Navigation (0–30, wt 1.5):** Path precision and waypoint adherence.
   - **Obstacle & Hazard Clearance (0–25, wt 1.2):** Traversing rough terrain and dodging barriers.
   - **Mechanical Robustness (0–25, wt 1.0):** Chassis durability and mount stability.
   - **Algorithmic Innovation (0–20, wt 0.8):** SLAM efficiency and sensor fusion.
4. **Submit Score:**
   - Click **Submit Score**. If online, it synchronizes via SSE immediately. If offline, it saves to IndexedDB and syncs automatically when reconnected.

---

### Role C: Spectator / Audience (`/`)
1. **Live Leaderboard:** Real-time animated rankings with total weighted points, run counts, and penalties.
2. **Deep Analytics & Spider Chart:** Click on any team to view their **Multi-Dimensional Performance Radar**, breakdown across all 4 criteria, and judge comments.
3. **Projector Mode:** Click the **Projector Mode** button to display a high-contrast full-screen view suitable for large arena display screens.
4. **Voice Announcer:** Click the **Voice** button in the top bar (equipped with a 4-bar equalizer visualizer) to hear real-time spoken updates whenever the top rank changes.

---

## 4. How to Verify the Full Working of the Website (Step-by-Step Test Script)

Follow these steps in your browser to verify all core systems:

### Test 1: Real Google Authentication
- Go to `/login`.
- Click **Continue with Google**.
- Select your Google account.
- **Verification:** Your name and profile initial appear in the top-right navbar pill with persistent session storage.

### Test 2: Registering Competition Teams
- Navigate to **Admin Hub** (`/admin`) $\rightarrow$ **Teams** tab.
- Add Team 1: `Team Alpha` (Robot: `Viper-X`, Model: `Differential Drive`).
- Add Team 2: `Team Apex` (Robot: `Titan-9`, Model: `Omni Holonomic`).
- **Verification:** Both teams appear instantly in the registration table and are immediately selectable on the `/judge` scoring page.

### Test 3: Offline-First Capability & Background Sync (The Winning Requirement)
- Navigate to **Scoring Form** (`/judge`).
- Open Chrome DevTools (`F12`) $\rightarrow$ Click **Network** tab $\rightarrow$ Set throttling to **Offline** (or disconnect your Wi-Fi).
- **Verification:** The top status pill immediately switches from `ONLINE` to `OFFLINE (X PENDING)` with an alert banner.
- Select `Team Alpha` on the form, score their run, and click **Submit Score**.
- **Verification:** The submission succeeds locally, stores safely inside **IndexedDB**, and updates the pending queue counter.
- In DevTools Network tab, switch back to **Online**.
- **Verification:** The status pill instantly flashes green (`SYNCING...` $\rightarrow$ `ONLINE`), drains the local queue, and broadcasts the score to the leaderboard.

### Test 4: Multi-Judge Consensus & 2-Sigma Anomaly Detection
- Submit a score of **95 pts** for `Team Alpha` under Judge 1.
- Switch to Judge 2 and submit an extreme outlier score of **20 pts** for `Team Alpha`.
- Navigate to **Admin Hub** $\rightarrow$ **Conflicts** tab.
- **Verification:** The statistical engine flags the submission with a **2-Sigma Anomaly Warning** ($Z > 2.0$), identifying the score as an outlier for administrative review.

### Test 5: Interactive Visuals & Performance Radar
- Go to the home page (`/`).
- Click on any scored team on the leaderboard.
- **Verification:** The **Performance Radar Spider Chart** renders a high-tech polygon visual showing strengths across Navigation, Clearance, Robustness, and Innovation.
- Move your cursor across the background: notice the dynamic **46px arena grid spotlight** tracking your cursor.

---

## 5. Automated Unit Test Verification

To run the automated test suite locally:

```bash
# Execute Vitest test runner
npx vitest run
```

**Results:**
- `✓ 16/16 tests passing (100% green)`
- Validates:
  1. `calculateWeightedScore`: Correct application of multipliers ($1.5\times, 1.2\times, 1.0\times, 0.8\times$) and penalty subtractions.
  2. `detectAnomalies`: Correct identification of scores deviating more than 2 standard deviations ($\pm 2\sigma$) from the panel mean.
  3. `generateLeaderboard`: Proper tie-breaking sorting (Weighted Score $\rightarrow$ Fewest Penalties $\rightarrow$ Fast Run Time).
  4. `offline sync pipeline`: Deduplication and optimistic state transitions.
