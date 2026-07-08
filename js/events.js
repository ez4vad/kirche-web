const burgerBtn = document.getElementById("burgerBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (burgerBtn && mobileMenu) {
  burgerBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
  });
}

const eventsData = {
  "2026-07-12": [
    {
      time: "15:00",
      title: "Служение",
      place: "Horner Heerstraße 28, 28359 Bremen",
    },
  ],
  "2026-07-19": [
    {
      time: "15:00",
      title: "Служение",
      place: "Horner Heerstraße 28, 28359 Bremen",
    },
  ],
  "2026-07-26": [
    {
      time: "15:00",
      title: "Служение",
      place: "Horner Heerstraße 28, 28359 Bremen",
    },
  ],
  "2026-08-2": [
    {
      time: "15:00",
      title: "Служение",
      place: "Horner Heerstraße 28, 28359 Bremen",
    },
  ],
};

const calendarGrid = document.getElementById("calendarGrid");
const calendarTitle = document.getElementById("calendarTitle");
const calendarEventsList = document.getElementById("calendarEventsList");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

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
  "Декабрь",
];

let currentDate = new Date();
let selectedDate = "2026-05-25";

function formatDateKey(year, month, day) {
  const formattedMonth = String(month + 1).padStart(2, "0");
  const formattedDay = String(day).padStart(2, "0");

  return `${year}-${formattedMonth}-${formattedDay}`;
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  calendarTitle.textContent = `${monthNames[month]} ${year}`;
  calendarGrid.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();

  let startDay = firstDay.getDay();

  if (startDay === 0) {
    startDay = 7;
  }

  for (let i = 1; i < startDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day empty";
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= lastDate; day++) {
    const dateKey = formatDateKey(year, month, day);

    const dayButton = document.createElement("button");
    dayButton.className = "calendar-day";
    dayButton.textContent = day;

    if (eventsData[dateKey]) {
      dayButton.classList.add("has-event");
    }

    if (dateKey === selectedDate) {
      dayButton.classList.add("active");
    }

    dayButton.addEventListener("click", () => {
      selectedDate = dateKey;
      renderCalendar();
      renderEvents(dateKey);
    });

    calendarGrid.appendChild(dayButton);
  }
}

function renderEvents(dateKey) {
  const events = eventsData[dateKey] || [];

  if (events.length === 0) {
    calendarEventsList.innerHTML = `
      <div class="empty-events">
        На этот день событий нет
      </div>
    `;
    return;
  }

  calendarEventsList.innerHTML = events
    .map((event) => {
      return `
        <div class="event-item">
          <div class="event-time">${event.time}</div>

          <div>
            <h3>${event.title}</h3>
            <p>${event.place}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

prevMonth.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextMonth.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

renderCalendar();
renderEvents(selectedDate);