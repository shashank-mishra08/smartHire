# SmartHire - Architecture & Design Decisions

## Decision Log

### 2026-06-28: Tech Stack Selection

#### Frontend: Next.js 14+ (App Router)
**Why:** Server-side rendering for SEO, built-in API routes, React ecosystem, excellent DX with App Router. Recruiter dashboard and candidate chat both benefit from SSR.
**Alternatives considered:** Plain React (Vite) — rejected because SSR and API routes are useful for this project.

#### Backend: Node.js + Express
**Why:** Same language as frontend (JS/TS), massive ecosystem, easy Google API integration, fast development. Perfect for 1-day MVP timeline.
**Alternatives considered:** FastAPI (Python) — good but adds language switching overhead.

#### AI/LLM: Google Gemini API
**Why:** Cost-effective, good reasoning capability, easy integration, supports function calling for tool use.
**Alternatives considered:** OpenAI GPT-4 — more expensive, Claude — similar cost.

#### UI: Tailwind CSS + Custom Design System
**Why:** Rapid development of premium-looking UI. Custom CSS variables for consistent theming.

### 2026-06-28: Architecture Pattern
**Decision:** Monorepo with separate frontend/ and backend/ directories
**Why:** Clean separation of concerns, independent deployment possible, shared types via shared/ folder.
**Pattern:** Frontend calls backend REST API. Backend orchestrates AI agent + external services.

### 2026-06-28: AI Agent Architecture
**Decision:** Single AI agent with tool-calling (not multi-agent)
**Why:** For MVP, a single Gemini agent with tools (calendar, email, sheets) is simpler and more reliable than LangGraph multi-agent. Can evolve later.
**Tools:** Calendar, Email, Sheets, Resume Parser, Slack, Database

### 2026-06-28: Conversation Design
**Decision:** Hybrid RAG Lite approach (State Machine + Gemini Analyzer)
**Why:** Originally, a pure state machine with hardcoded strings was used for strict ordering (Name -> Role -> Email). However, this failed if a user asked a general question or made a typo. Giving full control to LLM risks losing the structured flow. The Hybrid approach passes user input through a `RAG_SYSTEM_PROMPT` in Gemini to extract data *or* answer questions, while the strict State Machine continues to govern the actual stages.

### 2026-06-28: Database — Firebase Firestore over MongoDB Atlas
**Decision:** Migrated from MongoDB Atlas to Firebase Firestore
**Why:** MongoDB Atlas cluster was consistently failing with `ENOTFOUND` and `buffering timed out` errors. Firebase Firestore provides reliable, serverless, auto-scaling document storage with no connection pool management. Service account auth is simpler than connection strings.
**Migration approach:** Created Mongoose-compatible wrapper classes (static `find`, `findOne`, `countDocuments`; instance `save()`) so existing service code works without changes.

### 2026-06-28: Authentication — JWT Cookies over Session-Based Auth
**Decision:** Google OAuth login → JWT stored in httpOnly cookie
**Why:**
- Stateless: No server-side session store needed (no Redis/Memcached).
- Secure: httpOnly cookies can't be accessed by client-side JavaScript (XSS-safe).
- Simple: Single middleware (`requireAuth`) checks JWT on all protected routes.
- Existing OAuth: Already had Google OAuth for Calendar — extended to also serve as login.
**Alternatives considered:**
- NextAuth.js — adds complexity, separate auth flow from Calendar OAuth.
- Session-based — requires server-side storage.
- LocalStorage tokens — vulnerable to XSS.
