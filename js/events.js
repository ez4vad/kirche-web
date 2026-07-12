const burgerBtn = document.getElementById("burgerBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (burgerBtn && mobileMenu) {
  burgerBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("active");

    burgerBtn.classList.toggle("active", isOpen);
    burgerBtn.setAttribute("aria-expanded", String(isOpen));
  });
}

/* =========================
   ЭЛЕМЕНТЫ КАЛЕНДАРЯ
========================= */

const calendarGrid =
  document.getElementById("calendarGrid");

const calendarTitle =
  document.getElementById("calendarTitle");

const calendarEventsList =
  document.getElementById("calendarEventsList");

const prevMonth =
  document.getElementById("prevMonth");

const nextMonth =
  document.getElementById("nextMonth");

const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь"
];

/* =========================
   СОСТОЯНИЕ
========================= */

let events = [];
let eventsData = {};

let currentDate = new Date();
let selectedDate = null;

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

function formatDateKey(year, month, day) {
  const formattedMonth =
    String(month + 1).padStart(2, "0");

  const formattedDay =
    String(day).padStart(2, "0");

  return `${year}-${formattedMonth}-${formattedDay}`;
}

function groupEventsByDate(eventList) {
  return eventList.reduce((result, event) => {
    if (!event.date) {
      return result;
    }

    if (!result[event.date]) {
      result[event.date] = [];
    }

    result[event.date].push(event);

    return result;
  }, {});
}

function findFirstEventDate() {
  const eventDates = Object.keys(eventsData).sort();

  return eventDates.length > 0
    ? eventDates[0]
    : null;
}

function showCalendarMessage(message) {
  if (!calendarEventsList) return;

  calendarEventsList.innerHTML = `
    <div class="empty-events">
      ${escapeHtml(message)}
    </div>
  `;
}

/* =========================
   ЗАГРУЗКА ИЗ API
========================= */

async function loadEvents() {
  showCalendarMessage("Загрузка событий...");

  try {
    const response = await fetch("/api/events", {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      let errorMessage =
        "Не удалось загрузить события.";

      try {
        const errorData = await response.json();

        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Сервер вернул не JSON.
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    events = Array.isArray(result)
      ? result
      : [];

    eventsData = groupEventsByDate(events);

    const firstEventDate = findFirstEventDate();

    if (firstEventDate) {
      selectedDate = firstEventDate;

      const [year, month] =
        firstEventDate.split("-").map(Number);

      currentDate = new Date(
        year,
        month - 1,
        1
      );
    } else {
      selectedDate = formatDateKey(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );
    }

    renderCalendar();
    renderEvents(selectedDate);
  } catch (error) {
    console.error(
      "Ошибка загрузки событий:",
      error
    );

    renderCalendar();

    showCalendarMessage(
      error.message ||
      "Проверьте, запущен ли сервер."
    );
  }
}

/* =========================
   КАЛЕНДАРЬ
========================= */

function renderCalendar() {
  if (!calendarGrid || !calendarTitle) {
    return;
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  calendarTitle.textContent =
    `${monthNames[month]} ${year}`;

  calendarGrid.innerHTML = "";

  const firstDay =
    new Date(year, month, 1);

  const lastDate =
    new Date(year, month + 1, 0).getDate();

  let startDay = firstDay.getDay();

  if (startDay === 0) {
    startDay = 7;
  }

  for (let i = 1; i < startDay; i++) {
    const emptyCell =
      document.createElement("div");

    emptyCell.className =
      "calendar-day empty";

    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= lastDate; day++) {
    const dateKey =
      formatDateKey(year, month, day);

    const dayButton =
      document.createElement("button");

    dayButton.type = "button";
    dayButton.className = "calendar-day";
    dayButton.textContent = day;

    if (
      eventsData[dateKey] &&
      eventsData[dateKey].length > 0
    ) {
      dayButton.classList.add("has-event");
    }

    if (dateKey === selectedDate) {
      dayButton.classList.add("active");
    }

    dayButton.addEventListener(
      "click",
      () => {
        selectedDate = dateKey;

        renderCalendar();
        renderEvents(dateKey);
      }
    );

    calendarGrid.appendChild(dayButton);
  }
}

/* =========================
   СОБЫТИЯ ВЫБРАННОГО ДНЯ
========================= */

function renderEvents(dateKey) {
  if (!calendarEventsList) return;

  const selectedEvents =
    eventsData[dateKey] || [];

  if (selectedEvents.length === 0) {
    calendarEventsList.innerHTML = `
      <div class="empty-events">
        На этот день событий нет
      </div>
    `;

    return;
  }

  calendarEventsList.innerHTML =
    selectedEvents
      .sort((a, b) =>
        String(a.time).localeCompare(
          String(b.time)
        )
      )
      .map((event) => {
        return `
          <div class="event-item">
            <div class="event-time">
              ${escapeHtml(event.time)}
            </div>

            <div>
              <h3>
                ${escapeHtml(event.title)}
              </h3>

              <p>
                ${escapeHtml(event.place)}
              </p>

              ${
                event.description
                  ? `
                    <p class="event-description">
                      ${escapeHtml(
                        event.description
                      )}
                    </p>
                  `
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");
}

/* =========================
   ПЕРЕКЛЮЧЕНИЕ МЕСЯЦЕВ
========================= */

prevMonth?.addEventListener(
  "click",
  () => {
    currentDate.setMonth(
      currentDate.getMonth() - 1
    );

    selectedDate = null;

    renderCalendar();
    showCalendarMessage(
      "Выберите день в календаре"
    );
  }
);

nextMonth?.addEventListener(
  "click",
  () => {
    currentDate.setMonth(
      currentDate.getMonth() + 1
    );

    selectedDate = null;

    renderCalendar();
    showCalendarMessage(
      "Выберите день в календаре"
    );
  }
);

/* =========================
   ЗАПУСК
========================= */

loadEvents();