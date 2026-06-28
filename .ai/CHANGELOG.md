# SmartHire - Changelog

## [Unreleased]
### Added
- Express Backend initialization and server setup on port 5001.
- Next.js 14 Frontend initialization with Tailwind CSS and custom design system.
- MongoDB data models (`Candidate`, `Conversation`, `Interview`, `JobDescription`).
- Core `AIAgent` service implementing Gemini 2.0 Flash for chat and state management.
- Beautiful UI landing page with animations.
- Interactive AI Chat Interface with typing indicators, slots, and message history.
- Recruiter Dashboard with overview statistics and interview tracking.
- System memory files (`PROJECT_CONTEXT.md`, `TASKS.md`, `BUGS.md`).

### Fixed
- Changed backend port from 5000 to 5001 to resolve macOS AirTunes conflict.
- Fixed Next.js Turbopack caching issues (`Failed to open database`) by wiping `.next`.

