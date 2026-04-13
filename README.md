# MeetPilotAI - AI-Powered Meeting Minutes

Final Year College Project (5 teammates)

AI meeting assistant that records meetings (live mic or file upload), transcribes audio via Groq Whisper, generates AI summaries, extracts action items using a trained ML pipeline, creates editable reports, and sends them via email.

## Live URLs

- **Frontend**: https://meetpilot-ai.vercel.app (Vercel)
- **Backend API**: https://meetpilotai.onrender.com (Render, Python 3.12)
- **Database**: Supabase PostgreSQL (Mumbai region)
- **GitHub**: https://github.com/vishalmotionwork-lang/MeetPilotAI

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + React Router 7 | SPA with 10 pages, lavender design system |
| **Backend** | Flask 3.1 + Gunicorn | REST API (15 endpoints), audio processing |
| **Database** | Supabase PostgreSQL | 6 tables, accessed via supabase-py |
| **AI - Transcription** | Groq Whisper Large v3 | Speech-to-text (audio chunks) |
| **AI - Summary** | Groq LLaMA 3.1 8B Instant | Meeting summaries with key points, decisions |
| **AI - Action Items** | sklearn pipeline + Groq LLaMA 3.3 70B | 3-stage: regex -> ML classifier -> LLM enrichment |
| **Email** | Gmail SMTP (via Vercel serverless) | Send meeting reports to any email |
| **Hosting - Frontend** | Vercel | React app + Python serverless function for email |
| **Hosting - Backend** | Render (free tier) | Flask API, ~30s cold start after 15min idle |

---

## Project Structure

```
MeetPilotAI/
├── frontend/                    # React 19 (Create React App)
│   ├── src/
│   │   ├── pages/               # 10 page components
│   │   │   ├── LandingPage.js   # Marketing page (public)
│   │   │   ├── LoginPage.js     # Auth - login
│   │   │   ├── SignUpPage.js    # Auth - register
│   │   │   ├── Dashboard.js     # KPI cards, recent meetings, pending actions
│   │   │   ├── RecordPage.js    # Live mic recording + file upload
│   │   │   ├── MeetingsPage.js  # Meeting list with search/filter
│   │   │   ├── MeetingDetailPage.js  # 4-tab detail view
│   │   │   ├── ActionItemsPage.js    # Action items with priority/status
│   │   │   ├── RemindersPage.js      # Reminder management
│   │   │   └── ProfilePage.js        # User profile
│   │   ├── components/
│   │   │   ├── Navbar.js        # Top nav with mobile hamburger menu
│   │   │   ├── AudioRecorder.js # MediaRecorder + waveform
│   │   │   └── ProtectedRoute.js
│   │   ├── services/api.js      # Axios API client
│   │   ├── config.js            # API_URL config
│   │   ├── index.css            # All styles (2200+ lines)
│   │   ├── App.js               # Routes
│   │   └── index.js             # Entry point
│   ├── api/
│   │   └── send-email.py        # Vercel serverless function (Gmail SMTP)
│   ├── public/                  # Favicon, index.html
│   ├── vercel.json              # Vercel routing config
│   ├── .env                     # Frontend env vars
│   └── package.json
│
├── backend/                     # Flask 3.1 + Python 3.12
│   ├── app.py                   # Main app - all API routes
│   ├── audio_utils.py           # Audio conversion (pydub/ffmpeg)
│   ├── config/
│   │   └── supabase_client.py   # Supabase client init
│   ├── services/
│   │   ├── transcription.py     # Groq Whisper transcription
│   │   ├── ai_processor.py      # LLM summary generation
│   │   └── action_item_extractor.py  # 3-stage ML pipeline
│   ├── models/
│   │   └── pipeline.pkl         # Trained sklearn model
│   ├── requirements.txt
│   ├── render.yaml              # Render deployment config
│   ├── .python-version          # Pins Python 3.12
│   └── .env                     # Backend env vars
│
└── database/
    └── schema.sql               # Database schema
```

---

## Database Schema (6 Tables)

Run this SQL in the Supabase SQL Editor to create all tables:

```sql
-- 1. Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Meetings
CREATE TABLE meetings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    transcript TEXT,
    source_type TEXT DEFAULT 'upload',
    duration_seconds INTEGER,
    status TEXT DEFAULT 'processing',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Summaries
CREATE TABLE summaries (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id),
    insight TEXT,
    key_points JSONB DEFAULT '[]',
    action_items JSONB DEFAULT '[]',
    decisions JSONB DEFAULT '[]',
    next_steps JSONB DEFAULT '[]',
    risks JSONB DEFAULT '[]',
    model_used TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Action Items
CREATE TABLE action_items (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id),
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    task TEXT,
    context TEXT,
    assignee TEXT DEFAULT 'Unassigned',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id),
    user_id UUID REFERENCES users(id),
    title TEXT,
    content_html TEXT,
    content_json JSONB,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_to JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Reminders
CREATE TABLE reminders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    meeting_id UUID,
    title TEXT NOT NULL,
    remind_at TIMESTAMPTZ NOT NULL,
    reminder_type TEXT DEFAULT 'email',
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
SUPABASE_URL=https://jhdkzdsatytnweaiioya.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZGt6ZHNhdHl0bndlYWlpb3lhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI5NDc3NCwiZXhwIjoyMDkwODcwNzc0fQ.It7nwSMl0s8xKr8UdHhW7GHB8__nTF2gD5B4_EMCUY0
GROQ_API_KEY=your_groq_api_key_here
FLASK_ENV=development
PORT=5001
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=https://meetpilotai.onrender.com
REACT_APP_SUPABASE_URL=https://jhdkzdsatytnweaiioya.supabase.co
REACT_APP_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZGt6ZHNhdHl0bndlYWlpb3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTQ3NzQsImV4cCI6MjA5MDg3MDc3NH0.ixTvjSw5vUHSQbIFWNAeyROWvrXI9WPEhhfZurapJhQ
```

### Render Environment Variables (Backend hosting)

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://jhdkzdsatytnweaiioya.supabase.co` |
| `SUPABASE_SERVICE_KEY` | (same as backend .env above) |
| `GROQ_API_KEY` | `your_groq_api_key_here` |
| `FLASK_ENV` | `production` |
| `SMTP_EMAIL` | `vishal@knowai.club` |
| `SMTP_APP_PASSWORD` | `your_gmail_app_password_here` |

### Vercel Environment Variables (Frontend + email serverless fn)

| Variable | Value |
|----------|-------|
| `SMTP_EMAIL` | `vishal@knowai.club` |
| `SMTP_APP_PASSWORD` | `your_gmail_app_password_here` |

---

## Supabase Account

- **Account**: vishal@knowai.club (use Safari/incognito — this is the SECOND Google account)
- **Dashboard**: https://supabase.com/dashboard/project/jhdkzdsatytnweaiioya
- **Project Ref**: jhdkzdsatytnweaiioya
- **Region**: South Asia (Mumbai) / ap-south-1
- **Note**: Free tier pauses after 7 days idle — restore from dashboard if needed

---

## ML Model

- **File**: `backend/models/pipeline.pkl`
- **Trained on**: [Google Colab Notebook](https://colab.research.google.com/drive/1ZsJoyY4XBDY72HCaj_0IpgeyOPLy-FFB)
- **Type**: scikit-learn TfidfVectorizer + classifier
- **Threshold**: 0.55 probability
- **Pipeline**: Regex extraction -> sklearn ML prediction -> Groq LLM enrichment (adds assignees, priorities, due dates)

---

## Local Development Setup

### Prerequisites

- **Node.js** v18+
- **Python** 3.12 (NOT 3.13/3.14 — `audioop` module breaks)
- **ffmpeg** (`brew install ffmpeg` on Mac, `apt install ffmpeg` on Linux)

### Backend

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env with the variables listed above
python app.py
# Runs on http://localhost:5001
```

### Frontend

```bash
cd frontend
npm install

# For LOCAL dev, change .env to:
# REACT_APP_API_URL=http://localhost:5001

PORT=3001 npm start
# Runs on http://localhost:3001
```

---

## Deployment Guide

### Frontend -> Vercel

```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod --yes
vercel alias <deployment-url> meetpilot-ai.vercel.app
```

Add env vars in Vercel Dashboard > Settings > Environment Variables:
- `SMTP_EMAIL` and `SMTP_APP_PASSWORD`

### Backend -> Render

1. Push to GitHub
2. Go to https://dashboard.render.com
3. New Web Service > connect repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --timeout 120`
5. Add env vars in Environment tab
6. Deploy

### Important Deployment Notes

- Render free tier spins down after 15min idle (~30s cold start)
- Supabase free tier pauses after 7 days idle (restore from dashboard)
- Email uses Vercel serverless function (Render blocks SMTP ports)
- Gmail App Password is for `vishal@knowai.club` Google Workspace account

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register (name, email, password) |
| POST | `/api/auth/login` | Login (email, password) |
| POST | `/api/process-audio` | Upload audio for transcription + AI |
| POST | `/api/process-transcript` | Process raw transcript text |
| GET | `/api/meetings?user_id=` | List meetings |
| GET | `/api/meetings/:id` | Meeting detail with summary + actions + report |
| GET | `/api/meetings/:id/report` | Get report |
| PUT | `/api/meetings/:id/report` | Update report HTML |
| POST | `/api/send-email` | Send email (Vercel serverless) |
| GET | `/api/action-items?user_id=` | List action items |
| PATCH | `/api/action-items/:id` | Update action item |
| POST | `/api/reminders` | Create reminder |
| GET | `/api/reminders?user_id=` | List reminders |
| DELETE | `/api/reminders/:id` | Delete reminder |
| GET | `/api/dashboard?user_id=` | Dashboard stats |
| GET | `/api/health` | Health check |

---

## Design System

- **Font**: Inter (Google Fonts)
- **Primary**: #6C3EF4 (purple) | **Background**: #FAF8FF (lavender)
- **Responsive**: 4 breakpoints (1200px, 1024px, 768px, 480px)
- **Mobile**: Hamburger nav with slide-down drawer
