require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");

const db = require("./database");

const SqliteSessionStore =
  require("better-sqlite3-session-store")(session);

/* =========================
   ОСНОВНЫЕ НАСТРОЙКИ
========================= */

const app = express();

const PORT =
  Number(process.env.PORT) || 3000;

const isProduction =
  process.env.NODE_ENV === "production";

const sessionSecret =
  String(process.env.SESSION_SECRET || "");

const projectRoot =
  path.join(__dirname, "..");

if (sessionSecret.length < 32) {
  throw new Error(
    "SESSION_SECRET отсутствует или слишком короткий. " +
    "Добавьте в .env строку минимум из 32 символов."
  );
}

/*
  На localhost эта настройка не используется.

  После публикации сайта, если перед Node.js
  находится один доверенный Nginx или прокси хостинга,
  Express сможет правильно определить HTTPS.
*/
if (isProduction) {
  app.set("trust proxy", 1);
}

/* =========================
   ПАПКИ ПРОЕКТА
========================= */

const uploadsDirectory =
  path.join(projectRoot, "uploads");

const newsUploadsDirectory =
  path.join(uploadsDirectory, "news");

const galleryUploadsDirectory =
  path.join(uploadsDirectory, "gallery");

fs.mkdirSync(newsUploadsDirectory, {
  recursive: true
});

fs.mkdirSync(galleryUploadsDirectory, {
  recursive: true
});

/* =========================
   ХРАНИЛИЩЕ СЕССИЙ
========================= */

const sessionsDatabase =
  new Database(
    path.join(__dirname, "sessions.db")
  );

const sessionStore =
  new SqliteSessionStore({
    client: sessionsDatabase,

    expired: {
      clear: true,
      intervalMs: 15 * 60 * 1000
    }
  });

/* =========================
   ОСНОВНЫЕ MIDDLEWARE
========================= */

/*
  Сервер принимает JSON.
*/
app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "1mb"
  })
);

/*
  Защищённая cookie-сессия.
*/
app.use(
  session({
    name: "philadelphia.admin.sid",

    secret: sessionSecret,

    store: sessionStore,

    resave: false,

    saveUninitialized: false,

    rolling: true,

    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60 * 1000
    }
  })
);

/*
  Раздаём загруженные изображения.
*/
app.use(
  "/uploads",
  express.static(uploadsDirectory, {
    fallthrough: false,
    maxAge: isProduction
      ? "7d"
      : 0
  })
);

/*
  Раздаём HTML, CSS, JS и images.
*/
app.use(
  express.static(projectRoot, {
    index: "index.html"
  })
);

/* =========================
   ОГРАНИЧЕНИЕ ПОПЫТОК ВХОДА
========================= */

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error:
      "Слишком много попыток входа. " +
      "Попробуйте снова через 15 минут."
  }
});

/* =========================
   НАСТРОЙКА ЗАГРУЗКИ ФОТО
========================= */

const allowedImageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);

function createImageStorage(directory) {
  return multer.diskStorage({
    destination(req, file, callback) {
      callback(null, directory);
    },

    filename(req, file, callback) {
      const extension =
        allowedImageTypes.get(file.mimetype);

      if (!extension) {
        callback(
          new Error(
            "Разрешены только JPG, PNG и WEBP."
          )
        );

        return;
      }

      const filename =
        `${Date.now()}-${crypto.randomUUID()}${extension}`;

      callback(null, filename);
    }
  });
}

function imageFileFilter(
  req,
  file,
  callback
) {
  if (
    !allowedImageTypes.has(file.mimetype)
  ) {
    callback(
      new Error(
        "Разрешены только JPG, PNG и WEBP."
      )
    );

    return;
  }

  callback(null, true);
}

const uploadNewsImage = multer({
  storage:
    createImageStorage(
      newsUploadsDirectory
    ),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },

  fileFilter: imageFileFilter
});

const uploadGalleryImages = multer({
  storage:
    createImageStorage(
      galleryUploadsDirectory
    ),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 20
  },

  fileFilter: imageFileFilter
});

/* =========================
   НОРМАЛИЗАЦИЯ ДАННЫХ
========================= */

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
    updatedAt: row.updated_at
  };
}

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

function normalizeGalleryItem(row) {
  return {
    id: row.id,
    image: row.image,
    title: row.title,
    category: row.category,
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizePrayerRequest(row) {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    request: row.request_text,
    anonymous: Boolean(row.anonymous),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/* =========================
   ПРОВЕРКА ДАННЫХ
========================= */

function validateEvent(body) {
  const title =
    String(body.title || "").trim();

  const date =
    String(body.date || "").trim();

  const time =
    String(body.time || "").trim();

  const place =
    String(body.place || "").trim();

  const description =
    String(body.description || "").trim();

  const published =
    body.published !== false;

  if (
    !title ||
    !date ||
    !time ||
    !place
  ) {
    return {
      error:
        "Название, дата, время и адрес обязательны."
    };
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return {
      error:
        "Дата должна быть в формате YYYY-MM-DD."
    };
  }

  if (
    !/^\d{2}:\d{2}$/.test(time)
  ) {
    return {
      error:
        "Время должно быть в формате HH:MM."
    };
  }

  return {
    value: {
      title,
      date,
      time,
      place,
      description,
      published
    }
  };
}

function validateNews(body) {
  const title =
    String(body.title || "").trim();

  const category =
    String(body.category || "").trim();

  const excerpt =
    String(body.excerpt || "").trim();

  const content =
    String(body.content || "").trim();

  const image =
    String(body.image || "").trim();

  const author =
    String(body.author || "").trim();

  const date =
    String(body.date || "").trim();

  const published =
    body.published !== false;

  if (
    !title ||
    !excerpt ||
    !content ||
    !date
  ) {
    return {
      error:
        "Заголовок, краткое описание, " +
        "полный текст и дата обязательны."
    };
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
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

/* =========================
   ПРОВЕРКА АВТОРИЗАЦИИ
========================= */

function requireAdmin(req, res, next) {
  if (
    req.session?.admin?.id
  ) {
    return next();
  }

  return res.status(401).json({
    error:
      "Требуется вход администратора."
  });
}

/* =========================
   АВТОРИЗАЦИЯ
========================= */

app.post(
  "/api/auth/login",
  loginLimiter,
  async (req, res) => {
    try {
      const username =
        String(
          req.body.username || ""
        ).trim();

      const password =
        String(
          req.body.password || ""
        );

      if (!username || !password) {
        return res.status(400).json({
          error:
            "Введите логин и пароль."
        });
      }

      const admin = db
        .prepare(`
          SELECT
            id,
            username,
            password_hash,
            is_active
          FROM admins
          WHERE username = ?
        `)
        .get(username);

      if (
        !admin ||
        !Boolean(admin.is_active)
      ) {
        return res.status(401).json({
          error:
            "Неверный логин или пароль."
        });
      }

      const passwordIsCorrect =
        await bcrypt.compare(
          password,
          admin.password_hash
        );

      if (!passwordIsCorrect) {
        return res.status(401).json({
          error:
            "Неверный логин или пароль."
        });
      }

      req.session.regenerate(
        (regenerateError) => {
          if (regenerateError) {
            console.error(
              "Ошибка создания сессии:",
              regenerateError
            );

            return res.status(500).json({
              error:
                "Не удалось выполнить вход."
            });
          }

          req.session.admin = {
            id: admin.id,
            username: admin.username
          };

          req.session.save(
            (saveError) => {
              if (saveError) {
                console.error(
                  "Ошибка сохранения сессии:",
                  saveError
                );

                return res
                  .status(500)
                  .json({
                    error:
                      "Не удалось сохранить вход."
                  });
              }

              db.prepare(`
                UPDATE admins
                SET
                  last_login_at =
                    CURRENT_TIMESTAMP,
                  updated_at =
                    CURRENT_TIMESTAMP
                WHERE id = ?
              `).run(admin.id);

              return res.json({
                authenticated: true,

                admin: {
                  id: admin.id,
                  username:
                    admin.username
                }
              });
            }
          );
        }
      );
    } catch (error) {
      console.error(
        "Ошибка входа администратора:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось выполнить вход."
      });
    }
  }
);

app.get(
  "/api/auth/me",
  (req, res) => {
    if (!req.session?.admin) {
      return res.status(401).json({
        authenticated: false
      });
    }

    return res.json({
      authenticated: true,
      admin: req.session.admin
    });
  }
);

app.post(
  "/api/auth/logout",
  (req, res) => {
    if (!req.session) {
      return res.status(204).send();
    }

    req.session.destroy((error) => {
      if (error) {
        console.error(
          "Ошибка выхода:",
          error
        );

        return res.status(500).json({
          error:
            "Не удалось выполнить выход."
        });
      }

      res.clearCookie(
        "philadelphia.admin.sid",
        {
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
          path: "/"
        }
      );

      return res.status(204).send();
    });
  }
);

/*
  Все маршруты, начинающиеся с /api/admin,
  после этой строки требуют авторизации.
*/
app.use(
  "/api/admin",
  requireAdmin
);

/* =========================
   ПУБЛИЧНЫЕ СОБЫТИЯ
========================= */

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

    return res.json(
      rows.map(normalizeEvent)
    );
  } catch (error) {
    console.error(
      "Ошибка загрузки событий:",
      error
    );

    return res.status(500).json({
      error:
        "Не удалось загрузить события."
    });
  }
});

/* =========================
   СОБЫТИЯ В АДМИНКЕ
========================= */

app.get(
  "/api/admin/events",
  (req, res) => {
    try {
      const rows = db
        .prepare(`
          SELECT *
          FROM events
          ORDER BY event_date ASC, event_time ASC
        `)
        .all();

      return res.json(
        rows.map(normalizeEvent)
      );
    } catch (error) {
      console.error(
        "Ошибка загрузки событий:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось загрузить события."
      });
    }
  }
);

app.post(
  "/api/admin/events",
  (req, res) => {
    try {
      const validation =
        validateEvent(req.body);

      if (validation.error) {
        return res.status(400).json({
          error: validation.error
        });
      }

      const event =
        validation.value;

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

      return res
        .status(201)
        .json(
          normalizeEvent(createdEvent)
        );
    } catch (error) {
      console.error(
        "Ошибка создания события:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось создать событие."
      });
    }
  }
);

app.put(
  "/api/admin/events/:id",
  (req, res) => {
    try {
      const eventId =
        Number(req.params.id);

      if (
        !Number.isInteger(eventId) ||
        eventId <= 0
      ) {
        return res.status(400).json({
          error:
            "Некорректный ID события."
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
          error:
            "Событие не найдено."
        });
      }

      const validation =
        validateEvent(req.body);

      if (validation.error) {
        return res.status(400).json({
          error: validation.error
        });
      }

      const event =
        validation.value;

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

      return res.json(
        normalizeEvent(updatedEvent)
      );
    } catch (error) {
      console.error(
        "Ошибка обновления события:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось обновить событие."
      });
    }
  }
);

app.delete(
  "/api/admin/events/:id",
  (req, res) => {
    try {
      const eventId =
        Number(req.params.id);

      if (
        !Number.isInteger(eventId) ||
        eventId <= 0
      ) {
        return res.status(400).json({
          error:
            "Некорректный ID события."
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
          error:
            "Событие не найдено."
        });
      }

      return res.status(204).send();
    } catch (error) {
      console.error(
        "Ошибка удаления события:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось удалить событие."
      });
    }
  }
);

/* =========================
   ЗАГРУЗКА ФОТО НОВОСТИ
========================= */

app.post(
  "/api/admin/uploads/news",
  uploadNewsImage.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error:
          "Фотография не была выбрана."
      });
    }

    return res.status(201).json({
      image:
        `/uploads/news/${req.file.filename}`
    });
  }
);

/* =========================
   ПУБЛИЧНЫЕ НОВОСТИ
========================= */

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

    return res.json(
      rows.map(normalizeNews)
    );
  } catch (error) {
    console.error(
      "Ошибка загрузки новостей:",
      error
    );

    return res.status(500).json({
      error:
        "Не удалось загрузить новости."
    });
  }
});

app.get(
  "/api/news/:id",
  (req, res) => {
    try {
      const newsId =
        Number(req.params.id);

      if (
        !Number.isInteger(newsId) ||
        newsId <= 0
      ) {
        return res.status(400).json({
          error:
            "Некорректный ID новости."
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
          error:
            "Новость не найдена."
        });
      }

      return res.json(
        normalizeNews(row)
      );
    } catch (error) {
      console.error(
        "Ошибка загрузки новости:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось загрузить новость."
      });
    }
  }
);

/* =========================
   НОВОСТИ В АДМИНКЕ
========================= */

app.get(
  "/api/admin/news",
  (req, res) => {
    try {
      const rows = db
        .prepare(`
          SELECT *
          FROM news
          ORDER BY publication_date DESC, id DESC
        `)
        .all();

      return res.json(
        rows.map(normalizeNews)
      );
    } catch (error) {
      console.error(
        "Ошибка загрузки новостей:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось загрузить новости."
      });
    }
  }
);

app.get(
  "/api/admin/news/:id",
  (req, res) => {
    try {
      const newsId =
        Number(req.params.id);

      if (
        !Number.isInteger(newsId) ||
        newsId <= 0
      ) {
        return res.status(400).json({
          error:
            "Некорректный ID новости."
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
          error:
            "Новость не найдена."
        });
      }

      return res.json(
        normalizeNews(row)
      );
    } catch (error) {
      console.error(
        "Ошибка загрузки новости:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось загрузить новость."
      });
    }
  }
);

app.post(
  "/api/admin/news",
  (req, res) => {
    try {
      const validation =
        validateNews(req.body);

      if (validation.error) {
        return res.status(400).json({
          error: validation.error
        });
      }

      const newsItem =
        validation.value;

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

      return res
        .status(201)
        .json(
          normalizeNews(createdNews)
        );
    } catch (error) {
      console.error(
        "Ошибка создания новости:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось создать новость."
      });
    }
  }
);

app.put(
  "/api/admin/news/:id",
  (req, res) => {
    try {
      const newsId =
        Number(req.params.id);

      if (
        !Number.isInteger(newsId) ||
        newsId <= 0
      ) {
        return res.status(400).json({
          error:
            "Некорректный ID новости."
        });
      }

      const existingNews = db
        .prepare(`
          SELECT *
          FROM news
          WHERE id = ?
        `)
        .get(newsId);

      if (!existingNews) {
        return res.status(404).json({
          error:
            "Новость не найдена."
        });
      }

      const validation =
        validateNews(req.body);

      if (validation.error) {
        return res.status(400).json({
          error: validation.error
        });
      }

      const newsItem =
        validation.value;

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

      return res.json(
        normalizeNews(updatedNews)
      );
    } catch (error) {
      console.error(
        "Ошибка изменения новости:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось изменить новость."
      });
    }
  }
);

app.delete(
  "/api/admin/news/:id",
  (req, res) => {
    try {
      const newsId =
        Number(req.params.id);

      if (
        !Number.isInteger(newsId) ||
        newsId <= 0
      ) {
        return res.status(400).json({
          error:
            "Некорректный ID новости."
        });
      }

      const newsItem = db
        .prepare(`
          SELECT image
          FROM news
          WHERE id = ?
        `)
        .get(newsId);

      if (!newsItem) {
        return res.status(404).json({
          error:
            "Новость не найдена."
        });
      }

      db.prepare(`
        DELETE FROM news
        WHERE id = ?
      `).run(newsId);

      if (
        newsItem.image &&
        newsItem.image.startsWith(
          "/uploads/news/"
        )
      ) {
        const filename =
          path.basename(newsItem.image);

        const filePath = path.join(
          newsUploadsDirectory,
          filename
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      return res.status(204).send();
    } catch (error) {
      console.error(
        "Ошибка удаления новости:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось удалить новость."
      });
    }
  }
);

/* =========================
   ПУБЛИЧНАЯ ГАЛЕРЕЯ
========================= */

app.get("/api/gallery", (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT *
        FROM gallery
        WHERE published = 1
        ORDER BY created_at DESC, id DESC
      `)
      .all();

    return res.json(
      rows.map(normalizeGalleryItem)
    );
  } catch (error) {
    console.error(
      "Ошибка загрузки галереи:",
      error
    );

    return res.status(500).json({
      error:
        "Не удалось загрузить галерею."
    });
  }
});

/* =========================
   ГАЛЕРЕЯ В АДМИНКЕ
========================= */

app.get(
  "/api/admin/gallery",
  (req, res) => {
    try {
      const rows = db
        .prepare(`
          SELECT *
          FROM gallery
          ORDER BY created_at DESC, id DESC
        `)
        .all();

      return res.json(
        rows.map(normalizeGalleryItem)
      );
    } catch (error) {
      console.error(
        "Ошибка загрузки галереи:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось загрузить фотографии."
      });
    }
  }
);

/* =========================
   ЗАГРУЗКА ФОТО В ГАЛЕРЕЮ
========================= */

app.post(
  "/api/admin/gallery/upload",
  uploadGalleryImages.array("images", 20),
  (req, res) => {
    try {
      const files =
        Array.isArray(req.files)
          ? req.files
          : [];

      if (files.length === 0) {
        return res.status(400).json({
          error:
            "Фотографии не были выбраны."
        });
      }

      const title =
        String(
          req.body.title || ""
        )
          .trim()
          .slice(0, 150);

      const category =
        String(
          req.body.category || "Община"
        )
          .trim()
          .slice(0, 100);

      const insertPhoto =
        db.prepare(`
          INSERT INTO gallery (
            image,
            title,
            category,
            published
          )
          VALUES (?, ?, ?, 1)
        `);

      const selectPhoto =
        db.prepare(`
          SELECT *
          FROM gallery
          WHERE id = ?
        `);

      const insertMany =
        db.transaction(
          (uploadedFiles) => {
            return uploadedFiles.map(
              (file) => {
                const imagePath =
                  `/uploads/gallery/${file.filename}`;

                const result =
                  insertPhoto.run(
                    imagePath,
                    title,
                    category
                  );

                const row =
                  selectPhoto.get(
                    result.lastInsertRowid
                  );

                return normalizeGalleryItem(
                  row
                );
              }
            );
          }
        );

      const createdItems =
        insertMany(files);

      return res
        .status(201)
        .json(createdItems);
    } catch (error) {
      console.error(
        "Ошибка загрузки фотографий:",
        error
      );

      /*
        Если запись в базу не удалась,
        удаляем уже загруженные файлы.
      */
      const files =
        Array.isArray(req.files)
          ? req.files
          : [];

      files.forEach((file) => {
        try {
          if (
            file.path &&
            fs.existsSync(file.path)
          ) {
            fs.unlinkSync(file.path);
          }
        } catch (unlinkError) {
          console.error(
            "Не удалось удалить файл после ошибки:",
            unlinkError
          );
        }
      });

      return res.status(500).json({
        error:
          "Не удалось сохранить фотографии."
      });
    }
  }
);

/* =========================
   ИЗМЕНЕНИЕ ФОТОГРАФИИ
========================= */

app.put(
  "/api/admin/gallery/:id",
  (req, res) => {
    try {
      const galleryId =
        Number(req.params.id);

      if (
        !Number.isInteger(galleryId) ||
        galleryId <= 0
      ) {
        return res.status(400).json({
          error:
            "Некорректный ID фотографии."
        });
      }

      const existingItem = db
        .prepare(`
          SELECT *
          FROM gallery
          WHERE id = ?
        `)
        .get(galleryId);

      if (!existingItem) {
        return res.status(404).json({
          error:
            "Фотография не найдена."
        });
      }

      const title =
        String(
          req.body.title ??
          existingItem.title ??
          ""
        )
          .trim()
          .slice(0, 150);

      const category =
        String(
          req.body.category ??
          existingItem.category ??
          "Община"
        )
          .trim()
          .slice(0, 100);

      const published =
        req.body.published !== false;

      db.prepare(`
        UPDATE gallery
        SET
          title = ?,
          category = ?,
          published = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title,
        category,
        published ? 1 : 0,
        galleryId
      );

      const updatedItem = db
        .prepare(`
          SELECT *
          FROM gallery
          WHERE id = ?
        `)
        .get(galleryId);

      return res.json(
        normalizeGalleryItem(
          updatedItem
        )
      );
    } catch (error) {
      console.error(
        "Ошибка изменения фотографии:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось изменить фотографию."
      });
    }
  }
);

/* =========================
   УДАЛЕНИЕ ФОТОГРАФИИ
========================= */

app.delete(
  "/api/admin/gallery/:id",
  (req, res) => {
    try {
      const galleryId =
        Number(req.params.id);

      if (
        !Number.isInteger(galleryId) ||
        galleryId <= 0
      ) {
        return res.status(400).json({
          error:
            "Некорректный ID фотографии."
        });
      }

      const item = db
        .prepare(`
          SELECT *
          FROM gallery
          WHERE id = ?
        `)
        .get(galleryId);

      if (!item) {
        return res.status(404).json({
          error:
            "Фотография не найдена."
        });
      }

      db.prepare(`
        DELETE FROM gallery
        WHERE id = ?
      `).run(galleryId);

      if (
        item.image &&
        item.image.startsWith(
          "/uploads/gallery/"
        )
      ) {
        const filename =
          path.basename(item.image);

        const filePath =
          path.join(
            galleryUploadsDirectory,
            filename
          );

        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (unlinkError) {
          console.error(
            "Не удалось удалить файл галереи:",
            unlinkError
          );
        }
      }

      return res.status(204).send();
    } catch (error) {
      console.error(
        "Ошибка удаления фотографии:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось удалить фотографию."
      });
    }
  }
);

/* =========================
   ОТПРАВКА МОЛИТВЕННОГО ЗАПРОСА
========================= */

app.post(
  "/api/prayer-requests",
  (req, res) => {
    try {
      const name =
        String(
          req.body.name || ""
        )
          .trim()
          .slice(0, 120);

      const contact =
        String(
          req.body.contact || ""
        )
          .trim()
          .slice(0, 200);

      const requestText =
        String(
          req.body.request || ""
        ).trim();

      const anonymous =
        req.body.anonymous === true;

      if (requestText.length < 10) {
        return res.status(400).json({
          error:
            "Молитвенный запрос должен содержать минимум 10 символов."
        });
      }

      if (requestText.length > 2000) {
        return res.status(400).json({
          error:
            "Молитвенный запрос слишком длинный."
        });
      }

      const savedName =
        anonymous ? "" : name;

      const result = db
        .prepare(`
          INSERT INTO prayer_requests (
            name,
            contact,
            request_text,
            anonymous,
            status
          )
          VALUES (?, ?, ?, ?, 'new')
        `)
        .run(
          savedName,
          contact,
          requestText,
          anonymous ? 1 : 0
        );

      const createdRequest = db
        .prepare(`
          SELECT *
          FROM prayer_requests
          WHERE id = ?
        `)
        .get(result.lastInsertRowid);

      return res
        .status(201)
        .json({
          message:
            "Молитвенный запрос успешно отправлен.",

          request:
            normalizePrayerRequest(
              createdRequest
            )
        });
    } catch (error) {
      console.error(
        "Ошибка отправки молитвенного запроса:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось отправить молитвенный запрос."
      });
    }
  }
);

/* =========================
   МОЛИТВЕННЫЕ ЗАПРОСЫ В АДМИНКЕ
========================= */

app.get(
  "/api/admin/prayer-requests",
  (req, res) => {
    try {
      const rows = db
        .prepare(`
          SELECT *
          FROM prayer_requests
          ORDER BY
            CASE
              WHEN status = 'new'
              THEN 0
              ELSE 1
            END,
            created_at DESC,
            id DESC
        `)
        .all();

      return res.json(
        rows.map(
          normalizePrayerRequest
        )
      );
    } catch (error) {
      console.error(
        "Ошибка загрузки молитвенных запросов:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось загрузить молитвенные запросы."
      });
    }
  }
);

/* =========================
   ИЗМЕНЕНИЕ СТАТУСА ЗАПРОСА
========================= */

app.patch(
  "/api/admin/prayer-requests/:id/status",
  (req, res) => {
    try {
      const requestId =
        Number(req.params.id);

      const status =
        String(
          req.body.status || ""
        ).trim();

      if (
        !Number.isInteger(requestId) ||
        requestId <= 0
      ) {
        return res.status(400).json({
          error:
            "Некорректный ID запроса."
        });
      }

      if (
        status !== "new" &&
        status !== "read"
      ) {
        return res.status(400).json({
          error:
            "Некорректный статус запроса."
        });
      }

      const existingRequest = db
        .prepare(`
          SELECT id
          FROM prayer_requests
          WHERE id = ?
        `)
        .get(requestId);

      if (!existingRequest) {
        return res.status(404).json({
          error:
            "Молитвенный запрос не найден."
        });
      }

      db.prepare(`
        UPDATE prayer_requests
        SET
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        status,
        requestId
      );

      const updatedRequest = db
        .prepare(`
          SELECT *
          FROM prayer_requests
          WHERE id = ?
        `)
        .get(requestId);

      return res.json(
        normalizePrayerRequest(
          updatedRequest
        )
      );
    } catch (error) {
      console.error(
        "Ошибка изменения статуса запроса:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось изменить статус запроса."
      });
    }
  }
);

/* =========================
   УДАЛЕНИЕ МОЛИТВЕННОГО ЗАПРОСА
========================= */

app.delete(
  "/api/admin/prayer-requests/:id",
  (req, res) => {
    try {
      const requestId =
        Number(req.params.id);

      if (
        !Number.isInteger(requestId) ||
        requestId <= 0
      ) {
        return res.status(400).json({
          error:
            "Некорректный ID запроса."
        });
      }

      const result = db
        .prepare(`
          DELETE FROM prayer_requests
          WHERE id = ?
        `)
        .run(requestId);

      if (result.changes === 0) {
        return res.status(404).json({
          error:
            "Молитвенный запрос не найден."
        });
      }

      return res.status(204).send();
    } catch (error) {
      console.error(
        "Ошибка удаления молитвенного запроса:",
        error
      );

      return res.status(500).json({
        error:
          "Не удалось удалить молитвенный запрос."
      });
    }
  }
);

/* =========================
   АНАЛИТИКА
========================= */

app.post(
  "/api/analytics/track",
  (req, res) => {
    try {

      const sessionId =
        String(
          req.body.sessionId || ""
        ).trim();

      const pagePath =
        String(
          req.body.pagePath || ""
        ).trim();

      const pageTitle =
        String(
          req.body.pageTitle || ""
        )
          .trim()
          .slice(0, 250);

      const referrer =
        String(
          req.body.referrer || ""
        )
          .trim()
          .slice(0, 500);

      const allowedDevices =
        new Set([
          "desktop",
          "mobile",
          "tablet"
        ]);

      const deviceType =
        allowedDevices.has(
          req.body.deviceType
        )
          ? req.body.deviceType
          : "desktop";

      if (
        !sessionId ||
        !pagePath
      ) {
        return res
          .status(400)
          .json({
            error:
              "Некорректные данные."
          });
      }

      /*
        Не считаем админку.
      */

      if (
        pagePath.startsWith("/admin/")
      ) {
        return res
          .status(204)
          .send();
      }

      db.prepare(`
        INSERT INTO analytics_pageviews (
          session_id,
          page_path,
          page_title,
          referrer,
          device_type
        )
        VALUES (?, ?, ?, ?, ?)
      `).run(
        sessionId,
        pagePath,
        pageTitle,
        referrer,
        deviceType
      );

      return res
        .status(204)
        .send();

    } catch (error) {

      console.error(
        "Ошибка аналитики:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Не удалось сохранить аналитику."
        });

    }
  }
);

/* =========================
   СВОДНАЯ АНАЛИТИКА
========================= */

app.get(
  "/api/admin/analytics/summary",
  (req, res) => {

    try {

      const today =
        db.prepare(`
          SELECT

            COUNT(*) AS pageviews,

            COUNT(
              DISTINCT session_id
            ) AS visitors

          FROM analytics_pageviews

          WHERE DATE(
            created_at,
            'localtime'
          ) =
          DATE(
            'now',
            'localtime'
          )
        `).get();

      const online =
        db.prepare(`
          SELECT

            COUNT(
              DISTINCT session_id
            ) AS online

          FROM analytics_pageviews

          WHERE datetime(
            created_at
          ) >= datetime(
            'now',
            '-5 minutes'
          )
        `).get();

      const total =
        db.prepare(`
          SELECT

            COUNT(*) AS pageviews,

            COUNT(
              DISTINCT session_id
            ) AS visitors

          FROM analytics_pageviews
        `).get();

      const devices =
        db.prepare(`
          SELECT

            device_type AS device,

            COUNT(*) AS views

          FROM analytics_pageviews

          WHERE datetime(
            created_at
          ) >= datetime(
            'now',
            '-30 days'
          )

          GROUP BY device_type

          ORDER BY views DESC
        `).all();

      const topPages =
        db.prepare(`
          SELECT

            page_path AS path,

            MAX(page_title)
              AS title,

            COUNT(*) AS views,

            COUNT(
              DISTINCT session_id
            ) AS visitors

          FROM analytics_pageviews

          GROUP BY page_path

          ORDER BY views DESC

          LIMIT 10
        `).all();

      const visitsByDay =
        db.prepare(`
          SELECT

            DATE(
              created_at,
              'localtime'
            ) AS date,

            COUNT(*) AS pageviews,

            COUNT(
              DISTINCT session_id
            ) AS visitors

          FROM analytics_pageviews

          WHERE datetime(
            created_at
          ) >= datetime(
            'now',
            '-29 days'
          )

          GROUP BY DATE(
            created_at,
            'localtime'
          )

          ORDER BY date ASC
        `).all();

      return res.json({

        today: {

          visitors:
            Number(
              today.visitors
            ) || 0,

          pageviews:
            Number(
              today.pageviews
            ) || 0,

          online:
            Number(
              online.online
            ) || 0

        },

        total: {

          visitors:
            Number(
              total.visitors
            ) || 0,

          pageviews:
            Number(
              total.pageviews
            ) || 0

        },

        devices:
          devices.map(
            device => ({

              device:
                device.device,

              views:
                Number(
                  device.views
                ) || 0

            })
          ),

        topPages:
          topPages.map(
            page => ({

              path:
                page.path,

              title:
                page.title,

              views:
                Number(
                  page.views
                ) || 0,

              visitors:
                Number(
                  page.visitors
                ) || 0

            })
          ),

        visitsByDay:
          visitsByDay.map(
            day => ({

              date:
                day.date,

              pageviews:
                Number(
                  day.pageviews
                ) || 0,

              visitors:
                Number(
                  day.visitors
                ) || 0

            })
          )

      });

    } catch (error) {

      console.error(
        "Ошибка аналитики:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Не удалось загрузить аналитику."
        });

    }

  }
);

/* =========================
   РЕЗЕРВНЫЕ КОПИИ БАЗЫ
========================= */

const databaseFilePath =
  path.join(__dirname, "church.db");

const backupsDirectory =
  path.join(__dirname, "backups");

const BACKUP_INTERVAL_MS =
  24 * 60 * 60 * 1000;

const BACKUP_RETENTION_DAYS = 30;

fs.mkdirSync(backupsDirectory, {
  recursive: true
});

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function createBackupFilename(date) {
  const year =
    date.getFullYear();

  const month =
    padDatePart(date.getMonth() + 1);

  const day =
    padDatePart(date.getDate());

  const hours =
    padDatePart(date.getHours());

  const minutes =
    padDatePart(date.getMinutes());

  const seconds =
    padDatePart(date.getSeconds());

  return (
    `church-${year}-${month}-${day}` +
    `_${hours}-${minutes}-${seconds}.db`
  );
}

async function createDatabaseBackup() {
  try {
    if (!fs.existsSync(databaseFilePath)) {
      console.warn(
        "Резервная копия не создана: " +
        "файл church.db не найден."
      );

      return;
    }

    const backupFilename =
      createBackupFilename(new Date());

    const backupPath =
      path.join(
        backupsDirectory,
        backupFilename
      );

    /*
      SQLite backup API создаёт согласованную
      копию даже во время работы базы.
    */
    await db.backup(backupPath);

    console.log(
      `Резервная копия создана: ${backupFilename}`
    );

    cleanupOldBackups();
  } catch (error) {
    console.error(
      "Ошибка создания резервной копии:",
      error
    );
  }
}

function cleanupOldBackups() {
  try {
    const files =
      fs.readdirSync(
        backupsDirectory,
        {
          withFileTypes: true
        }
      );

    const expirationTime =
      Date.now() -
      BACKUP_RETENTION_DAYS *
      24 *
      60 *
      60 *
      1000;

    files.forEach((entry) => {
      if (
        !entry.isFile() ||
        !entry.name.endsWith(".db")
      ) {
        return;
      }

      const filePath =
        path.join(
          backupsDirectory,
          entry.name
        );

      const stats =
        fs.statSync(filePath);

      if (
        stats.mtimeMs <
        expirationTime
      ) {
        fs.unlinkSync(filePath);

        console.log(
          `Старая копия удалена: ${entry.name}`
        );
      }
    });
  } catch (error) {
    console.error(
      "Ошибка очистки резервных копий:",
      error
    );
  }
}

/* =========================
   ПРОВЕРКА РАБОТЫ СЕРВЕРА
========================= */

app.get(
  "/api/health",
  (req, res) => {
    return res.json({
      status: "ok",
      time: new Date().toISOString()
    });
  }
);

/* =========================
   ОБРАБОТКА НЕИЗВЕСТНЫХ API
========================= */

app.use(
  "/api",
  (req, res) => {
    return res.status(404).json({
      error:
        "Запрашиваемый API-адрес не найден."
    });
  }
);

/* =========================
   ОБРАБОТКА ОШИБОК
========================= */

app.use(
  (error, req, res, next) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          error:
            "Фотография слишком большая. " +
            "Максимальный размер — 5 МБ."
        });
      }

      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res.status(400).json({
          error:
            "Можно загрузить максимум " +
            "20 фотографий за один раз."
        });
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({
          error:
            "Получено неожиданное поле файла."
        });
      }

      console.error(
        "Ошибка Multer:",
        error
      );

      return res.status(400).json({
        error:
          "Не удалось загрузить фотографию."
      });
    }

    if (
      error?.message ===
      "Разрешены только JPG, PNG и WEBP."
    ) {
      return res.status(400).json({
        error: error.message
      });
    }

    if (
      error?.type ===
      "entity.too.large"
    ) {
      return res.status(413).json({
        error:
          "Отправленные данные слишком большие."
      });
    }

    if (
      error instanceof SyntaxError &&
      error.status === 400 &&
      "body" in error
    ) {
      return res.status(400).json({
        error:
          "Сервер получил некорректный JSON."
      });
    }

    console.error(
      "Необработанная ошибка сервера:",
      error
    );

    return res.status(500).json({
      error:
        "Внутренняя ошибка сервера."
    });
  }
);

/* =========================
   ЗАПУСК СЕРВЕРА
========================= */

const server = app.listen(
  PORT,
  () => {
    console.log(
      `Сайт запущен: http://localhost:${PORT}`
    );

    console.log(
      `Админка: http://localhost:${PORT}/admin/login.html`
    );

    console.log(
      `Проверка сервера: http://localhost:${PORT}/api/health`
    );

    /*
      Создаём резервную копию
      после запуска сервера.
    */
    createDatabaseBackup();

    /*
      Затем создаём копию
      один раз каждые 24 часа.
    */
    setInterval(
      createDatabaseBackup,
      BACKUP_INTERVAL_MS
    ).unref();
  }
);

/* =========================
   КОРРЕКТНОЕ ЗАВЕРШЕНИЕ
========================= */

function shutdownServer(signal) {
  console.log(
    `Получен сигнал ${signal}. Завершаем работу...`
  );

  server.close(async () => {
    try {
      /*
        Создаём последнюю копию
        перед остановкой сервера.
      */
      await createDatabaseBackup();

      sessionsDatabase.close();

      /*
        Основную базу закрываем,
        если объект поддерживает close().
      */
      if (
        db &&
        typeof db.close === "function"
      ) {
        db.close();
      }

      console.log(
        "Сервер и базы данных закрыты."
      );

      process.exit(0);
    } catch (error) {
      console.error(
        "Ошибка при завершении сервера:",
        error
      );

      process.exit(1);
    }
  });

  /*
    Если сервер завис, принудительно
    завершаем процесс через 10 секунд.
  */
  setTimeout(() => {
    console.error(
      "Принудительное завершение сервера."
    );

    process.exit(1);
  }, 10000).unref();
}

process.on(
  "SIGINT",
  () => shutdownServer("SIGINT")
);

process.on(
  "SIGTERM",
  () => shutdownServer("SIGTERM")
);

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "Необработанный Promise:",
      reason
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Необработанная ошибка Node.js:",
      error
    );
  }
);