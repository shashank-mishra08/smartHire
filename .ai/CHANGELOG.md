# SmartHire - Changelog

## [Unreleased]
### Added
- **Hybrid RAG Lite AI System:** Refactored the rigid state machine to use Gemini 1.5 Flash for flexible JSON-based parsing of user inputs.
- `RAG_SYSTEM_PROMPT` to allow the bot to answer general questions using a Job Description context without breaking the flow.
- Fallback parsing in `understandDate` (manual day-of-week parsing) in case the Gemini API is fully unavailable.
- Express Backend initialization and server setup on port 5001.
- Next.js 14 Frontend initialization with Tailwind CSS and custom design system.
- Core `AIAgent` service implementing Gemini 2.0 Flash for chat and state management.
- Beautiful UI landing page with animations.
- Interactive AI Chat Interface with typing indicators, slots, and message history.
- Recruiter Dashboard with overview statistics and interview tracking.
- System memory files (`PROJECT_CONTEXT.md`, `TASKS.md`, `BUGS.md`).
- Google Calendar OAuth integration — recruiter availability check, free slot finder.
- Google Meet auto-link generation via Calendar API.
- Interview scheduling through AI conversation flow.
- Email service with beautiful HTML templates (candidate + recruiter notifications).
- Firebase Firestore integration — migrated all data models from MongoDB Atlas.
- Google OAuth recruiter authentication with JWT cookie sessions.
- Auth middleware (`requireAuth`) protecting all dashboard API routes.
- Login page (`/login`) with premium glassmorphism design and Google Sign-In.
- Auth guard on dashboard — redirects unauthenticated users to `/login`.
- Logout button in dashboard sidebar.
- Recruiter email display in sidebar.

### Changed
- **AI Model Upgrade:** Switched `AIAgent` from `gemini-1.5-flash` to `gemini-2.5-flash` due to the older models being deprecated/unavailable for this API key, while 2.0 still hits strict limits.
- Database: MongoDB Atlas → Firebase Firestore (service-account based auth).
- Home page: "Recruiter Dashboard" → "Recruiter Login" button pointing to `/login`.
- All dashboard API calls now include `credentials: 'include'` for cookie auth.
- Backend `server.ts`: Added `cookie-parser`, CORS `credentials: true`.

### Fixed
- Fixed UI scroll bouncing out of bounds in chat window by adding `overflow: hidden` to root body and changing scroll behavior in `chat/page.tsx`.
- Safely handling `429 Too Many Requests` limit errors from Gemini API instead of crashing.
- Changed backend port from 5000 to 5001 to resolve macOS AirTunes conflict.
- Fixed Next.js Turbopack caching issues (`Failed to open database`) by wiping `.next`.
- **CRITICAL:** Fixed dashboard being accessible without authentication (BUG-003).

### Security
- Dashboard routes return `401 Unauthorized` for unauthenticated API requests.
- JWT tokens are stored in httpOnly cookies (not accessible from JavaScript).
- Service account JSON excluded from git via `.gitignore`.
