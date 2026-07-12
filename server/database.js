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

module.exports = db;