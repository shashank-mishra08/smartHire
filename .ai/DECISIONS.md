# SmartHire - Architecture & Design Decisions

## Decision Log

### 2026-06-28: Tech Stack Selection

#### Frontend: Next.js 14+ (App Router)
**Why:** Server-side rendering for SEO, built-in API routes, React ecosystem, excellent DX with App Router. Recruiter dashboard and candidate chat both benefit from SSR.
**Alternatives considered:** Plain React (Vite) — rejected because SSR and API routes are useful for this project.

#### Backend: Node.js + Express
**Why:** Same language as frontend (JS/TS), massive ecosystem, easy Google API integration, fast development. Perfect for 1-day MVP timeline.
**Alternatives considered:** FastAPI (Python) — good but adds language switching overhead.

#### Database: MongoDB Atlas
**Why:** Flexible schema perfect for conversation logs and varying candidate data. User already has an Atlas cluster. No migration needed.
**Alternatives considered:** Supabase/Postgres — good but MongoDB's document model fits chat logs better.

#### AI/LLM: Google Gemini API
**Why:** Cost-effective, good reasoning capability, easy integration, supports function calling for tool use.
**Alternatives considered:** OpenAI GPT-4 — more expensive, Claude — similar cost.

#### UI: Tailwind CSS + shadcn/ui
**Why:** Rapid development of premium-looking UI. shadcn/ui gives beautiful, accessible components out of the box.

### 2026-06-28: Architecture Pattern
**Decision:** Monorepo with separate frontend/ and backend/ directories
**Why:** Clean separation of concerns, independent deployment possible, shared types via shared/ folder.
**Pattern:** Frontend calls backend REST API. Backend orchestrates AI agent + external services.

### 2026-06-28: AI Agent Architecture
**Decision:** Single AI agent with tool-calling (not multi-agent)
**Why:** For MVP, a single Gemini agent with tools (calendar, email, sheets) is simpler and more reliable than LangGraph multi-agent. Can evolve later.
**Tools:** Calendar, Email, Sheets, Resume Parser, Slack, Database

### 2026-06-28: Conversation Design
**Decision:** Natural AI conversation, NOT form-based
**Why:** HR specifically wants "agentic AI jo candidate se baat kare". Form would defeat the purpose. AI should feel like talking to a real recruiter.

### 2026-06-28: MongoDB Database Name
**Decision:** Using "SmartHire" database on existing Atlas cluster
**URI:** mongodb+srv://...@cluster0.og0x7.mongodb.net/SmartHire
