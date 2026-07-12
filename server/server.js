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

function validateNews(body) {
  const title = String(
    body.title || ""
  ).trim();

  const category = String(
    body.category || ""
  ).trim();

  const excerpt = String(
    body.excerpt || ""
  ).trim();

  const content = String(
    body.content || ""
  ).trim();

  const image = String(
    body.image || ""
  ).trim();

  const author = String(
    body.author || ""
  ).trim();

  const date = String(
    body.date || ""
  ).trim();

  const published =
    body.published !== false;

  if (!title || !excerpt || !content || !date) {
    return {
      error:
        "Заголовок, краткое описание, полный текст и дата обязательны."
    };
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(date)) {
    return {
      error:
        "Дата должна быть в формате YYYY-MM-DD."
    };
  }

  return {
    value: {
      title,
      category,
      excerpt,
      content,
      image,
      author,
      date,
      published
    }
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

/* =========================
   ПУБЛИЧНЫЕ НОВОСТИ
========================= */

/*
  Получить опубликованные новости.

  GET /api/news
*/
app.get("/api/news", (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT *
        FROM news
        WHERE published = 1
        ORDER BY publication_date DESC, id DESC
      `)
      .all();

    res.json(
      rows.map(normalizeNews)
    );
  } catch (error) {
    console.error(
      "Ошибка загрузки новостей:",
      error
    );

    res.status(500).json({
      error:
        "Не удалось загрузить новости."
    });
  }
});

/*
  Получить одну опубликованную новость.

  GET /api/news/:id
*/
app.get("/api/news/:id", (req, res) => {
  try {
    const newsId = Number(req.params.id);

    if (!Number.isInteger(newsId)) {
      return res.status(400).json({
        error: "Некорректный ID новости."
      });
    }

    const row = db
      .prepare(`
        SELECT *
        FROM news
        WHERE id = ?
          AND published = 1
      `)
      .get(newsId);

    if (!row) {
      return res.status(404).json({
        error: "Новость не найдена."
      });
    }

    res.json(normalizeNews(row));
  } catch (error) {
    console.error(
      "Ошибка загрузки новости:",
      error
    );

    res.status(500).json({
      error:
        "Не удалось загрузить новость."
    });
  }
});

/* =========================
   НОВОСТИ ДЛЯ АДМИНКИ
========================= */

/*
  Получить все новости,
  включая скрытые.

  GET /api/admin/news
*/
app.get("/api/admin/news", (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT *
        FROM news
        ORDER BY publication_date DESC, id DESC
      `)
      .all();

    res.json(
      rows.map(normalizeNews)
    );
  } catch (error) {
    console.error(
      "Ошибка загрузки новостей:",
      error
    );

    res.status(500).json({
      error:
        "Не удалось загрузить новости."
    });
  }
});

/*
  Получить одну новость для редактирования.

  GET /api/admin/news/:id
*/
app.get(
  "/api/admin/news/:id",
  (req, res) => {
    try {
      const newsId = Number(req.params.id);

      if (!Number.isInteger(newsId)) {
        return res.status(400).json({
          error: "Некорректный ID новости."
        });
      }

      const row = db
        .prepare(`
          SELECT *
          FROM news
          WHERE id = ?
        `)
        .get(newsId);

      if (!row) {
        return res.status(404).json({
          error: "Новость не найдена."
        });
      }

      res.json(normalizeNews(row));
    } catch (error) {
      console.error(
        "Ошибка загрузки новости:",
        error
      );

      res.status(500).json({
        error:
          "Не удалось загрузить новость."
      });
    }
  }
);

/*
  Создать новость.

  POST /api/admin/news
*/
app.post("/api/admin/news", (req, res) => {
  try {
    const validation =
      validateNews(req.body);

    if (validation.error) {
      return res.status(400).json({
        error: validation.error
      });
    }

    const newsItem = validation.value;

    const result = db
      .prepare(`
        INSERT INTO news (
          title,
          category,
          excerpt,
          content,
          image,
          author,
          publication_date,
          published
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        newsItem.title,
        newsItem.category,
        newsItem.excerpt,
        newsItem.content,
        newsItem.image,
        newsItem.author,
        newsItem.date,
        newsItem.published ? 1 : 0
      );

    const createdNews = db
      .prepare(`
        SELECT *
        FROM news
        WHERE id = ?
      `)
      .get(result.lastInsertRowid);

    res
      .status(201)
      .json(normalizeNews(createdNews));
  } catch (error) {
    console.error(
      "Ошибка создания новости:",
      error
    );

    res.status(500).json({
      error:
        "Не удалось создать новость."
    });
  }
});

/*
  Изменить новость.

  PUT /api/admin/news/:id
*/
app.put(
  "/api/admin/news/:id",
  (req, res) => {
    try {
      const newsId = Number(req.params.id);

      if (!Number.isInteger(newsId)) {
        return res.status(400).json({
          error: "Некорректный ID новости."
        });
      }

      const existingNews = db
        .prepare(`
          SELECT id
          FROM news
          WHERE id = ?
        `)
        .get(newsId);

      if (!existingNews) {
        return res.status(404).json({
          error: "Новость не найдена."
        });
      }

      const validation =
        validateNews(req.body);

      if (validation.error) {
        return res.status(400).json({
          error: validation.error
        });
      }

      const newsItem = validation.value;

      db.prepare(`
        UPDATE news
        SET
          title = ?,
          category = ?,
          excerpt = ?,
          content = ?,
          image = ?,
          author = ?,
          publication_date = ?,
          published = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        newsItem.title,
        newsItem.category,
        newsItem.excerpt,
        newsItem.content,
        newsItem.image,
        newsItem.author,
        newsItem.date,
        newsItem.published ? 1 : 0,
        newsId
      );

      const updatedNews = db
        .prepare(`
          SELECT *
          FROM news
          WHERE id = ?
        `)
        .get(newsId);

      res.json(
        normalizeNews(updatedNews)
      );
    } catch (error) {
      console.error(
        "Ошибка изменения новости:",
        error
      );

      res.status(500).json({
        error:
          "Не удалось изменить новость."
      });
    }
  }
);

/*
  Удалить новость.

  DELETE /api/admin/news/:id
*/
app.delete(
  "/api/admin/news/:id",
  (req, res) => {
    try {
      const newsId = Number(req.params.id);

      if (!Number.isInteger(newsId)) {
        return res.status(400).json({
          error: "Некорректный ID новости."
        });
      }

      const result = db
        .prepare(`
          DELETE FROM news
          WHERE id = ?
        `)
        .run(newsId);

      if (result.changes === 0) {
        return res.status(404).json({
          error: "Новость не найдена."
        });
      }

      res.status(204).send();
    } catch (error) {
      console.error(
        "Ошибка удаления новости:",
        error
      );

      res.status(500).json({
        error:
          "Не удалось удалить новость."
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Сайт запущен: http://localhost:${PORT}`);
  console.log(`Админка: http://localhost:${PORT}/admin/login.html`);
});

function normalizeNews(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    content: row.content,
    image: row.image,
    author: row.author,
    date: row.publication_date,
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}