const temporaryAdminAccess =
  sessionStorage.getItem("temporaryAdminAccess");

if (temporaryAdminAccess !== "true") {
  window.location.href = "login.html";
}

const NEWS_API_URL = "/api/admin/news";

/* =========================
   SIDEBAR
========================= */

const adminMenuButton =
  document.getElementById("adminMenuButton");

const adminSidebar =
  document.getElementById("adminSidebar");

const adminSidebarClose =
  document.getElementById("adminSidebarClose");

const adminSidebarOverlay =
  document.getElementById("adminSidebarOverlay");

const adminLogoutButton =
  document.getElementById("adminLogoutButton");

function openAdminSidebar() {
  adminSidebar?.classList.add("active");
  adminSidebarOverlay?.classList.add("active");
  document.body.classList.add("admin-body-locked");
}

function closeAdminSidebar() {
  adminSidebar?.classList.remove("active");
  adminSidebarOverlay?.classList.remove("active");
  document.body.classList.remove("admin-body-locked");
}

adminMenuButton?.addEventListener(
  "click",
  openAdminSidebar
);

adminSidebarClose?.addEventListener(
  "click",
  closeAdminSidebar
);

adminSidebarOverlay?.addEventListener(
  "click",
  closeAdminSidebar
);

adminLogoutButton?.addEventListener("click", () => {
  sessionStorage.removeItem("temporaryAdminAccess");
  window.location.href = "login.html";
});

/* =========================
   QUILL
========================= */

const quill = new Quill("#newsEditor", {
  theme: "snow",

  placeholder:
    "Напишите полный текст новости...",

  modules: {
    toolbar: [
      [
        {
          header: [2, 3, false]
        }
      ],

      ["bold", "italic", "underline"],

      [
        {
          list: "ordered"
        },
        {
          list: "bullet"
        }
      ],

      ["blockquote", "link"],

      [
        {
          align: []
        }
      ],

      ["clean"]
    ]
  }
});

/* =========================
   ЭЛЕМЕНТЫ
========================= */

const openNewsFormButton =
  document.getElementById("openNewsFormButton");

const newsFormSection =
  document.getElementById("newsFormSection");

const closeNewsFormButton =
  document.getElementById("closeNewsFormButton");

const cancelNewsButton =
  document.getElementById("cancelNewsButton");

const newsForm =
  document.getElementById("newsForm");

const newsId =
  document.getElementById("newsId");

const newsTitle =
  document.getElementById("newsTitle");

const newsCategory =
  document.getElementById("newsCategory");

const newsDate =
  document.getElementById("newsDate");

const newsAuthor =
  document.getElementById("newsAuthor");

const newsImage =
  document.getElementById("newsImage");

const newsImageFile =
  document.getElementById("newsImageFile");

const newsExcerpt =
  document.getElementById("newsExcerpt");

const newsPublished =
  document.getElementById("newsPublished");

const newsFormError =
  document.getElementById("newsFormError");

const newsFormLabel =
  document.getElementById("newsFormLabel");

const newsFormTitle =
  document.getElementById("newsFormTitle");

const newsExcerptCounter =
  document.getElementById("newsExcerptCounter");

const newsImagePreview =
  document.getElementById("newsImagePreview");

const newsPreviewImage =
  document.getElementById("newsPreviewImage");

const adminNewsList =
  document.getElementById("adminNewsList");

const newsEmptyState =
  document.getElementById("newsEmptyState");

const newsCount =
  document.getElementById("newsCount");

const deleteNewsModal =
  document.getElementById("deleteNewsModal");

const cancelDeleteNewsButton =
  document.getElementById("cancelDeleteNewsButton");

const confirmDeleteNewsButton =
  document.getElementById("confirmDeleteNewsButton");

let newsItems = [];
let newsIdToDelete = null;
let formIsSubmitting = false;

/* =========================
   API
========================= */

async function readErrorMessage(response) {
  try {
    const data = await response.json();

    return data.error || "Произошла ошибка.";
  } catch {
    return "Произошла ошибка.";
  }
}

async function apiGetNews() {
  const response = await fetch(NEWS_API_URL);

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  return response.json();
}

async function apiCreateNews(data) {
  const response = await fetch(NEWS_API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  return response.json();
}

async function apiUpdateNews(id, data) {
  const response = await fetch(
    `${NEWS_API_URL}/${encodeURIComponent(id)}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  return response.json();
}

async function apiDeleteNews(id) {
  const response = await fetch(
    `${NEWS_API_URL}/${encodeURIComponent(id)}`,
    {
      method: "DELETE"
    }
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }
}
async function apiUploadNewsImage(file) {
  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch(
    "/api/admin/uploads/news",
    {
      method: "POST",
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  return response.json();
}
/* =========================
   ПОМОЩНИКИ
========================= */

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

function getEditorHtml() {
  return quill.root.innerHTML.trim();
}

function getEditorText() {
  return quill.getText().trim();
}

function setSubmitState(isSubmitting) {
  formIsSubmitting = isSubmitting;

  const button =
    newsForm.querySelector(
      'button[type="submit"]'
    );

  button.disabled = isSubmitting;

  button.textContent = isSubmitting
    ? "Сохранение..."
    : "Сохранить новость";
}

/* =========================
   ЗАГРУЗКА
========================= */

async function loadNews() {
  adminNewsList.innerHTML = `
    <div class="admin-empty-state">
      <div>…</div>
      <h3>Загрузка</h3>
      <p>Получаем новости с сервера...</p>
    </div>
  `;

  try {
    newsItems = await apiGetNews();

    if (!Array.isArray(newsItems)) {
      newsItems = [];
    }

    renderNews();
  } catch (error) {
    console.error(error);

    newsCount.textContent = "0";

    adminNewsList.innerHTML = `
      <div class="admin-empty-state">
        <div>!</div>
        <h3>Ошибка загрузки</h3>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

function renderNews() {
  newsCount.textContent =
    String(newsItems.length);

  if (newsItems.length === 0) {
    adminNewsList.innerHTML = "";
    newsEmptyState.hidden = false;
    return;
  }

  newsEmptyState.hidden = true;

  adminNewsList.innerHTML = newsItems
    .map((item) => {
      return `
        <article class="admin-news-card">

          <div class="admin-news-image">
            ${
              item.image
                ? `
                  <img
                    src="${escapeHtml(item.image)}"
                    alt="${escapeHtml(item.title)}"
                  >
                `
                : `
                  <div class="admin-news-placeholder">
                    ▤
                  </div>
                `
            }
          </div>

          <div class="admin-news-card-content">

            <div class="admin-news-card-topline">
              <span class="admin-event-status ${
                item.published
                  ? "published"
                  : "hidden"
              }">
                ${
                  item.published
                    ? "Опубликовано"
                    : "Скрыто"
                }
              </span>

              <time>
                ${escapeHtml(
                  formatNewsDate(item.date)
                )}
              </time>
            </div>

            ${
              item.category
                ? `
                  <span class="admin-news-category">
                    ${escapeHtml(item.category)}
                  </span>
                `
                : ""
            }

            <h3>
              ${escapeHtml(item.title)}
            </h3>

            <p>
              ${escapeHtml(item.excerpt)}
            </p>

            <div class="admin-news-actions">

              <button
                class="admin-edit-button"
                type="button"
                data-action="edit"
                data-id="${item.id}"
              >
                Изменить
              </button>

              <button
                class="admin-delete-button"
                type="button"
                data-action="delete"
                data-id="${item.id}"
              >
                Удалить
              </button>

            </div>

          </div>

        </article>
      `;
    })
    .join("");

  adminNewsList
    .querySelectorAll("[data-action]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;

        if (button.dataset.action === "edit") {
          openEditForm(id);
        }

        if (button.dataset.action === "delete") {
          openDeleteModal(id);
        }
      });
    });
}

/* =========================
   ФОРМА
========================= */

function resetNewsForm() {
  newsForm.reset();

  newsId.value = "";
  newsImage.value = "";
  newsImageFile.value = "";
  newsPublished.checked = true;

  quill.setText("");

  newsFormError.textContent = "";
  newsFormLabel.textContent =
    "Новая публикация";
  newsFormTitle.textContent =
    "Добавить новость";

  newsImagePreview.hidden = true;
  newsPreviewImage.src = "";

  newsExcerptCounter.textContent =
    "0 / 500";

  setSubmitState(false);
}

function openCreateForm() {
  resetNewsForm();

  const today =
    new Date().toISOString().split("T")[0];

  newsDate.value = today;

  newsFormSection.hidden = false;

  newsFormSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function closeNewsForm() {
  if (formIsSubmitting) return;

  newsFormSection.hidden = true;
  resetNewsForm();
}

function openEditForm(id) {
  const item = newsItems.find(
    (newsItem) =>
      String(newsItem.id) === String(id)
  );

  if (!item) return;

  newsId.value = item.id;
  newsTitle.value = item.title || "";
  newsCategory.value = item.category || "";
  newsDate.value = item.date || "";
  newsAuthor.value = item.author || "";
  newsImage.value = item.image || "";
  newsExcerpt.value = item.excerpt || "";
  newsPublished.checked =
    Boolean(item.published);

  quill.clipboard.dangerouslyPasteHTML(
    item.content || ""
  );

  newsExcerptCounter.textContent =
    `${newsExcerpt.value.length} / 500`;

  updateImagePreview();

  newsFormLabel.textContent =
    "Редактирование";
  newsFormTitle.textContent =
    "Изменить новость";

  newsFormSection.hidden = false;

  newsFormSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

openNewsFormButton.addEventListener(
  "click",
  openCreateForm
);

closeNewsFormButton.addEventListener(
  "click",
  closeNewsForm
);

cancelNewsButton.addEventListener(
  "click",
  closeNewsForm
);

newsExcerpt.addEventListener("input", () => {
  newsExcerptCounter.textContent =
    `${newsExcerpt.value.length} / 500`;
});

function updateImagePreview() {
  const imagePath = newsImage.value.trim();

  if (!imagePath) {
    newsImagePreview.hidden = true;
    newsPreviewImage.src = "";
    return;
  }

  newsPreviewImage.src = imagePath;
  newsImagePreview.hidden = false;
}

newsImageFile?.addEventListener(
  "change",
  async () => {
    const file = newsImageFile.files[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Выберите фотографию JPG, PNG или WEBP."
      );

      newsImageFile.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Фотография слишком большая. Максимум 5 МБ."
      );

      newsImageFile.value = "";
      return;
    }

    newsImageFile.disabled = true;

    try {
      const result =
        await apiUploadNewsImage(file);

      newsImage.value = result.image;

      updateImagePreview();
    } catch (error) {
      console.error(
        "Ошибка загрузки фотографии:",
        error
      );

      alert(
        error.message ||
        "Не удалось загрузить фотографию."
      );

      newsImage.value = "";
      newsImageFile.value = "";
      updateImagePreview();
    } finally {
      newsImageFile.disabled = false;
    }
  }
);

newsPreviewImage.addEventListener(
  "error",
  () => {
    newsImagePreview.hidden = true;
  }
);

newsForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (formIsSubmitting) return;

    const data = {
  title: newsTitle?.value.trim() || "",
  category: newsCategory?.value || "",
  date: newsDate?.value || "",
  author: newsAuthor?.value.trim() || "",
  image: newsImage?.value.trim() || "",
  excerpt: newsExcerpt?.value.trim() || "",
  content: getEditorHtml(),
  published: newsPublished?.checked ?? true
};

    newsFormError.textContent = "";

    if (
      !data.title ||
      !data.date ||
      !data.excerpt ||
      getEditorText().length < 10
    ) {
      newsFormError.textContent =
        "Заполните заголовок, дату, краткое описание и полный текст.";
      return;
    }

    setSubmitState(true);

    try {
      if (newsId.value) {
        await apiUpdateNews(
          newsId.value,
          data
        );
      } else {
        await apiCreateNews(data);
      }

      await loadNews();
      closeNewsForm();
    } catch (error) {
      console.error(error);

      newsFormError.textContent =
        error.message ||
        "Не удалось сохранить новость.";
    } finally {
      setSubmitState(false);
    }
  }
);

/* =========================
   УДАЛЕНИЕ
========================= */

function openDeleteModal(id) {
  newsIdToDelete = id;

  deleteNewsModal.classList.add("active");

  deleteNewsModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "admin-body-locked"
  );
}

function closeDeleteModal() {
  newsIdToDelete = null;

  deleteNewsModal.classList.remove("active");

  deleteNewsModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "admin-body-locked"
  );
}

cancelDeleteNewsButton.addEventListener(
  "click",
  closeDeleteModal
);

confirmDeleteNewsButton.addEventListener(
  "click",
  async () => {
    if (!newsIdToDelete) return;

    confirmDeleteNewsButton.disabled = true;
    confirmDeleteNewsButton.textContent =
      "Удаление...";

    try {
      await apiDeleteNews(newsIdToDelete);
      await loadNews();
      closeDeleteModal();
    } catch (error) {
      alert(
        error.message ||
        "Не удалось удалить новость."
      );
    } finally {
      confirmDeleteNewsButton.disabled = false;
      confirmDeleteNewsButton.textContent =
        "Удалить";
    }
  }
);

deleteNewsModal.addEventListener(
  "click",
  (event) => {
    if (event.target === deleteNewsModal) {
      closeDeleteModal();
    }
  }
);

loadNews();