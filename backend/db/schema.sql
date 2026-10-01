-- Schema for FirstPR PostgreSQL Database

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  github_username VARCHAR(100) UNIQUE,
  email VARCHAR(255) UNIQUE,
  preferred_skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  github_issue_id BIGINT NOT NULL REFERENCES issues(github_issue_id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'SAVED',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(github_issue_id)
);

CREATE INDEX IF NOT EXISTS idx_issues_confidence ON issues(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_status ON bookmarks(status);
