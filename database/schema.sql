-- MeetPilotAI Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jhdkzdsatytnweaiioya/sql

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Meetings
CREATE TABLE IF NOT EXISTS meetings (
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
CREATE TABLE IF NOT EXISTS summaries (
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
CREATE TABLE IF NOT EXISTS action_items (
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
CREATE TABLE IF NOT EXISTS reports (
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
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    meeting_id UUID,
    title TEXT NOT NULL,
    remind_at TIMESTAMPTZ NOT NULL,
    reminder_type TEXT DEFAULT 'email',
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);
