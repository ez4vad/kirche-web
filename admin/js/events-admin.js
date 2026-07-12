const temporaryAdminAccess =
  sessionStorage.getItem("temporaryAdminAccess");

if (temporaryAdminAccess !== "true") {
  window.location.href = "login.html";
}

/* SIDEBAR */

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
  adminSidebar.classList.add("active");
  adminSidebarOverlay.classList.add("active");
  document.body.classList.add("admin-body-locked");
}

function closeAdminSidebar() {
  adminSidebar.classList.remove("active");
  adminSidebarOverlay.classList.remove("active");
  document.body.classList.remove("admin-body-locked");
}

adminMenuButton.addEventListener("click", openAdminSidebar);
adminSidebarClose.addEventListener("click", closeAdminSidebar);
adminSidebarOverlay.addEventListener("click", closeAdminSidebar);

adminLogoutButton.addEventListener("click", () => {
  sessionStorage.removeItem("temporaryAdminAccess");
  window.location.href = "login.html";
});

/* EVENTS */

const storageKey = "philadelphiaEvents";

const defaultEvents = [
  {
    id: crypto.randomUUID(),
    title: "Служение",
    date: "2026-07-12",
    time: "15:00",
    place: "Horner Heerstraße 28, 28359 Bremen",
    description: "Воскресное богослужение церкви «Филадельфия».",
    published: true
  },
  {
    id: crypto.randomUUID(),
    title: "Служение",
    date: "2026-07-19",
    time: "15:00",
    place: "Horner Heerstraße 28, 28359 Bremen",
    description: "Воскресное богослужение церкви «Филадельфия».",
    published: true
  }
];

function loadEvents() {
  const savedEvents = localStorage.getItem(storageKey);

  if (!savedEvents) {
    localStorage.setItem(
      storageKey,
      JSON.stringify(defaultEvents)
    );

    return [...defaultEvents];
  }

  try {
    return JSON.parse(savedEvents);
  } catch (error) {
    console.error("Ошибка чтения событий:", error);
    return [];
  }
}

let events = loadEvents();
let eventIdToDelete = null;

const openEventFormButton =
  document.getElementById("openEventFormButton");

const eventFormSection =
  document.getElementById("eventFormSection");

const closeEventFormButton =
  document.getElementById("closeEventFormButton");

const cancelEventButton =
  document.getElementById("cancelEventButton");

const eventForm =
  document.getElementById("eventForm");

const eventId =
  document.getElementById("eventId");

const eventTitle =
  document.getElementById("eventTitle");

const eventDate =
  document.getElementById("eventDate");

const eventTime =
  document.getElementById("eventTime");

const eventPlace =
  document.getElementById("eventPlace");

const eventDescription =
  document.getElementById("eventDescription");

const eventPublished =
  document.getElementById("eventPublished");

const eventFormError =
  document.getElementById("eventFormError");

const eventFormLabel =
  document.getElementById("eventFormLabel");

const eventFormTitle =
  document.getElementById("eventFormTitle");

const adminEventsList =
  document.getElementById("adminEventsList");

const eventsEmptyState =
  document.getElementById("eventsEmptyState");

const eventsCount =
  document.getElementById("eventsCount");

const deleteEventModal =
  document.getElementById("deleteEventModal");

const cancelDeleteEventButton =
  document.getElementById("cancelDeleteEventButton");

const confirmDeleteEventButton =
  document.getElementById("confirmDeleteEventButton");

function saveEvents() {
  localStorage.setItem(
    storageKey,
    JSON.stringify(events)
  );
}

function formatEventDate(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "short"
  }).format(date);
}

function renderEvents() {
  const sortedEvents = [...events].sort((a, b) => {
    const firstDate = `${a.date}T${a.time}`;
    const secondDate = `${b.date}T${b.time}`;

    return firstDate.localeCompare(secondDate);
  });

  eventsCount.textContent = String(sortedEvents.length);

  if (sortedEvents.length === 0) {
    adminEventsList.innerHTML = "";
    eventsEmptyState.hidden = false;
    return;
  }

  eventsEmptyState.hidden = true;

  adminEventsList.innerHTML = sortedEvents
    .map((event) => {
      const statusClass = event.published
        ? "published"
        : "hidden";

      const statusText = event.published
        ? "Опубликовано"
        : "Скрыто";

      return `
        <article class="admin-event-card">

          <div class="admin-event-date">
            <strong>
              ${new Date(`${event.date}T12:00:00`).getDate()}
            </strong>

            <span>
              ${new Intl.DateTimeFormat("ru-RU", {
                month: "short"
              }).format(new Date(`${event.date}T12:00:00`))}
            </span>
          </div>

          <div class="admin-event-main">
            <div class="admin-event-topline">
              <span class="admin-event-status ${statusClass}">
                ${statusText}
              </span>

              <time>
                ${formatEventDate(event.date)}
              </time>
            </div>

            <h3>${escapeHtml(event.title)}</h3>

            <div class="admin-event-details">
              <span>◷ ${escapeHtml(event.time)}</span>
              <span>⌖ ${escapeHtml(event.place)}</span>
            </div>

            ${
              event.description
                ? `
                  <p>
                    ${escapeHtml(event.description)}
                  </p>
                `
                : ""
            }

            <div class="admin-event-actions">
              <button
                class="admin-edit-button"
                type="button"
                data-action="edit"
                data-id="${event.id}"
              >
                Изменить
              </button>

              <button
                class="admin-delete-button"
                type="button"
                data-action="delete"
                data-id="${event.id}"
              >
                Удалить
              </button>
            </div>
          </div>

        </article>
      `;
    })
    .join("");

  adminEventsList
    .querySelectorAll("[data-action]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        const action = button.dataset.action;

        if (action === "edit") {
          openEditForm(id);
        }

        if (action === "delete") {
          openDeleteModal(id);
        }
      });
    });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetEventForm() {
  eventForm.reset();

  eventId.value = "";
  eventPlace.value =
    "Horner Heerstraße 28, 28359 Bremen";
  eventPublished.checked = true;

  eventFormError.textContent = "";
  eventFormLabel.textContent = "Новое событие";
  eventFormTitle.textContent = "Добавить событие";
}

function openCreateForm() {
  resetEventForm();
  eventFormSection.hidden = false;

  eventFormSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function closeEventForm() {
  eventFormSection.hidden = true;
  resetEventForm();
}

function openEditForm(id) {
  const currentEvent = events.find(
    (event) => event.id === id
  );

  if (!currentEvent) return;

  eventId.value = currentEvent.id;
  eventTitle.value = currentEvent.title;
  eventDate.value = currentEvent.date;
  eventTime.value = currentEvent.time;
  eventPlace.value = currentEvent.place;
  eventDescription.value =
    currentEvent.description || "";
  eventPublished.checked =
    currentEvent.published;

  eventFormLabel.textContent = "Редактирование";
  eventFormTitle.textContent = "Изменить событие";
  eventFormError.textContent = "";

  eventFormSection.hidden = false;

  eventFormSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function openDeleteModal(id) {
  eventIdToDelete = id;

  deleteEventModal.classList.add("active");
  deleteEventModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add("admin-body-locked");
}

function closeDeleteModal() {
  eventIdToDelete = null;

  deleteEventModal.classList.remove("active");
  deleteEventModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove("admin-body-locked");
}

openEventFormButton.addEventListener(
  "click",
  openCreateForm
);

closeEventFormButton.addEventListener(
  "click",
  closeEventForm
);

cancelEventButton.addEventListener(
  "click",
  closeEventForm
);

eventForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = eventTitle.value.trim();
  const date = eventDate.value;
  const time = eventTime.value;
  const place = eventPlace.value.trim();
  const description =
    eventDescription.value.trim();

  eventFormError.textContent = "";

  if (!title || !date || !time || !place) {
    eventFormError.textContent =
      "Заполните название, дату, время и адрес.";
    return;
  }

  const currentId = eventId.value;

  if (currentId) {
    events = events.map((eventItem) => {
      if (eventItem.id !== currentId) {
        return eventItem;
      }

      return {
        ...eventItem,
        title,
        date,
        time,
        place,
        description,
        published: eventPublished.checked
      };
    });
  } else {
    events.push({
      id: crypto.randomUUID(),
      title,
      date,
      time,
      place,
      description,
      published: eventPublished.checked
    });
  }

  saveEvents();
  renderEvents();
  closeEventForm();
});

cancelDeleteEventButton.addEventListener(
  "click",
  closeDeleteModal
);

confirmDeleteEventButton.addEventListener(
  "click",
  () => {
    if (!eventIdToDelete) return;

    events = events.filter(
      (event) => event.id !== eventIdToDelete
    );

    saveEvents();
    renderEvents();
    closeDeleteModal();
  }
);

deleteEventModal.addEventListener(
  "click",
  (event) => {
    if (event.target === deleteEventModal) {
      closeDeleteModal();
    }
  }
);

renderEvents();