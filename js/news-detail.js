const newsDetail =
  document.getElementById("newsDetail");

const relatedNewsSection =
  document.getElementById(
    "relatedNewsSection"
  );

const relatedNewsGrid =
  document.getElementById(
    "relatedNewsGrid"
  );

const params =
  new URLSearchParams(
    window.location.search
  );

const newsId =
  Number(params.get("id"));

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

/*
  Контент приходит из редактора Quill как HTML.
  В админке этот HTML создаёт доверенный администратор.

  Позже при настоящей публичной авторизации
  лучше дополнительно очищать HTML на сервере.
*/
function renderTrustedContent(html) {
  return String(html || "");
}

async function readErrorMessage(response) {
  try {
    const data = await response.json();

    return data.error || "Произошла ошибка.";
  } catch {
    return "Произошла ошибка.";
  }
}

async function loadCurrentNews() {
  if (
    !Number.isInteger(newsId) ||
    newsId <= 0
  ) {
    showNotFound(
      "Некорректная ссылка на новость."
    );
    return;
  }

  try {
    const response =
      await fetch(`/api/news/${newsId}`, {
        headers: {
          Accept: "application/json"
        }
      });

    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response)
      );
    }

    const item = await response.json();

    document.title =
      `${item.title} | Philadelphia`;

    newsDetail.innerHTML = `
      <div class="news-detail-image">
        <img
          src="${escapeHtml(
            getImagePath(item.image)
          )}"
          alt="${escapeHtml(item.title)}"
        >

        ${
          item.category
            ? `
              <span>
                ${escapeHtml(item.category)}
              </span>
            `
            : ""
        }
      </div>

      <div class="news-detail-content">

        <div class="news-detail-meta">

          <time datetime="${escapeHtml(item.date)}">
            ${escapeHtml(
              formatNewsDate(item.date)
            )}
          </time>

          ${
            item.author
              ? `
                <span>
                  Автор: ${escapeHtml(item.author)}
                </span>
              `
              : ""
          }

        </div>

        <h1>
          ${escapeHtml(item.title)}
        </h1>

        <p class="news-detail-lead">
          ${escapeHtml(item.excerpt)}
        </p>

        <div class="news-detail-text ql-content">
          ${renderTrustedContent(item.content)}
        </div>

        <div class="news-detail-actions">

          <button
            type="button"
            class="news-share-button"
            id="shareNewsButton"
          >
            Поделиться
          </button>

          <a
            href="news.html"
            class="news-back-btn"
          >
            ← Все новости
          </a>

        </div>

      </div>
    `;

    setupShareButton(item);
    loadRelatedNews(item.id);

  } catch (error) {
    console.error(
      "Ошибка загрузки новости:",
      error
    );

    showNotFound(
      error.message ||
      "Не удалось загрузить новость."
    );
  }
}

function showNotFound(message) {
  newsDetail.innerHTML = `
    <section class="news-not-found">
      <h1>Новость не найдена</h1>

      <p>
        ${escapeHtml(message)}
      </p>

      <a
        href="news.html"
        class="news-back-btn"
      >
        Вернуться к новостям
      </a>
    </section>
  `;
}

function setupShareButton(item) {
  const shareNewsButton =
    document.getElementById(
      "shareNewsButton"
    );

  if (!shareNewsButton) return;

  shareNewsButton.addEventListener(
    "click",
    async () => {
      const shareData = {
        title: item.title,
        text: item.excerpt,
        url: window.location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
          return;
        }

        await navigator.clipboard.writeText(
          window.location.href
        );

        shareNewsButton.textContent =
          "Ссылка скопирована";

        setTimeout(() => {
          shareNewsButton.textContent =
            "Поделиться";
        }, 1600);

      } catch (error) {
        console.error(
          "Ошибка отправки ссылки:",
          error
        );
      }
    }
  );
}

async function loadRelatedNews(currentId) {
  try {
    const response = await fetch("/api/news", {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) return;

    const result = await response.json();

    const related = (
      Array.isArray(result) ? result : []
    )
      .filter(
        (item) =>
          Number(item.id) !== Number(currentId)
      )
      .slice(0, 3);

    if (related.length === 0) {
      return;
    }

    relatedNewsGrid.innerHTML = related
      .map((item) => {
        return `
          <article class="related-news-card">

            <a
              href="news-detail.html?id=${encodeURIComponent(item.id)}"
            >
              <img
                src="${escapeHtml(
                  getImagePath(item.image)
                )}"
                alt="${escapeHtml(item.title)}"
                loading="lazy"
              >
            </a>

            <div>
              <time>
                ${escapeHtml(
                  formatNewsDate(item.date)
                )}
              </time>

              <h3>
                <a
                  href="news-detail.html?id=${encodeURIComponent(item.id)}"
                >
                  ${escapeHtml(item.title)}
                </a>
              </h3>
            </div>

          </article>
        `;
      })
      .join("");

    relatedNewsSection.hidden = false;

  } catch (error) {
    console.error(
      "Ошибка загрузки других новостей:",
      error
    );
  }
}

loadCurrentNews();