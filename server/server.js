const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = 3000;
const projectRoot = path.join(__dirname, "..");

// Позволяет серверу принимать JSON.
app.use(express.json());

// Раздаём HTML, CSS, JS и изображения из основной папки проекта.
app.use(express.static(projectRoot));

function normalizeEvent(row) {
  return {
    id: row.id,
    title: row.title,
    date: row.event_date,
    time: row.event_time,
    place: row.place,
    description: row.description,
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateEvent(body) {
  const title = String(body.title || "").trim();
  const date = String(body.date || "").trim();
  const time = String(body.time || "").trim();
  const place = String(body.place || "").trim();
  const description = String(body.description || "").trim();
  const published = body.published !== false;

  if (!title || !date || !time || !place) {
    return {
      error: "Название, дата, время и адрес обязательны.",
    };
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const timePattern = /^\d{2}:\d{2}$/;

  if (!datePattern.test(date)) {
    return {
      error: "Дата должна быть в формате YYYY-MM-DD.",
    };
  }

  if (!timePattern.test(time)) {
    return {
      error: "Время должно быть в формате HH:MM.",
    };
  }

  return {
    value: {
      title,
      date,
      time,
      place,
      description,
      published,
    },
  };
}

/*
  Получить опубликованные события для обычного сайта.
  Пример: GET /api/events
*/
app.get("/api/events", (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT *
        FROM events
        WHERE published = 1
        ORDER BY event_date ASC, event_time ASC
      `)
      .all();

    res.json(rows.map(normalizeEvent));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Не удалось загрузить события.",
    });
  }
});

/*
  Получить все события для админки,
  включая скрытые.
*/
app.get("/api/admin/events", (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT *
        FROM events
        ORDER BY event_date ASC, event_time ASC
      `)
      .all();

    res.json(rows.map(normalizeEvent));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Не удалось загрузить события.",
    });
  }
});

/*
  Создать событие.
  POST /api/admin/events
*/
app.post("/api/admin/events", (req, res) => {
  try {
    const validation = validateEvent(req.body);

    if (validation.error) {
      return res.status(400).json({
        error: validation.error,
      });
    }

    const event = validation.value;

    const result = db
      .prepare(`
        INSERT INTO events (
          title,
          event_date,
          event_time,
          place,
          description,
          published
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        event.title,
        event.date,
        event.time,
        event.place,
        event.description,
        event.published ? 1 : 0
      );

    const createdEvent = db
      .prepare(`
        SELECT *
        FROM events
        WHERE id = ?
      `)
      .get(result.lastInsertRowid);

    res.status(201).json(normalizeEvent(createdEvent));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Не удалось создать событие.",
    });
  }
});

/*
  Изменить событие.
  PUT /api/admin/events/:id
*/
app.put("/api/admin/events/:id", (req, res) => {
  try {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId)) {
      return res.status(400).json({
        error: "Некорректный ID события.",
      });
    }

    const existingEvent = db
      .prepare(`
        SELECT id
        FROM events
        WHERE id = ?
      `)
      .get(eventId);

    if (!existingEvent) {
      return res.status(404).json({
        error: "Событие не найдено.",
      });
    }

    const validation = validateEvent(req.body);

    if (validation.error) {
      return res.status(400).json({
        error: validation.error,
      });
    }

    const event = validation.value;

    db.prepare(`
      UPDATE events
      SET
        title = ?,
        event_date = ?,
        event_time = ?,
        place = ?,
        description = ?,
        published = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      event.title,
      event.date,
      event.time,
      event.place,
      event.description,
      event.published ? 1 : 0,
      eventId
    );

    const updatedEvent = db
      .prepare(`
        SELECT *
        FROM events
        WHERE id = ?
      `)
      .get(eventId);

    res.json(normalizeEvent(updatedEvent));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Не удалось обновить событие.",
    });
  }
});

/*
  Удалить событие.
  DELETE /api/admin/events/:id
*/
app.delete("/api/admin/events/:id", (req, res) => {
  try {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId)) {
      return res.status(400).json({
        error: "Некорректный ID события.",
      });
    }

    const result = db
      .prepare(`
        DELETE FROM events
        WHERE id = ?
      `)
      .run(eventId);

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Событие не найдено.",
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Не удалось удалить событие.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Сайт запущен: http://localhost:${PORT}`);
  console.log(`Админка: http://localhost:${PORT}/admin/login.html`);
});