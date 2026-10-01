-- Schema for FirstPR PostgreSQL Database

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  password_hash TEXT,
  github_id VARCHAR(100) UNIQUE,
  github_username VARCHAR(100) UNIQUE,
  avatar_url TEXT,
  preferred_skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issues (
  github_issue_id BIGINT PRIMARY KEY,
  repo_name VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  labels TEXT[] DEFAULT '{}',
  comments_count INT DEFAULT 0,
  opened_at TIMESTAMP WITH TIME ZONE,
  confidence_score FLOAT NOT NULL DEFAULT 0,
  is_beginner_friendly BOOLEAN DEFAULT TRUE,
  ai_explanation TEXT,
  original_body TEXT,
  match_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  github_issue_id BIGINT NOT NULL REFERENCES issues(github_issue_id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'SAVED',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT bookmarks_user_issue_unique UNIQUE (user_id, github_issue_id)
);

CREATE TABLE IF NOT EXISTS search_cache (
  cache_key VARCHAR(255) PRIMARY KEY,
  response_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrations to ensure columns and constraints exist on existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_github_issue_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_user_issue_unique'
  ) THEN
    ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_issue_unique UNIQUE (user_id, github_issue_id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issues_confidence ON issues(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_status ON bookmarks(status);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires_at ON search_cache(expires_at);
