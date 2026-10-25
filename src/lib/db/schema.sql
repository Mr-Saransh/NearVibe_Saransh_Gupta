-- NearVibe Database Schema for PostgreSQL / Neon
-- Hyperlocal Event Discovery, Poster Ingestion, Trust System, SquadUp & Community Engagement

CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  role VARCHAR(32) NOT NULL DEFAULT 'attendee', -- 'attendee', 'organizer', 'admin'
  interests TEXT[] DEFAULT '{}',
  preferred_city VARCHAR(100) DEFAULT 'Delhi NCR',
  preferred_radius_km INTEGER DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  organizer_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  cover_image TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  format VARCHAR(32) NOT NULL DEFAULT 'in-person', -- 'in-person', 'online', 'hybrid'
  venue_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price NUMERIC(10, 2) DEFAULT 0.00,
  capacity INTEGER NOT NULL DEFAULT 100,
  status VARCHAR(32) NOT NULL DEFAULT 'published', -- 'published', 'draft', 'cancelled'
  featured BOOLEAN DEFAULT false,
  -- Trust and Freshness & Poster Ingestion
  trust_status VARCHAR(32) NOT NULL DEFAULT 'details_reviewed',
  source_type VARCHAR(32) DEFAULT 'direct_published',
  source_url TEXT,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  extraction_metadata JSONB DEFAULT '{}',
  duplicate_of_id VARCHAR(64),
  duplicate_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migration support for existing database instances
ALTER TABLE events ADD COLUMN IF NOT EXISTS trust_status VARCHAR(32) NOT NULL DEFAULT 'details_reviewed';
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_type VARCHAR(32) DEFAULT 'direct_published';
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS extraction_metadata JSONB DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS duplicate_of_id VARCHAR(64);
ALTER TABLE events ADD COLUMN IF NOT EXISTS duplicate_reason TEXT;

CREATE TABLE IF NOT EXISTS registrations (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'waitlist'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_active_registration UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS saved_events (
  user_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS event_comments (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_avatar TEXT,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_reports (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reporter_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- SQUADUP: Teammate Profiles, Teams, Members, and Join Requests
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS squad_profiles (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  preferred_roles TEXT[] DEFAULT '{}',
  experience VARCHAR(32) DEFAULT 'Intermediate',
  collaboration_style VARCHAR(32) DEFAULT 'In-Person',
  contact_visible BOOLEAN DEFAULT true,
  handle VARCHAR(100),
  github_url TEXT,
  portfolio_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS squad_teams (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  leader_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  required_roles TEXT[] DEFAULT '{}',
  max_members INTEGER NOT NULL DEFAULT 4,
  status VARCHAR(32) NOT NULL DEFAULT 'recruiting', -- 'recruiting', 'full', 'closed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS squad_members (
  team_id VARCHAR(64) NOT NULL REFERENCES squad_teams(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(64) NOT NULL,
  is_leader BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS squad_join_requests (
  id VARCHAR(64) PRIMARY KEY,
  team_id VARCHAR(64) NOT NULL REFERENCES squad_teams(id) ON DELETE CASCADE,
  event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  applicant_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  applied_role VARCHAR(64) NOT NULL,
  note TEXT,
  skills TEXT[] DEFAULT '{}',
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_team_applicant UNIQUE(team_id, applicant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_trust_status ON events(trust_status);
CREATE INDEX IF NOT EXISTS idx_squad_teams_event ON squad_teams(event_id);
CREATE INDEX IF NOT EXISTS idx_squad_requests_team ON squad_join_requests(team_id);
