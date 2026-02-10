# Attendance Tracker - Development Reference

This file documents the development progress, architectural decisions, and features implemented for the Attendance Tracker project.

## Project Overview
A full-stack attendance tracking application offering distinct views for Students and Coordinators.
- **URL:** https://chic-choux-ccbf20h.netlify.app
- **Tech Stack:** React (Frontend), Netlify Functions (Backend), PostgreSQL (Prisma ORM).

---

## 📅 Progress Log

### Phase 1: Foundation & Backend Migration
- **Problem:** The original project used a local Express server incompatible with Netlify's serverless architecture.
- **Action:** Migrated the backend to **Netlify Functions** (`netlify/functions/api.js`).
- **Database:** Switched from local storage/local DB to **PostgreSQL** (via Neon/Render) managed by Prisma.
- **Cleanup:** Deleted the obsolete `server/` directory.

### Phase 2: Core Attendance Logic
- **Problem:** The tracking logic was counter-intuitive (Attended didn't increment Total).
- **Action:** 
    - Updated `Subject.js` logic:
        - **Present:** +1 Attended, +1 Total.
        - **Absent:** +0 Attended, +1 Total.
        - **Canceled:** +0 Attended, +0 Total (Effective Total remains same).
    - Updated `AddSubjectForm.js` to allow creating subjects with 0 initial classes.

### Phase 3: Role-Based Architecture (Student vs. Coordinator)
- **Feature:** Added distinct roles.
- **Database:** Added `rollNumber`, `section`, and `role` fields to the `User` model.
- **Logic:**
    - **Students:** Must provide a unique Roll Number. Section is auto-calculated (1-60 = Sec A, etc.).
    - **Coordinators:** Have access to a dashboard to view student stats.

### Phase 4: Security (Peer Approval System)
- **Problem:** Anyone could register as a Coordinator.
- **Solution:** Implemented a "Gatekeeper" system.
    - **Logic:** If an admin exists, new admin registrations default to `PENDING`.
    - **Restriction:** `PENDING` users cannot log in.
    - **UI:** Existing admins see an "Access Requests" tab to Approve/Deny new admins.

### Phase 5: UI/UX Redesign
- **Theme:** Switched from "Cyber/Neon" to a **Professional SaaS** theme (Whites, Blues, Data Tables).
- **Coordinator Dashboard:**
    - Replaced grid view with a **Data Table**.
    - Added **Detailed Student Modal**: Clicking a student shows their attendance breakdown per subject.
- **Student Dashboard:**
    - Replaced text stats with sleek **Progress Bars**.
    - Added **Smart Recommendations**: "Attend next X classes to reach 75%".

### Phase 6: Deployment
- **Database:** Reset all data (truncated tables) while preserving the Super Admin (`mika`).
- **Deploy:** Deployed production build to Netlify.

### Phase 7: Enhanced Edit Features
- **Feature:** Upgraded the "Edit Subject" functionality and Dashboard UX.
- **Problem:** Students needed easier ways to fix mistakes and manage subjects.
- **Action:** 
    - **Quick Fix:** Added a direct **"Absent -"** button (Red) to the dashboard for instant undo.
    - **Reordering:** Moved the "Edit" button to the end of the row for better visual grouping.
    - **Deep Edit:** Updated `Subject.js` to allow editing of:
        - **Subject Name**
        - **Attended Classes**
        - **Canceled Classes**
        - *(Note: "Absent" editing is handled via Dashboard buttons to simplify the form)*
    - **Reset Option:** Added a **"Reset Stats"** button inside the edit menu to clear all data for a subject while keeping the name.
    - **Logic:** The "Total Classes" is automatically recalculated as `Attended + Absent + Canceled`.

### Phase 8: Mobile Responsiveness
- **Problem:** The interface was optimized for desktop, causing layout issues (cramped buttons, horizontal scrolling) on mobile devices.
- **Action:**
    - **Adaptive Layout:** Added CSS media queries for tablets (`max-width: 768px`) and mobile (`max-width: 480px`).
    - **Touch Targets:** Increased button sizes and padding for easier tapping.
    - **Grid System:** Subject cards now stack vertically on mobile (1 column) instead of grid.
    - **Flex Buttons:** Action buttons now wrap and fill the available width, creating a cleaner 2x2 or stacked layout on small screens.

### Phase 9: Google Account Linking (Soft Migration)
- **Goal:** Transition users from password-based auth to Google Auth.
- **Feature:** Added a "Link Google Account" banner for existing users.
- **Implementation:**
    - **Backend:** Added `/api/users/link-google` endpoint using `google-auth-library` to verify ID Tokens and update the user's email.
    - **Frontend:**
        - Integrated **Google Identity Services** script.
        - Created `GoogleLinkBanner` component that renders the "Sign in with Google" button.
        - The banner appears only for users who haven't linked an email yet.
    - **Security:** Tokens are verified server-side to prevent spoofing.

### Phase 10: Email Integration (Nodemailer)
- **Goal:** Replace simulated console logs with actual email delivery for password resets.
- **Implementation:**
    - **Library:** Installed `nodemailer`.
    - **Config:** Configured Gmail SMTP using `EMAIL_USER` and `EMAIL_PASS` (App Password) environment variables.
    - **Logic:** Updated `/api/users/forgot-password` to send an HTML email containing the OTP code.
    - **Fallback:** If env vars are missing, it gracefully falls back to console logging the OTP for development.

### Phase 11: Deployment Optimization & Fixes
- **Data Migration:** Successfully migrated all user and subject data from the old Neon database (`ep-lively-resonance`) to the new production instance (`ep-delicate-shape`).
- **Build Optimization:** Added `postinstall: prisma generate` to `package.json` to ensure the Prisma client is correctly prepared for the Netlify/AWS Lambda environment.
- **UI/UX Fixes:**
    - Added **Password Visibility Toggle** (eye icon) to Login, Register, and Forgot Password pages.
    - Fixed a critical bug in `LoginPage.js` where the authentication token was not being saved to `localStorage`, causing the app to hang on "Loading subjects...".
- **Environment:** Updated Netlify production environment variables (`DATABASE_URL`, `EMAIL_USER`, `EMAIL_PASS`) via CLI.
- **Deployment:** Successfully switched to GitHub-triggered CI/CD pipeline.

### Phase 12: Data Recovery & System Hardening
- **Disaster Recovery:** Successfully retrieved lost user data (including `Kalyan`, `Varshit`, `Sanjay`) from an old Render database and performed a "Clean Sync" to Neon, restoring exact attendance counts for all users.
- **Security Logic:** 
    - Added `isEmailVerified` to the Prisma schema to track user verification status.
    - Updated backend to require and track OTP verification for password resets and email linking.
    - Implemented a persistent "Security Update" notice for unverified accounts.
- **CI/CD Stabilization:**
    - Resolved `npm ERESOLVE` conflicts using `.npmrc` with `legacy-peer-deps`.
    - Fixed CI build failures by resolving ESLint warnings (unused variables, hooks dependencies).
    - Optimized Prisma client generation by moving it to a `postinstall` script.

### Phase 13: Liquid Glass Redesign & Theming
- **Goal:** Modernize the application interface with a "Liquid Glass" (glassmorphism) aesthetic and provide support for Light/Dark modes.
- **Action:**
    - **Visual Overhaul:** 
        - Implemented **Glassmorphism**: Panels now use `backdrop-filter: blur(16px)` and translucent backgrounds.
        - **Animated Background:** Added a dynamic, shifting gradient background for a "liquid" feel.
        - **Liquid Buttons:** Replaced standard square buttons with pill-shaped gradients that "bulge" on hover.
    - **Dark/Light Mode:**
        - Integrated a theme toggle in the main navigation.
        - Developed a CSS variable system (`:root` vs `[data-theme='dark']`) to handle colors, shadows, and text transitions.
        - Ensured accessibility by adjusting text contrast for both modes (White text for dark, Black/Deep gray for light).
    - **Enhanced Buttons:**
        - **Present:** Fresh green gradient.
        - **Absent:** Red gradient.
        - **Absent - (Remove Absent):** Styled as a "Soft Red" glass button (as requested) for a cleaner, more usable look.
        - **Canceled:** Yellow/Orange gradient.
    - **Usability:** The UI now feels more premium, mature, and easier on the eyes in low-light environments.

### Phase 14: Productivity Suite & Security Hardening
- **Feature:** Added a "Productivity Suite" to help students manage their academic life beyond just attendance.
- **Design Evolution:**
    - **Supercar HUD (Mission Control):**
        - Implemented a high-fidelity "Racing Track" progress bar in the Todo List.
        - Features a "Velocity" readout and a dynamic cursor that advances along the track.
        - **Cockpit Input:** A consolidated input group that feels like a dashboard instrument.
    - **Cube Grid Layout (CGPA):**
        - Semester inputs are styled as floating "Glass Cubes" that light up when active.
        - **Interactive Typography:** Grades scale and change color (Green/Yellow/Red) based on performance.
    - **Liquid Glass 2.0:**
        - **Dynamic Mesh Background:** A moving "blob" animation (`.liquid-bg`) adds depth and life to the background.
        - **Smart Theming:** CSS variables (`--mesh-1`, `--glass-bg`) automatically adapt to Light/Dark modes for optimal contrast.
- **Components:**
    - **CGPA Calculator:** 
        - Client-side tool with a "Semester Log" (Cube Layout).
        - Calculates Cumulative GPA based on 8 semesters of SGPA inputs.
    - **Mission Control (Todo List):**
        - Gamified task manager with "Supercar" theming.
        - **Priorities:** "Eco" (Low), "Sport" (Medium), "Nitro" (High).
        - **Optimistic UI:** Instant visual updates before server confirmation for a snappy feel.
- **Backend Security:**
    - **Session Management:** Implemented **Refresh Tokens** stored in the database.
    - **Endpoint:** Added `/api/users/refresh` to issue new short-lived Access Tokens (15m) without re-login.
    - **Logout:** Securely invalidates refresh tokens on server side.

### Phase 15: Furina Web Sync & Role Simplification
- **Goal:** Align the Web App with the "Furina" Android experience and the "Student-Only" philosophy.
- **Role Evolution:**
    - **Removed Coordinator Role:** Deleted all coordinator-specific routes, dashboards, and registration options. The app is now strictly for Students.
    - **Branding:** Updated Login screen to "Track Yourself / OR YOU SUCK" for a bolder, motivating personality.
- **Backend Hardening:**
    - **OTP Security:** Refactored password reset and email verification to use **Bcrypt Hashing** for OTPs (no plain-text OTPs in DB).
    - **Data Integrity:** Implemented **Input Clamping** to prevent negative attendance/canceled counts.
- **Cloud Intelligence:**
    - **CGPA Sync:** Updated the CGPA Calculator to automatically fetch and save data to the backend (`/api/cgpa`), ensuring cross-device consistency.
    - **Mission Intelligence (Dashboard):** 
        - Redesigned the Stats view into a "Intelligence" dashboard.
        - Integrated **History Logs**: Every "Present", "Absent", "Undo", or "Canceled" action is now logged to the backend (`/api/history`).
        - Added **Activity Trends**: Visualized the last 10 days of attendance activity using a Line Chart.
- **UX Refinements:**
    - Simplified registration by removing default subjects; new users now start with a clean "Cockpit".
    - Unified the "Liquid Glass" aesthetic across all new components.

---

## 🛠 Future Updates
*(This section will be automatically updated by the AI assistant)*
