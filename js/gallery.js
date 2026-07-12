const galleryGrid =
  document.getElementById("galleryGrid");

const galleryFilters =
  document.getElementById("galleryFilters");

let galleryItems = [];
let activeCategory = "all";
let activeImageIndex = 0;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadGallery() {
  if (!galleryGrid) return;

  try {
    const response = await fetch("/api/gallery", {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      let message =
        "Не удалось загрузить галерею.";

      try {
        const data = await response.json();

        if (data.error) {
          message = data.error;
        }
      } catch {
        // Сервер вернул не JSON.
      }

      throw new Error(message);
    }

    const result = await response.json();

    galleryItems =
      Array.isArray(result) ? result : [];

    renderGallery();
  } catch (error) {
    console.error(
      "Ошибка загрузки галереи:",
      error
    );

    galleryGrid.innerHTML = `
      <div class="gallery-message">
        ${escapeHtml(
          error.message ||
          "Проверьте подключение к серверу."
        )}
      </div>
    `;
  }
}

function getVisibleItems() {
  if (activeCategory === "all") {
    return galleryItems;
  }

  return galleryItems.filter(
    (item) =>
      item.category === activeCategory
  );
}

function renderGallery() {
  const visibleItems = getVisibleItems();

  if (visibleItems.length === 0) {
    galleryGrid.innerHTML = `
      <div class="gallery-message">
        В этой категории пока нет фотографий.
      </div>
    `;

    return;
  }

  galleryGrid.innerHTML = visibleItems
    .map((item, index) => {
      return `
        <button
          class="gallery-card"
          type="button"
          data-gallery-index="${index}"
        >
          <img
            src="${escapeHtml(item.image)}"
            alt="${escapeHtml(
              item.title ||
              "Фотография церкви"
            )}"
            loading="lazy"
          >

          <span class="gallery-card-overlay">
            <strong>
              ${escapeHtml(
                item.title ||
                item.category ||
                "Фотография"
              )}
            </strong>

            <small>
              ${escapeHtml(
                item.category || ""
              )}
            </small>
          </span>
        </button>
      `;
    })
    .join("");

  galleryGrid
    .querySelectorAll(
      "[data-gallery-index]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          activeImageIndex =
            Number(
              button.dataset.galleryIndex
            );

          openGalleryLightbox();
        }
      );
    });
}

galleryFilters?.addEventListener(
  "click",
  (event) => {
    const button =
      event.target.closest(
        "[data-category]"
      );

    if (!button) return;

    activeCategory =
      button.dataset.category;

    galleryFilters
      .querySelectorAll(
        "[data-category]"
      )
      .forEach((item) => {
        item.classList.remove("active");
      });

    button.classList.add("active");

    renderGallery();
  }
);

/* =========================
   LIGHTBOX
========================= */

const lightbox =
  document.createElement("div");

lightbox.className = "gallery-lightbox";
lightbox.setAttribute(
  "aria-hidden",
  "true"
);

lightbox.innerHTML = `
  <button
    type="button"
    class="gallery-lightbox-close"
    aria-label="Закрыть"
  >
    ×
  </button>

  <button
    type="button"
    class="gallery-lightbox-prev"
    aria-label="Предыдущее фото"
  >
    ‹
  </button>

  <div class="gallery-lightbox-content">
    <img
      class="gallery-lightbox-image"
      src=""
      alt=""
    >

    <div class="gallery-lightbox-caption">
      <strong></strong>
      <span></span>
    </div>
  </div>

  <button
    type="button"
    class="gallery-lightbox-next"
    aria-label="Следующее фото"
  >
    ›
  </button>
`;

document.body.appendChild(lightbox);

const lightboxImage =
  lightbox.querySelector(
    ".gallery-lightbox-image"
  );

const lightboxTitle =
  lightbox.querySelector(
    ".gallery-lightbox-caption strong"
  );

const lightboxCategory =
  lightbox.querySelector(
    ".gallery-lightbox-caption span"
  );

const closeLightboxButton =
  lightbox.querySelector(
    ".gallery-lightbox-close"
  );

const prevLightboxButton =
  lightbox.querySelector(
    ".gallery-lightbox-prev"
  );

const nextLightboxButton =
  lightbox.querySelector(
    ".gallery-lightbox-next"
  );

function openGalleryLightbox() {
  updateGalleryLightbox();

  lightbox.classList.add("active");
  lightbox.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "gallery-lightbox-open"
  );
}

function closeGalleryLightbox() {
  lightbox.classList.remove("active");
  lightbox.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "gallery-lightbox-open"
  );
}

function updateGalleryLightbox() {
  const visibleItems = getVisibleItems();

  if (visibleItems.length === 0) return;

  if (activeImageIndex < 0) {
    activeImageIndex =
      visibleItems.length - 1;
  }

  if (
    activeImageIndex >=
    visibleItems.length
  ) {
    activeImageIndex = 0;
  }

  const item =
    visibleItems[activeImageIndex];

  lightboxImage.src = item.image;
  lightboxImage.alt =
    item.title ||
    "Фотография галереи";

  lightboxTitle.textContent =
    item.title ||
    item.category ||
    "Фотография";

  lightboxCategory.textContent =
    item.category || "";
}

function showPreviousImage() {
  activeImageIndex -= 1;
  updateGalleryLightbox();
}

function showNextImage() {
  activeImageIndex += 1;
  updateGalleryLightbox();
}

closeLightboxButton.addEventListener(
  "click",
  closeGalleryLightbox
);

prevLightboxButton.addEventListener(
  "click",
  showPreviousImage
);

nextLightboxButton.addEventListener(
  "click",
  showNextImage
);

lightbox.addEventListener(
  "click",
  (event) => {
    if (event.target === lightbox) {
      closeGalleryLightbox();
    }
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      !lightbox.classList.contains(
        "active"
      )
    ) {
      return;
    }

    if (event.key === "Escape") {
      closeGalleryLightbox();
    }

    if (event.key === "ArrowLeft") {
      showPreviousImage();
    }

    if (event.key === "ArrowRight") {
      showNextImage();
    }
  }
);

/* =========================
   SWIPE НА ТЕЛЕФОНЕ
========================= */

let touchStartX = 0;
let touchEndX = 0;

lightbox.addEventListener(
  "touchstart",
  (event) => {
    touchStartX =
      event.changedTouches[0].screenX;
  },
  {
    passive: true
  }
);

lightbox.addEventListener(
  "touchend",
  (event) => {
    touchEndX =
      event.changedTouches[0].screenX;

    const difference =
      touchStartX - touchEndX;

    if (Math.abs(difference) < 50) {
      return;
    }

    if (difference > 0) {
      showNextImage();
    } else {
      showPreviousImage();
    }
  },
  {
    passive: true
  }
);

loadGallery();