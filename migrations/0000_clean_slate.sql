-- Koinosystems Blog - Initial Schema
-- Migration 0000: Clean Slate

-- ============================================================
-- Content (Articles, Guides, Lists)
-- ============================================================
CREATE TABLE IF NOT EXISTS sc_content (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    slug TEXT UNIQUE,
    summary TEXT,
    highlight TEXT,
    cover_img TEXT,
    cover_alt TEXT,
    type TEXT NOT NULL DEFAULT 'blog',
    status TEXT NOT NULL DEFAULT 'draft',
    published_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kkc_author ON sc_content(author_id);
CREATE INDEX IF NOT EXISTS idx_kkc_status ON sc_content(status);
CREATE INDEX IF NOT EXISTS idx_kkc_slug ON sc_content(slug);
CREATE INDEX IF NOT EXISTS idx_kkc_type ON sc_content(type);

-- ============================================================
-- Content Tags
-- ============================================================
CREATE TABLE IF NOT EXISTS sc_content_tags (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL REFERENCES sc_content(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    UNIQUE(content_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_kkct_content ON sc_content_tags(content_id);
CREATE INDEX IF NOT EXISTS idx_kkct_tag ON sc_content_tags(tag);

-- ============================================================
-- Content Comments
-- ============================================================
CREATE TABLE IF NOT EXISTS sc_content_comments (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL REFERENCES sc_content(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    body TEXT NOT NULL,
    parent_id TEXT,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kkcc_content ON sc_content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_kkcc_user ON sc_content_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_kkcc_parent ON sc_content_comments(parent_id);

-- ============================================================
-- Content Likes
-- ============================================================
CREATE TABLE IF NOT EXISTS sc_content_likes (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL REFERENCES sc_content(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(content_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_kkcl_content ON sc_content_likes(content_id);

-- ============================================================
-- Content Share Counts
-- ============================================================
CREATE TABLE IF NOT EXISTS sc_content_share_counts (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL REFERENCES sc_content(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(content_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_kkcsc_content ON sc_content_share_counts(content_id);

-- ============================================================
-- App Metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- Processed Events
-- ============================================================
CREATE TABLE IF NOT EXISTS processed_events (
    event_id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    processed_at TEXT DEFAULT (datetime('now'))
);
