const path = require("path");
const Database = require("better-sqlite3");

const databasePath = path.join(
  __dirname,
  "church.db"
);

const db = new Database(databasePath);

db.pragma("foreign_keys = ON");

/* =========================
   СОБЫТИЯ
========================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_time TEXT NOT NULL,
    place TEXT NOT NULL,
    description TEXT DEFAULT '',
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

/* =========================
   НОВОСТИ
========================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT DEFAULT '',
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT DEFAULT '',
    author TEXT DEFAULT '',
    publication_date TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

/* =========================
   ГАЛЕРЕЯ
========================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image TEXT NOT NULL,
    title TEXT DEFAULT '',
    category TEXT DEFAULT 'Община',
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

/* =========================
   МОЛИТВЕННЫЕ ЗАПРОСЫ
========================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS prayer_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT '',
    contact TEXT DEFAULT '',
    request_text TEXT NOT NULL,
    anonymous INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

/* =========================
   АНАЛИТИКА
========================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS analytics_pageviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    page_path TEXT NOT NULL,
    page_title TEXT DEFAULT '',
    referrer TEXT DEFAULT '',
    device_type TEXT DEFAULT 'desktop',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS
  analytics_pageviews_created_at_index
  ON analytics_pageviews(created_at)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS
  analytics_pageviews_session_id_index
  ON analytics_pageviews(session_id)
`);

/* =========================
   АДМИНИСТРАТОРЫ
========================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;