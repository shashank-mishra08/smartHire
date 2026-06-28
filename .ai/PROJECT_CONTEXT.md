# SmartHire - AI Interview Scheduling Agent

## Project Name
SmartHire

## Project Goal
Build an end-to-end Agentic AI system that automates interview scheduling through natural AI conversation with candidates. The system collects candidate details conversationally, checks recruiter calendar availability, schedules interviews, sends notifications, and maintains records — all without manual intervention.

## Current Objective
Project setup and architecture planning

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
Candidate (Chat UI) → Backend API → AI Agent (Gemini/OpenAI)
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
              Google Calendar    Gmail/Email          MongoDB
              (Availability)    (Notifications)     (Storage)
                    │                   │                   │
              Google Meet        Google Sheets         Slack
              (Link Gen)         (Logging)          (Notify)
```

## Tech Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14+ (App Router) | SSR, API routes, modern React |
| UI | Tailwind CSS + shadcn/ui | Rapid premium UI development |
| Backend | Node.js + Express | Fast API development, JS ecosystem |
| AI/LLM | Google Gemini API | Cost-effective, good reasoning |
| Database | MongoDB Atlas | Flexible schema, existing cluster |
| Calendar | Google Calendar API | Most common, OAuth support |
| Email | Gmail API / Nodemailer | Direct integration |
| Sheets | Google Sheets API | Recruiter-friendly logging |
| Video | Google Meet | Auto link generation via Calendar |
| Notifications | Slack Webhooks | Team notifications |
| Auth | NextAuth.js + Google OAuth | Secure recruiter login |
| File Storage | Google Drive API | Resume storage |

## APIs Used
- Google Calendar API (scheduling, availability)
- Gmail API / SMTP (email notifications)
- Google Sheets API (interview logging)
- Google Drive API (resume storage)
- Google Meet (via Calendar API - auto link)
- Gemini API (AI conversation)
- Slack Incoming Webhooks (notifications)

## Database Schema (MongoDB)
### Collections:
1. **candidates** - name, email, phone, role, resumeUrl, resumeSummary, scores, createdAt
2. **interviews** - candidateId, recruiterId, date, time, status, meetLink, calendarEventId
3. **recruiters** - name, email, calendarId, slackId, department
4. **conversations** - candidateId, messages[], context, status
5. **jobDescriptions** - title, description, skills[], department, recruiterId

## Environment Variables
```
# AI
GEMINI_API_KEY=

# Google APIs
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# MongoDB
MONGODB_URI=mongodb+srv://shashankmishra00026:WhNWbpvZrCSq9bk1@cluster0.og0x7.mongodb.net/SmartHire?retryWrites=true&w=majority

# Slack
SLACK_WEBHOOK_URL=

# App
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# SMTP (fallback)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## Current Working Module
Google Calendar API integration and OAuth setup.

## Current Progress
- [x] Project scaffolding
- [x] Architecture design
- [x] Backend API + MongoDB setup
- [x] AI Chatbot conversation flow (Gemini)
- [x] Premium Frontend UI (Chat + Dashboard)

## Completed Features
1. **AI Conversation Chatbot**: Built with Gemini 2.0 Flash, state machine handling data collection.
2. **Premium UI**: Next.js App Router, Tailwind CSS, Glassmorphism, animations.
3. **Database Integration**: MongoDB models for Candidate, Interview, Conversation.
4. **Recruiter Dashboard**: Layout, analytics stats, recent interviews list.

## Pending Features
1. AI Conversation Chatbot (natural language)
2. Candidate Detail Collection
3. Google Calendar Integration (availability check)
4. Interview Scheduling (slot booking)
5. Google Meet Link Generation
6. Email Notifications (candidate + recruiter)
7. Google Sheets Logging
8. Resume Upload & Storage
9. Resume AI Summary
10. JD Matching & Scoring
11. Auto Question Generation
12. Candidate Scoring
13. Interview Reminders
14. Reschedule/Cancel Flow
15. Recruiter Dashboard
16. Analytics (scheduled, pending, completed)
17. Slack Notifications

## Known Issues
(none yet)

## Future Improvements
- WhatsApp/SMS notifications via Twilio
- Microsoft Outlook Calendar support
- Video interview recording & analysis
- Multi-language support
- Bulk scheduling
- Interview feedback collection

---

## Current Status

**What we were doing:** Fixed port conflict (5000 -> 5001) and frontend caching issues. Successfully deployed local development servers for MVP phase 1 and 2.  
**Where we stopped:** Tasks updated. AI chat interface and Dashboard UI are working locally.  
**What should be done next:** Wait for the user to add the `GEMINI_API_KEY` to the `.env` file, and then begin Google Calendar API OAuth integration for scheduling.
