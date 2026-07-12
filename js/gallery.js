const burgerBtn = document.getElementById("burgerBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (burgerBtn && mobileMenu) {
  burgerBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("active");

    burgerBtn.setAttribute("aria-expanded", String(isOpen));
  });
}

const galleryData = [
  {
    id: 1,
    category: "service",
    image: "images/gallery/gallery-1.jpg",
    title: "Воскресное богослужение"
  },
  {
    id: 2,
    category: "youth",
    image: "images/gallery/gallery-2.jpg",
    title: "Молодёжная встреча"
  },
  {
    id: 3,
    category: "kids",
    image: "images/gallery/gallery-3.jpg",
    title: "Детское служение"
  },
  {
    id: 4,
    category: "events",
    image: "images/gallery/gallery-4.jpg",
    title: "Церковное мероприятие"
  },
  {
    id: 5,
    category: "service",
    image: "images/gallery/gallery-5.jpg",
    title: "Время прославления"
  },
  {
    id: 6,
    category: "youth",
    image: "images/gallery/gallery-6.jpg",
    title: "Общение молодёжи"
  }
];

const galleryGrid = document.getElementById("galleryGrid");
const filterButtons = document.querySelectorAll(".gallery-filter");

const galleryModal = document.getElementById("galleryModal");
const galleryModalImage = document.getElementById("galleryModalImage");
const galleryModalCaption = document.getElementById("galleryModalCaption");
const galleryModalClose = document.getElementById("galleryModalClose");
const galleryModalPrev = document.getElementById("galleryModalPrev");
const galleryModalNext = document.getElementById("galleryModalNext");

let visibleGalleryItems = [...galleryData];
let currentImageIndex = 0;

function renderGallery(filter = "all") {
  if (!galleryGrid) return;

  visibleGalleryItems =
    filter === "all"
      ? [...galleryData]
      : galleryData.filter((item) => item.category === filter);

  galleryGrid.innerHTML = visibleGalleryItems
    .map((item, index) => {
      return `
        <button
          class="gallery-item"
          type="button"
          data-index="${index}"
          aria-label="Открыть фотографию: ${item.title}"
        >
          <img
            src="${item.image}"
            alt="${item.title}"
            loading="lazy"
          >

          <span class="gallery-item-overlay">
            <span>${item.title}</span>
          </span>
        </button>
      `;
    })
    .join("");

  const galleryItems = document.querySelectorAll(".gallery-item");

  galleryItems.forEach((item) => {
    item.addEventListener("click", () => {
      const selectedIndex = Number(item.dataset.index);

      openGalleryModal(selectedIndex);
    });
  });
}

function openGalleryModal(index) {
  currentImageIndex = index;

  updateGalleryModal();

  galleryModal.classList.add("active");
  galleryModal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");
}

function closeGalleryModal() {
  galleryModal.classList.remove("active");
  galleryModal.setAttribute("aria-hidden", "true");

  galleryModalImage.src = "";
  document.body.classList.remove("modal-open");
}

function updateGalleryModal() {
  const selectedItem = visibleGalleryItems[currentImageIndex];

  if (!selectedItem) return;

  galleryModalImage.src = selectedItem.image;
  galleryModalImage.alt = selectedItem.title;
  galleryModalCaption.textContent = selectedItem.title;
}

function showPreviousImage() {
  currentImageIndex =
    currentImageIndex === 0
      ? visibleGalleryItems.length - 1
      : currentImageIndex - 1;

  updateGalleryModal();
}

function showNextImage() {
  currentImageIndex =
    currentImageIndex === visibleGalleryItems.length - 1
      ? 0
      : currentImageIndex + 1;

  updateGalleryModal();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((filterButton) => {
      filterButton.classList.remove("active");
    });

    button.classList.add("active");

    renderGallery(button.dataset.filter);
  });
});

galleryModalClose.addEventListener("click", closeGalleryModal);
galleryModalPrev.addEventListener("click", showPreviousImage);
galleryModalNext.addEventListener("click", showNextImage);

galleryModal.addEventListener("click", (event) => {
  if (event.target === galleryModal) {
    closeGalleryModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (!galleryModal.classList.contains("active")) return;

  if (event.key === "Escape") {
    closeGalleryModal();
  }

  if (event.key === "ArrowLeft") {
    showPreviousImage();
  }

  if (event.key === "ArrowRight") {
    showNextImage();
  }
});

let touchStartX = 0;
let touchEndX = 0;

galleryModal.addEventListener(
  "touchstart",
  (event) => {
    touchStartX = event.changedTouches[0].screenX;
  },
  { passive: true }
);

galleryModal.addEventListener(
  "touchend",
  (event) => {
    touchEndX = event.changedTouches[0].screenX;

    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) < 50) return;

    if (swipeDistance > 0) {
      showPreviousImage();
    } else {
      showNextImage();
    }
  },
  { passive: true }
);

renderGallery();