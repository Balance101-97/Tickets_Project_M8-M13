-- server-main/src/db/schema.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  CI_Name TEXT DEFAULT '',
  CI_Cat TEXT DEFAULT '',
  Status TEXT NOT NULL DEFAULT 'Work In Progress',
  Priority TEXT DEFAULT '1',
  Open_Time TEXT DEFAULT NULL,
  Close_Time TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  events TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(Status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(Priority);
CREATE INDEX IF NOT EXISTS idx_tickets_ci_name ON tickets(CI_Name);
