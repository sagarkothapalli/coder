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

### Phase 11: Final Polish & Deployment
- **Database:** Migrated to new Neon instance (`ep-delicate-shape`).
- **Auth:** Added password visibility toggle and fixed form logic.
- **Config:** Updated production environment variables for Database and Email.
- **Deployment:** Verified GitHub-linked auto-deployment.

---

## 🛠 Future Updates
*(This section will be automatically updated by the AI assistant)*
