const burgerBtn = document.getElementById("burgerBtn");
const mobileMenu = document.getElementById("mobileMenu");

const videoCards = document.querySelectorAll(".video-card");
const videoModal = document.getElementById("videoModal");
const videoModalContent = document.getElementById("videoModalContent");
const videoClose = document.getElementById("videoClose");

burgerBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("active");
});

const cardSwiper = new Swiper(".cardSwiper", {
  loop: true,
  speed: 700,
  spaceBetween: 16,

  autoplay: {
    delay: 3500,
    disableOnInteraction: false,
  },

  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },

  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  
});


videoCards.forEach((card) => {
  card.addEventListener("click", () => {
    const videoId = card.dataset.video;

    videoModalContent.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/${videoId}?autoplay=1"
        allow="autoplay; encrypted-media"
        allowfullscreen>
      </iframe>
    `;

    videoModal.classList.add("active");
  });
});

videoClose.addEventListener("click", () => {
  videoModal.classList.remove("active");
  videoModalContent.innerHTML = "";
});

videoModal.addEventListener("click", (event) => {
  if (event.target === videoModal) {
    videoModal.classList.remove("active");
    videoModalContent.innerHTML = "";
  }
});

const homeEventsData = {
  "2026-05-24": [
    {
      time: "15:00",
      title: "Служение",
      place: "Horner Heerstraße 28, 28359 Bremen"
    }
  ],
  "2026-05-31": [
    {
      time: "15:00",
      title: "Служение",
      place: "Horner Heerstraße 28, 28359 Bremen"
    }
  ],
  "2026-06-07": [
    {
      time: "15:00",
      title: "Служение",
      place: "Horner Heerstraße 28, 28359 Bremen"
    }
  ],
  "2026-06-14": [
    {
      time: "15:00",
      title: "Служение",
      place: "Horner Heerstraße 28, 28359 Bremen"
    }
  ]
};

const homeDayButtons = document.querySelectorAll(".day");
const homeEventsList = document.getElementById("eventsList");

function renderHomeEvents(day) {
  if (!homeEventsList) return;

  const events = homeEventsData[day] || [];

  if (events.length === 0) {
    homeEventsList.innerHTML = `
      <div class="empty-events">На этот день событий нет</div>
    `;
    return;
  }

  homeEventsList.innerHTML = events.map(event => `
    <div class="event-item">
      <div class="event-time">${event.time}</div>
      <div>
        <h3>${event.title}</h3>
        <p>${event.place}</p>
      </div>
    </div>
  `).join("");
}

if (homeDayButtons.length && homeEventsList) {
  homeDayButtons.forEach(button => {
    button.addEventListener("click", () => {
      homeDayButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      renderHomeEvents(button.dataset.day);
    });
  });

  renderHomeEvents("2026-05-24");
}

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 80) {

        header.classList.add("scrolled");

    } else {

        header.classList.remove("scrolled");

    }

});

/* ===========================
   ГЛАВНАЯ - БЛИЖАЙШИЕ СОБЫТИЯ
=========================== */

const eventsCalendar =
    document.getElementById("eventsCalendar");

const eventsList =
    document.getElementById("eventsList");

let homepageEvents = [];

let selectedHomepageDate = null;

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

async function loadHomepageEvents() {

    try {

        const response = await fetch("/api/events");

        if (!response.ok)
            throw new Error();

        homepageEvents = await response.json();

        homepageEvents.sort((a,b)=>{

            return `${a.date}T${a.time}`

                .localeCompare(

                    `${b.date}T${b.time}`

                );

        });

        renderHomepageDays();

    }

    catch(error){

        console.error(error);

    }

}

function renderHomepageDays() {
  if (!eventsCalendar || !eventsList) return;

  eventsCalendar.innerHTML = "";

  if (homepageEvents.length === 0) {
    eventsList.innerHTML = `
      <div class="empty-events">
        Пока нет ближайших событий
      </div>
    `;
    return;
  }

  const uniqueDates = [
    ...new Set(
      homepageEvents.map((event) => event.date)
    )
  ].sort();

  /*
    Выбираем первую дату только при первой загрузке.
    При клике выбранная дата больше не сбрасывается.
  */
  if (
    !selectedHomepageDate ||
    !uniqueDates.includes(selectedHomepageDate)
  ) {
    selectedHomepageDate = uniqueDates[0];
  }

  uniqueDates.forEach((date) => {
    const [year, month, day] =
      date.split("-").map(Number);

    const eventDate = new Date(
      year,
      month - 1,
      day
    );

    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "day";
    button.dataset.day = date;

    if (date === selectedHomepageDate) {
      button.classList.add("active");
    }

    button.innerHTML = `
      <span>${day}</span>

      <small>
        ${monthNames[month - 1]}
      </small>
    `;

    button.addEventListener("click", () => {
      selectedHomepageDate = date;

      document
        .querySelectorAll("#eventsCalendar .day")
        .forEach((dayButton) => {
          dayButton.classList.remove("active");
        });

      button.classList.add("active");

      renderHomepageEvents();
    });

    eventsCalendar.appendChild(button);
  });

  renderHomepageEvents();
}

function renderHomepageEvents() {
  if (!eventsList) return;

  const selectedEvents = homepageEvents.filter(
    (event) =>
      event.date === selectedHomepageDate
  );

  if (selectedEvents.length === 0) {
    eventsList.innerHTML = `
      <div class="empty-events">
        На этот день событий нет
      </div>
    `;
    return;
  }
  function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

  eventsList.innerHTML = selectedEvents
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

loadHomepageEvents();

/* ===========================
   ПОСЛЕДНИЕ НОВОСТИ
=========================== */

const homepageNews =
    document.getElementById("homepageNews");

async function loadHomepageNews(){

    if(!homepageNews) return;

    try{

        const response =
            await fetch("/api/news");

        if(!response.ok){

            throw new Error();

        }

        const news =
            await response.json();

        homepageNews.innerHTML =
            news
                .slice(0,3)
                .map(item=>{

                    return`

<div class="news-card">

<img
src="${
item.image
? item.image
: "images/news-placeholder.jpg"
}"
alt="">

<div class="news-content">

<span>

${item.category||"Новости"}

</span>

<h3>

${item.title}

</h3>

<p>

${item.excerpt}

</p>

<a href="news-detail.html?id=${item.id}">

Подробнее →

</a>

</div>

</div>

`;

                })

                .join("");

    }

    catch(error){

        console.error(error);

    }

}

loadHomepageNews();