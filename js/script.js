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