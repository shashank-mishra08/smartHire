# SmartHire - Changelog

## [Unreleased]
### Added
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
- Database: MongoDB Atlas → Firebase Firestore (service-account based auth).
- Home page: "Recruiter Dashboard" → "Recruiter Login" button pointing to `/login`.
- All dashboard API calls now include `credentials: 'include'` for cookie auth.
- Backend `server.ts`: Added `cookie-parser`, CORS `credentials: true`.

### Fixed
- Changed backend port from 5000 to 5001 to resolve macOS AirTunes conflict.
- Fixed Next.js Turbopack caching issues (`Failed to open database`) by wiping `.next`.
- **CRITICAL:** Fixed dashboard being accessible without authentication (BUG-003).

### Security
- Dashboard routes return `401 Unauthorized` for unauthenticated API requests.
- JWT tokens are stored in httpOnly cookies (not accessible from JavaScript).
- Service account JSON excluded from git via `.gitignore`.
