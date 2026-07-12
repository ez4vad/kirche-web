const path = require("path");
const Database = require("better-sqlite3");

const databasePath = path.join(__dirname, "church.db");
const db = new Database(databasePath);

// Включаем поддержку внешних ключей.
db.pragma("foreign_keys = ON");

// Создаём таблицу событий, если её ещё нет.
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

module.exports = db;