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