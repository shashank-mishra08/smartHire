# SmartHire - Bug Tracker

## Active Bugs
<!-- No active bugs -->

## Fixed Bugs

### BUG-001: Port 5000 Conflict with AirTunes (macOS)
**Description:** The backend API failed to start correctly because macOS's AirPlay Receiver (AirTunes) occupies port 5000.
**Current Status:** Fixed
**Possible Cause:** Default macOS settings listen on port 5000.
**Solution Tried:** Changed the backend and frontend configurations to use port 5001 instead.
**Current Fix:** Updated `.env` and `frontend/.env.local` to use port 5001. Restarted both servers.
**Date Found:** 2026-06-28
**Date Fixed:** 2026-06-28

### BUG-002: Next.js Turbopack Cache Issue
**Description:** `[Error: Failed to open database ... invalid digit found in string]` when running `npm run dev` in the frontend.
**Current Status:** Fixed
**Possible Cause:** Corrupted `.next` cache directory (possibly due to abrupt exit or Turbopack bug).
**Solution Tried:** Deleted `.next` directory and restarted.
**Current Fix:** Cleared `.next` folder (`rm -rf .next`).
**Date Found:** 2026-06-28
**Date Fixed:** 2026-06-28

### BUG-003: Dashboard Accessible Without Authentication (CRITICAL)
**Description:** The recruiter dashboard (`/dashboard`) and all dashboard API endpoints (`/api/dashboard/*`) were completely public. Any user could view interview data, candidate details, and update interview statuses without signing in. The home page had a direct "Recruiter Dashboard" link accessible to everyone.
**Current Status:** Fixed
**Possible Cause:** No authentication system was implemented — the MVP was built without auth.
**Solution Tried:** Implemented Google OAuth → JWT cookie-based authentication.
**Current Fix:**
  - Created `authMiddleware.ts` with JWT verification (`requireAuth`).
  - Applied `requireAuth` to all `/api/dashboard/*` routes — returns `401` without valid token.
  - Dashboard page now checks `/api/auth/me` on mount and redirects to `/login` if unauthenticated.
  - Created a dedicated `/login` page with "Sign in with Google" button.
  - Home page changed "Recruiter Dashboard" → "Recruiter Login" linking to `/login`.
  - Logout clears the JWT cookie and redirects to `/login`.
**Date Found:** 2026-06-28
**Date Fixed:** 2026-06-28

---

### Bug Template
```
### BUG-XXX: [Title]
**Description:** What's happening
**Current Status:** Open / Investigating / Fixed
**Possible Cause:** Why it might be happening
**Solution Tried:** What was attempted
**Current Fix:** What actually fixed it
**Date Found:** YYYY-MM-DD
**Date Fixed:** YYYY-MM-DD
```
