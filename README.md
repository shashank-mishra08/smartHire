# 🤖 SmartHire — AI Interview Scheduling Agent

An end-to-end **Agentic AI system** that automates interview scheduling through natural AI conversation with candidates.

## ✨ Features

- **🧠 Natural AI Conversations** — No boring forms, AI talks like a real recruiter
- **📅 Smart Calendar Sync** — Checks recruiter availability automatically
- **📧 Auto Email Notifications** — Beautiful emails to candidate & recruiter
- **🔗 Google Meet Links** — Auto-generated for every interview
- **📄 Resume Analysis** — AI-powered summary and skill extraction
- **📊 JD Matching** — Match percentage with missing skills
- **🔄 Reschedule/Cancel** — Through natural conversation
- **📋 Google Sheets Logging** — Every interview auto-logged
- **🎯 Recruiter Dashboard** — Analytics and interview management

## 🏗️ Architecture

```
SmartHire/
├── frontend/    → Next.js 14 (Chat UI + Dashboard)
├── backend/     → Express.js (API + AI Agent)
└── .ai/         → Project Memory System
```

## 🚀 Quick Start

### 1. Set Environment Variables

```bash
cp .env.example .env
# Edit .env and add your API keys
```

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open in Browser

- **Chat:** http://localhost:3000/chat
- **Dashboard:** http://localhost:3000/dashboard
- **API Health:** http://localhost:5000/api/health

## 🔑 Required API Keys

| Key | Purpose |
|-----|---------|
| `GEMINI_API_KEY` | AI conversation engine |
| `GOOGLE_CLIENT_ID` | Calendar, Gmail, Sheets |
| `SMTP_USER/PASS` | Email notifications |

## 📱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS |
| Backend | Express.js, TypeScript |
| AI | Google Gemini API |
| Database | Firebase Firestore |
| Calendar | Google Calendar API |
| Email | Nodemailer / Gmail |

## 👨‍💻 Built By

SmartHire AI — Intelligent Interview Scheduling
