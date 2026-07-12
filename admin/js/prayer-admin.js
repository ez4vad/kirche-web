const temporaryAdminAccess =
  sessionStorage.getItem("temporaryAdminAccess");

if (temporaryAdminAccess !== "true") {
  window.location.href = "login.html";
}

const PRAYER_API_URL =
  "/api/admin/prayer-requests";

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

adminLogoutButton?.addEventListener(
  "click",
  () => {
    sessionStorage.removeItem(
      "temporaryAdminAccess"
    );

    window.location.href = "login.html";
  }
);

/* =========================
   ЭЛЕМЕНТЫ
========================= */

const adminPrayerList =
  document.getElementById(
    "adminPrayerList"
  );

const prayerEmptyState =
  document.getElementById(
    "prayerEmptyState"
  );

const prayerCount =
  document.getElementById(
    "prayerCount"
  );

const prayerFilters =
  document.querySelectorAll(
    "[data-prayer-filter]"
  );

const prayerModal =
  document.getElementById(
    "prayerModal"
  );

const closePrayerModalButton =
  document.getElementById(
    "closePrayerModalButton"
  );

const prayerModalStatus =
  document.getElementById(
    "prayerModalStatus"
  );

const prayerModalName =
  document.getElementById(
    "prayerModalName"
  );

const prayerModalContact =
  document.getElementById(
    "prayerModalContact"
  );

const prayerModalDate =
  document.getElementById(
    "prayerModalDate"
  );

const prayerModalText =
  document.getElementById(
    "prayerModalText"
  );

const togglePrayerStatusButton =
  document.getElementById(
    "togglePrayerStatusButton"
  );

const deletePrayerButton =
  document.getElementById(
    "deletePrayerButton"
  );

const deletePrayerModal =
  document.getElementById(
    "deletePrayerModal"
  );

const cancelDeletePrayerButton =
  document.getElementById(
    "cancelDeletePrayerButton"
  );

const confirmDeletePrayerButton =
  document.getElementById(
    "confirmDeletePrayerButton"
  );

/* =========================
   СОСТОЯНИЕ
========================= */

let prayerRequests = [];
let activePrayerFilter = "all";
let activePrayerId = null;
let prayerIdToDelete = null;

/* =========================
   API
========================= */

async function readPrayerError(response) {
  try {
    const data = await response.json();

    return data.error || "Произошла ошибка.";
  } catch {
    return "Произошла ошибка.";
  }
}

async function apiGetPrayerRequests() {
  const response = await fetch(
    PRAYER_API_URL,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      await readPrayerError(response)
    );
  }

  return response.json();
}

async function apiUpdatePrayerStatus(
  id,
  status
) {
  const response = await fetch(
    `${PRAYER_API_URL}/${encodeURIComponent(
      id
    )}/status`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },

      body: JSON.stringify({
        status
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      await readPrayerError(response)
    );
  }

  return response.json();
}

async function apiDeletePrayerRequest(id) {
  const response = await fetch(
    `${PRAYER_API_URL}/${encodeURIComponent(id)}`,
    {
      method: "DELETE"
    }
  );

  if (!response.ok) {
    throw new Error(
      await readPrayerError(response)
    );
  }
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

function formatPrayerDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "";
  }

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}

function getVisiblePrayerRequests() {
  if (activePrayerFilter === "all") {
    return prayerRequests;
  }

  return prayerRequests.filter(
    (item) =>
      item.status === activePrayerFilter
  );
}

/* =========================
   ЗАГРУЗКА
========================= */

async function loadPrayerRequests() {
  adminPrayerList.innerHTML = `
    <div class="admin-empty-state">
      <div>…</div>
      <h3>Загрузка</h3>
      <p>Получаем молитвенные запросы...</p>
    </div>
  `;

  try {
    const result =
      await apiGetPrayerRequests();

    prayerRequests =
      Array.isArray(result)
        ? result
        : [];

    renderPrayerRequests();
  } catch (error) {
    console.error(
      "Ошибка загрузки молитвенных запросов:",
      error
    );

    prayerCount.textContent = "0";

    adminPrayerList.innerHTML = `
      <div class="admin-empty-state">
        <div>!</div>
        <h3>Ошибка загрузки</h3>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

/* =========================
   ОТОБРАЖЕНИЕ
========================= */

function renderPrayerRequests() {
  const visibleItems =
    getVisiblePrayerRequests();

  prayerCount.textContent =
    String(prayerRequests.length);

  if (prayerRequests.length === 0) {
    adminPrayerList.innerHTML = "";
    prayerEmptyState.hidden = false;
    return;
  }

  prayerEmptyState.hidden = true;

  if (visibleItems.length === 0) {
    adminPrayerList.innerHTML = `
      <div class="admin-empty-state">
        <div>♡</div>
        <h3>Нет запросов</h3>
        <p>
          В этой категории пока ничего нет.
        </p>
      </div>
    `;
    return;
  }

  adminPrayerList.innerHTML =
    visibleItems
      .map((item) => {
        const name = item.anonymous
          ? "Анонимно"
          : item.name || "Без имени";

        return `
          <article
            class="admin-prayer-card ${
              item.status === "new"
                ? "new"
                : "read"
            }"
          >

            <div class="admin-prayer-card-top">

              <span
                class="admin-prayer-status ${
                  item.status
                }"
              >
                ${
                  item.status === "new"
                    ? "Новый"
                    : "Прочитан"
                }
              </span>

              <time>
                ${escapeHtml(
                  formatPrayerDate(
                    item.createdAt
                  )
                )}
              </time>

            </div>

            <h3>
              ${escapeHtml(name)}
            </h3>

            <p>
              ${escapeHtml(item.request)}
            </p>

            <div class="admin-prayer-card-actions">

              <button
                class="admin-edit-button"
                type="button"
                data-prayer-action="open"
                data-prayer-id="${item.id}"
              >
                Открыть
              </button>

              <button
                class="admin-delete-button"
                type="button"
                data-prayer-action="delete"
                data-prayer-id="${item.id}"
              >
                Удалить
              </button>

            </div>

          </article>
        `;
      })
      .join("");

  adminPrayerList
    .querySelectorAll(
      "[data-prayer-action]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const id =
            button.dataset.prayerId;

          const action =
            button.dataset.prayerAction;

          if (action === "open") {
            openPrayerModal(id);
          }

          if (action === "delete") {
            openDeletePrayerModal(id);
          }
        }
      );
    });
}

/* =========================
   ФИЛЬТРЫ
========================= */

prayerFilters.forEach((button) => {
  button.addEventListener(
    "click",
    () => {
      activePrayerFilter =
        button.dataset.prayerFilter;

      prayerFilters.forEach(
        (filterButton) => {
          filterButton.classList.remove(
            "active"
          );
        }
      );

      button.classList.add("active");

      renderPrayerRequests();
    }
  );
});

/* =========================
   ПРОСМОТР ЗАПРОСА
========================= */

function openPrayerModal(id) {
  const item = prayerRequests.find(
    (requestItem) =>
      String(requestItem.id) === String(id)
  );

  if (!item) return;

  activePrayerId = item.id;

  prayerModalStatus.textContent =
    item.status === "new"
      ? "Новый запрос"
      : "Прочитанный запрос";

  prayerModalName.textContent =
    item.anonymous
      ? "Анонимно"
      : item.name || "Без имени";

  prayerModalContact.textContent =
    item.contact || "Не указан";

  prayerModalDate.textContent =
    formatPrayerDate(item.createdAt);

  prayerModalText.textContent =
    item.request;

  togglePrayerStatusButton.textContent =
    item.status === "new"
      ? "Отметить прочитанным"
      : "Вернуть в новые";

  prayerModal.classList.add("active");

  prayerModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "admin-body-locked"
  );
}

function closePrayerModal() {
  activePrayerId = null;

  prayerModal.classList.remove("active");

  prayerModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "admin-body-locked"
  );
}

closePrayerModalButton?.addEventListener(
  "click",
  closePrayerModal
);

prayerModal?.addEventListener(
  "click",
  (event) => {
    if (event.target === prayerModal) {
      closePrayerModal();
    }
  }
);

/* =========================
   ИЗМЕНЕНИЕ СТАТУСА
========================= */

togglePrayerStatusButton?.addEventListener(
  "click",
  async () => {
    const item = prayerRequests.find(
      (requestItem) =>
        String(requestItem.id) ===
        String(activePrayerId)
    );

    if (!item) return;

    const nextStatus =
      item.status === "new"
        ? "read"
        : "new";

    togglePrayerStatusButton.disabled = true;
    togglePrayerStatusButton.textContent =
      "Сохранение...";

    try {
      const updatedItem =
        await apiUpdatePrayerStatus(
          item.id,
          nextStatus
        );

      prayerRequests =
        prayerRequests.map(
          (requestItem) =>
            String(requestItem.id) ===
            String(updatedItem.id)
              ? updatedItem
              : requestItem
        );

      renderPrayerRequests();
      openPrayerModal(updatedItem.id);
    } catch (error) {
      alert(
        error.message ||
        "Не удалось изменить статус."
      );
    } finally {
      togglePrayerStatusButton.disabled = false;
    }
  }
);

/* =========================
   УДАЛЕНИЕ
========================= */

function openDeletePrayerModal(id) {
  prayerIdToDelete = id;

  deletePrayerModal.classList.add(
    "active"
  );

  deletePrayerModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "admin-body-locked"
  );
}

function closeDeletePrayerModal() {
  prayerIdToDelete = null;

  deletePrayerModal.classList.remove(
    "active"
  );

  deletePrayerModal.setAttribute(
    "aria-hidden",
    "true"
  );

  if (
    !prayerModal.classList.contains(
      "active"
    )
  ) {
    document.body.classList.remove(
      "admin-body-locked"
    );
  }
}

deletePrayerButton?.addEventListener(
  "click",
  () => {
    if (!activePrayerId) return;

    openDeletePrayerModal(
      activePrayerId
    );
  }
);

cancelDeletePrayerButton?.addEventListener(
  "click",
  closeDeletePrayerModal
);

confirmDeletePrayerButton?.addEventListener(
  "click",
  async () => {
    if (!prayerIdToDelete) return;

    confirmDeletePrayerButton.disabled = true;
    confirmDeletePrayerButton.textContent =
      "Удаление...";

    try {
      await apiDeletePrayerRequest(
        prayerIdToDelete
      );

      prayerRequests =
        prayerRequests.filter(
          (item) =>
            String(item.id) !==
            String(prayerIdToDelete)
        );

      closeDeletePrayerModal();
      closePrayerModal();
      renderPrayerRequests();
    } catch (error) {
      alert(
        error.message ||
        "Не удалось удалить запрос."
      );
    } finally {
      confirmDeletePrayerButton.disabled =
        false;

      confirmDeletePrayerButton.textContent =
        "Удалить";
    }
  }
);

deletePrayerModal?.addEventListener(
  "click",
  (event) => {
    if (
      event.target === deletePrayerModal
    ) {
      closeDeletePrayerModal();
    }
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Escape") return;

    if (
      deletePrayerModal.classList.contains(
        "active"
      )
    ) {
      closeDeletePrayerModal();
      return;
    }

    if (
      prayerModal.classList.contains(
        "active"
      )
    ) {
      closePrayerModal();
    }
  }
);

loadPrayerRequests();