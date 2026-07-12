const newsList =
  document.getElementById("newsList");

const newsEmpty =
  document.getElementById("newsEmpty");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNewsDate(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function getImagePath(image) {
  const value = String(image || "").trim();

  if (!value) {
    return "images/news-placeholder.jpg";
  }

  return value;
}

async function loadNews() {
  if (!newsList) return;

  try {
    const response = await fetch("/api/news", {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      let message =
        "Не удалось загрузить новости.";

      try {
        const errorData =
          await response.json();

        if (errorData.error) {
          message = errorData.error;
        }
      } catch {
        // Сервер вернул не JSON.
      }

      throw new Error(message);
    }

    const result = await response.json();

    const newsItems =
      Array.isArray(result) ? result : [];

    if (newsItems.length === 0) {
      newsList.innerHTML = "";
      newsEmpty.hidden = false;
      return;
    }

    newsEmpty.hidden = true;

    newsList.innerHTML = newsItems
      .map((item) => {
        return `
          <article class="news-card">

            <a
              href="news-detail.html?id=${encodeURIComponent(item.id)}"
              class="news-image-link"
            >
              <img
                src="${escapeHtml(getImagePath(item.image))}"
                alt="${escapeHtml(item.title)}"
                loading="lazy"
              >

              ${
                item.category
                  ? `
                    <span class="news-category">
                      ${escapeHtml(item.category)}
                    </span>
                  `
                  : ""
              }
            </a>

            <div class="news-content">

              <time datetime="${escapeHtml(item.date)}">
                ${escapeHtml(
                  formatNewsDate(item.date)
                )}
              </time>

              <h2>
                <a
                  href="news-detail.html?id=${encodeURIComponent(item.id)}"
                >
                  ${escapeHtml(item.title)}
                </a>
              </h2>

              <p>
                ${escapeHtml(item.excerpt)}
              </p>

              <a
                href="news-detail.html?id=${encodeURIComponent(item.id)}"
                class="news-read-more"
              >
                Читать подробнее →
              </a>

            </div>

          </article>
        `;
      })
      .join("");

  } catch (error) {
    console.error(
      "Ошибка загрузки новостей:",
      error
    );

    newsList.innerHTML = `
      <div class="news-error">
        <h2>Не удалось загрузить новости</h2>

        <p>
          ${escapeHtml(
            error.message ||
            "Проверьте подключение к серверу."
          )}
        </p>
      </div>
    `;
  }
}

loadNews();