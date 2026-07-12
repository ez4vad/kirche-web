const temporaryAdminAccess =
  sessionStorage.getItem("temporaryAdminAccess");

if (temporaryAdminAccess !== "true") {
  window.location.href = "login.html";
}

/* =========================
   НАСТРОЙКИ API
========================= */

const EVENTS_API_URL = "/api/admin/events";

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
  if (!adminSidebar || !adminSidebarOverlay) return;

  adminSidebar.classList.add("active");
  adminSidebarOverlay.classList.add("active");
  document.body.classList.add("admin-body-locked");
}

function closeAdminSidebar() {
  if (!adminSidebar || !adminSidebarOverlay) return;

  adminSidebar.classList.remove("active");
  adminSidebarOverlay.classList.remove("active");
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
   ЭЛЕМЕНТЫ СТРАНИЦЫ
========================= */

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
  document.getElementById(
    "cancelDeleteEventButton"
  );

const confirmDeleteEventButton =
  document.getElementById(
    "confirmDeleteEventButton"
  );

/* =========================
   СОСТОЯНИЕ
========================= */

let events = [];
let eventIdToDelete = null;
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

async function apiGetEvents() {
  const response = await fetch(EVENTS_API_URL, {
    method: "GET",

    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  return response.json();
}

async function apiCreateEvent(eventData) {
  const response = await fetch(EVENTS_API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },

    body: JSON.stringify(eventData)
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  return response.json();
}

async function apiUpdateEvent(id, eventData) {
  const response = await fetch(
    `${EVENTS_API_URL}/${encodeURIComponent(id)}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },

      body: JSON.stringify(eventData)
    }
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  return response.json();
}

async function apiDeleteEvent(id) {
  const response = await fetch(
    `${EVENTS_API_URL}/${encodeURIComponent(id)}`,
    {
      method: "DELETE",

      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }
}
/* =========================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
========================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatEventDate(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "short"
  }).format(date);
}

function formatEventDay(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return String(date.getDate());
}

function formatEventMonth(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    month: "short"
  })
    .format(date)
    .replace(".", "");
}

function showListMessage(message, type = "error") {

  if (!adminEventsList) return;

  adminEventsList.innerHTML = `
    <div class="admin-empty-state">

      <div>${type === "error" ? "!" : "…"}</div>

      <h3>

        ${
          type === "error"
            ? "Не удалось загрузить события"
            : "Загрузка..."

        }

      </h3>

      <p>${escapeHtml(message)}</p>

    </div>
  `;

}

function setSubmitState(isSubmitting) {

  formIsSubmitting = isSubmitting;

  const submitButton =
    eventForm.querySelector(
      'button[type="submit"]'
    );

  if (!submitButton) return;

  submitButton.disabled = isSubmitting;

  submitButton.textContent =
    isSubmitting
      ? "Сохранение..."
      : "Сохранить событие";

}

/* =========================
   ЗАГРУЗКА СОБЫТИЙ
========================= */

async function loadEvents() {

  showListMessage(
    "Получаем события...",
    "loading"
  );

  try {

    events = await apiGetEvents();

    if (!Array.isArray(events)) {

      events = [];

    }

    renderEvents();

  }

  catch (error) {

    console.error(error);

    events = [];

    eventsCount.textContent = "0";

    eventsEmptyState.hidden = true;

    showListMessage(

      error.message ||

      "Проверьте запущен ли сервер."

    );

  }

}

function renderEvents() {

  const sortedEvents = [...events].sort(
    (a, b) => {

      return `${a.date}T${a.time}`.localeCompare(

        `${b.date}T${b.time}`

      );

    }
  );

  eventsCount.textContent =
    sortedEvents.length;

  if (sortedEvents.length === 0) {

    adminEventsList.innerHTML = "";

    eventsEmptyState.hidden = false;

    return;

  }

  eventsEmptyState.hidden = true;

  adminEventsList.innerHTML =
    sortedEvents.map(event => `

<article class="admin-event-card">

<div class="admin-event-date">

<strong>

${formatEventDay(event.date)}

</strong>

<span>

${formatEventMonth(event.date)}

</span>

</div>

<div class="admin-event-main">

<div class="admin-event-topline">

<span class="admin-event-status ${event.published ? "published" : "hidden"}">

${event.published ? "Опубликовано" : "Скрыто"}

</span>

<time>

${formatEventDate(event.date)}

</time>

</div>

<h3>

${escapeHtml(event.title)}

</h3>

<div class="admin-event-details">

<span>

🕒 ${escapeHtml(event.time)}

</span>

<span>

📍 ${escapeHtml(event.place)}

</span>

</div>

${
event.description
? `<p>${escapeHtml(event.description)}</p>`
: ""
}

<div class="admin-event-actions">

<button

class="admin-edit-button"

data-action="edit"

data-id="${event.id}"

>

Изменить

</button>

<button

class="admin-delete-button"

data-action="delete"

data-id="${event.id}"

>

Удалить

</button>

</div>

</div>

</article>

`).join("");

adminEventsList

.querySelectorAll("[data-action]")

.forEach(button=>{

button.addEventListener("click",()=>{

const id=button.dataset.id;

if(button.dataset.action==="edit"){

openEditForm(id);

}

if(button.dataset.action==="delete"){

openDeleteModal(id);

}

});

});

}
/* =========================
   ФОРМА СОБЫТИЯ
========================= */

function resetEventForm() {

    eventForm.reset();

    eventId.value = "";

    eventPlace.value =
        "Horner Heerstraße 28, 28359 Bremen";

    eventPublished.checked = true;

    eventFormError.textContent = "";

    eventFormLabel.textContent =
        "Новое событие";

    eventFormTitle.textContent =
        "Добавить событие";

    setSubmitState(false);

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

    if(formIsSubmitting) return;

    eventFormSection.hidden = true;

    resetEventForm();

}

function openEditForm(id){

    const currentEvent = events.find(

        event => String(event.id) === String(id)

    );

    if(!currentEvent) return;

    eventId.value = currentEvent.id;

    eventTitle.value = currentEvent.title;

    eventDate.value = currentEvent.date;

    eventTime.value = currentEvent.time;

    eventPlace.value = currentEvent.place;

    eventDescription.value =
        currentEvent.description || "";

    eventPublished.checked =
        currentEvent.published;

    eventFormLabel.textContent =
        "Редактирование";

    eventFormTitle.textContent =
        "Изменить событие";

    eventFormError.textContent = "";

    eventFormSection.hidden = false;

    eventFormSection.scrollIntoView({

        behavior:"smooth",

        block:"start"

    });

}

openEventFormButton?.addEventListener(

    "click",

    openCreateForm

);

closeEventFormButton?.addEventListener(

    "click",

    closeEventForm

);

cancelEventButton?.addEventListener(

    "click",

    closeEventForm

);

eventForm?.addEventListener(

    "submit",

    async(event)=>{

        event.preventDefault();

        if(formIsSubmitting) return;

        const title =
            eventTitle.value.trim();

        const date =
            eventDate.value;

        const time =
            eventTime.value;

        const place =
            eventPlace.value.trim();

        const description =
            eventDescription.value.trim();

        eventFormError.textContent = "";

        if(

            !title ||

            !date ||

            !time ||

            !place

        ){

            eventFormError.textContent =

                "Заполните название, дату, время и адрес.";

            return;

        }

        const eventData = {

            title,

            date,

            time,

            place,

            description,

            published:eventPublished.checked

        };

        const currentId = eventId.value;

        setSubmitState(true);

        try{

            if(currentId){

                await apiUpdateEvent(

                    currentId,

                    eventData

                );

            }

            else{

                await apiCreateEvent(

                    eventData

                );

            }

            await loadEvents();

            closeEventForm();

        }

        catch(error){

            console.error(error);

            eventFormError.textContent =

                error.message ||

                "Ошибка сохранения события.";

        }

        finally{

            setSubmitState(false);

        }

    }

);
/* =========================
   УДАЛЕНИЕ СОБЫТИЯ
========================= */

function openDeleteModal(id) {
  eventIdToDelete = id;

  deleteEventModal.classList.add("active");

  deleteEventModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "admin-body-locked"
  );
}

function closeDeleteModal() {
  eventIdToDelete = null;

  deleteEventModal.classList.remove("active");

  deleteEventModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "admin-body-locked"
  );
}

cancelDeleteEventButton?.addEventListener(
  "click",
  closeDeleteModal
);

confirmDeleteEventButton?.addEventListener(
  "click",
  async () => {
    if (!eventIdToDelete) return;

    confirmDeleteEventButton.disabled = true;
    confirmDeleteEventButton.textContent =
      "Удаление...";

    try {
      await apiDeleteEvent(eventIdToDelete);

      await loadEvents();

      closeDeleteModal();
    } catch (error) {
      console.error(
        "Ошибка удаления события:",
        error
      );

      alert(
        error.message ||
          "Не удалось удалить событие."
      );
    } finally {
      confirmDeleteEventButton.disabled = false;
      confirmDeleteEventButton.textContent =
        "Удалить";
    }
  }
);

deleteEventModal?.addEventListener(
  "click",
  (event) => {
    if (event.target === deleteEventModal) {
      closeDeleteModal();
    }
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      deleteEventModal?.classList.contains(
        "active"
      )
    ) {
      closeDeleteModal();
    }
  }
);

/* =========================
   ЗАПУСК
========================= */

loadEvents();