-- NearVibe Database Schema for PostgreSQL / Neon
-- Hyperlocal Event Discovery & Community Engagement

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_event ON event_comments(event_id);
