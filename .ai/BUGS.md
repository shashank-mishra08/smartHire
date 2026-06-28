# SmartHire - Bug Tracker

## Active Bugs
<!-- No bugs yet - project is in setup phase -->

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
