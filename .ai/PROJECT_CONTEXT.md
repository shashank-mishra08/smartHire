# SmartHire - AI Interview Scheduling Agent

## Project Name
SmartHire

## Project Goal
Build an end-to-end Agentic AI system that automates interview scheduling through natural AI conversation with candidates. The system collects candidate details conversationally, checks recruiter calendar availability, schedules interviews, sends notifications, and maintains records — all without manual intervention.

## Current Objective
Security hardening & next-phase features (Notifications, Resume matching)

## Overall Architecture
```
SmartHire/
├── frontend/          # Next.js (React) - Candidate chat + Recruiter dashboard
├── backend/           # Node.js + Express - API server, AI agent, integrations
├── shared/            # Shared types, constants, utilities
├── .ai/               # AI memory system
└── docs/              # Documentation
```

### System Architecture
```
Candidate (Chat UI) → Backend API → AI Agent (Gemini 2.0 Flash)
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
              Google Calendar    Gmail/Email         Firestore
              (Availability)    (Notifications)     (Storage)
                    │                                   │
              Google Meet                            JWT Auth
              (Link Gen)                          (Recruiter Login)
```

## Tech Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14+ (App Router) | SSR, API routes, modern React |
| UI | Tailwind CSS + Custom Design System | Rapid premium UI development |
| Backend | Node.js + Express | Fast API development, JS ecosystem |
| AI/LLM | Google Gemini 2.0 Flash | Cost-effective, good reasoning |
| Database | Firebase Firestore | Flexible schema, reliable cloud hosting |
| Calendar | Google Calendar API | Most common, OAuth support |
| Email | Nodemailer (SMTP) | Direct integration |
| Video | Google Meet | Auto link generation via Calendar |
| Auth | Google OAuth + JWT Cookies | Secure recruiter login |

## APIs Used
- Google Calendar API (scheduling, availability)
- Gmail API / SMTP (email notifications)
- Google Meet (via Calendar API - auto link)
- Gemini API (AI conversation)
- Firebase Admin SDK (Firestore database)

## Database Schema (Firebase Firestore)
### Collections:
1. **candidates** - name, email, phone, role, resumeUrl, resumeSummary, scores, createdAt
2. **interviews** - candidateId, recruiterId, date, time, status, meetLink, calendarEventId
3. **conversations** - sessionId, messages[], context, status
4. **settings** - recruiterEmail, googleCalendarConnected, googleTokens
5. **jobDescriptions** - title, description, skills[], department

## Environment Variables
```
# AI
GEMINI_API_KEY=

# Google APIs
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback
GOOGLE_RECRUITER_EMAIL=

# JWT Auth
JWT_SECRET=

# App
FRONTEND_URL=http://localhost:3000

# SMTP (for emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

## Current Progress
- [x] Project scaffolding
- [x] Architecture design
- [x] Backend API + Firebase Firestore setup
- [x] AI Chatbot conversation flow (Gemini 2.0 Flash)
- [x] Premium Frontend UI (Chat + Dashboard)
- [x] Google Calendar OAuth integration
- [x] Free slot finder + Interview scheduling
- [x] Google Meet auto link generation
- [x] Recruiter Dashboard (stats, interview list, status updates)
- [x] Google OAuth recruiter authentication (JWT cookies)
- [x] Dashboard route protection (auth guard)
- [x] Login page (premium design)

## Completed Features
1. **AI Conversation Chatbot**: Built with Gemini 2.0 Flash, state machine handling data collection.
2. **Premium UI**: Next.js App Router, Tailwind CSS, Glassmorphism, animations.
3. **Database Integration**: Firebase Firestore models for Candidate, Interview, Conversation, Settings.
4. **Recruiter Dashboard**: Layout, analytics stats, recent interviews list, status updates.
5. **Google Calendar**: OAuth connection, availability check, event creation, Meet links.
6. **Authentication**: Google OAuth login → JWT cookie → protected dashboard routes.

## Pending Features
1. Email Notifications (candidate + recruiter confirmation)
2. Resume Upload & Storage
3. Resume AI Summary
4. JD Matching & Scoring
5. Auto Question Generation
6. Reschedule/Cancel Flow (Calendar sync)
7. Interview Reminders
8. Google Sheets Logging
9. Slack Notifications

## Known Issues
1. Google OAuth test user needs to be manually added in GCP Console (Testing mode).

## Future Improvements
- WhatsApp/SMS notifications via Twilio
- Microsoft Outlook Calendar support
- Video interview recording & analysis
- Multi-language support
- Bulk scheduling
- Interview feedback collection

---

## Current Status

**What we were doing:** Upgraded the AI chatbot from a rigid state machine to a **Hybrid RAG Lite** system. Fixed critical UI scrolling bugs and Gemini API rate limit / 0-quota issues by safely handling 429 errors and downgrading to the highly reliable `gemini-1.5-flash` model.
**Where we stopped:** Chatbot now uses `analyzeMessageWithGemini` to parse all inputs flexibly while maintaining strict control of the conversation flow. The chat UI is stable and doesn't bounce.
**What should be done next:** Phase 4 (Email notifications via SMTP/Gmail) and Phase 5 (Resume upload & JD matching).
