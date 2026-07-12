const temporaryAdminAccess =
  sessionStorage.getItem("temporaryAdminAccess");

if (temporaryAdminAccess !== "true") {
  window.location.href = "login.html";
}

/* =========================
   НАСТРОЙКИ API
========================= */

const GALLERY_API_URL =
  "/api/admin/gallery";

const GALLERY_UPLOAD_API_URL =
  "/api/admin/gallery/upload";

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
  document.getElementById(
    "adminSidebarOverlay"
  );

const adminLogoutButton =
  document.getElementById(
    "adminLogoutButton"
  );

function openAdminSidebar() {
  adminSidebar?.classList.add("active");

  adminSidebarOverlay?.classList.add(
    "active"
  );

  document.body.classList.add(
    "admin-body-locked"
  );
}

function closeAdminSidebar() {
  adminSidebar?.classList.remove("active");

  adminSidebarOverlay?.classList.remove(
    "active"
  );

  document.body.classList.remove(
    "admin-body-locked"
  );
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
   ЭЛЕМЕНТЫ СТРАНИЦЫ
========================= */

const openGalleryFormButton =
  document.getElementById(
    "openGalleryFormButton"
  );

const galleryFormSection =
  document.getElementById(
    "galleryFormSection"
  );

const closeGalleryFormButton =
  document.getElementById(
    "closeGalleryFormButton"
  );

const galleryUploadForm =
  document.getElementById(
    "galleryUploadForm"
  );

const galleryCategory =
  document.getElementById(
    "galleryCategory"
  );

const galleryTitle =
  document.getElementById(
    "galleryTitle"
  );

const galleryFiles =
  document.getElementById(
    "galleryFiles"
  );

const galleryUploadZone =
  document.getElementById(
    "galleryUploadZone"
  );

const gallerySelectedSection =
  document.getElementById(
    "gallerySelectedSection"
  );

const clearGallerySelectionButton =
  document.getElementById(
    "clearGallerySelectionButton"
  );

const galleryPreviewGrid =
  document.getElementById(
    "galleryPreviewGrid"
  );

const galleryUploadStatus =
  document.getElementById(
    "galleryUploadStatus"
  );

const galleryFormError =
  document.getElementById(
    "galleryFormError"
  );

const cancelGalleryUploadButton =
  document.getElementById(
    "cancelGalleryUploadButton"
  );

const uploadGalleryButton =
  document.getElementById(
    "uploadGalleryButton"
  );

const galleryFilter =
  document.getElementById(
    "galleryFilter"
  );

const gallerySearch =
  document.getElementById(
    "gallerySearch"
  );

const galleryCount =
  document.getElementById(
    "galleryCount"
  );

const adminGalleryGrid =
  document.getElementById(
    "adminGalleryGrid"
  );

const galleryEmptyState =
  document.getElementById(
    "galleryEmptyState"
  );

/* =========================
   ЭЛЕМЕНТЫ РЕДАКТИРОВАНИЯ
========================= */

const editGalleryModal =
  document.getElementById(
    "editGalleryModal"
  );

const closeEditGalleryButton =
  document.getElementById(
    "closeEditGalleryButton"
  );

const cancelEditGalleryButton =
  document.getElementById(
    "cancelEditGalleryButton"
  );

const editGalleryForm =
  document.getElementById(
    "editGalleryForm"
  );

const editGalleryId =
  document.getElementById(
    "editGalleryId"
  );

const editGalleryImage =
  document.getElementById(
    "editGalleryImage"
  );

const editGalleryTitle =
  document.getElementById(
    "editGalleryTitle"
  );

const editGalleryCategory =
  document.getElementById(
    "editGalleryCategory"
  );

const editGalleryPublished =
  document.getElementById(
    "editGalleryPublished"
  );

const editGalleryError =
  document.getElementById(
    "editGalleryError"
  );

/* =========================
   ЭЛЕМЕНТЫ УДАЛЕНИЯ
========================= */

const deleteGalleryModal =
  document.getElementById(
    "deleteGalleryModal"
  );

const cancelDeleteGalleryButton =
  document.getElementById(
    "cancelDeleteGalleryButton"
  );

const confirmDeleteGalleryButton =
  document.getElementById(
    "confirmDeleteGalleryButton"
  );

/* =========================
   СОСТОЯНИЕ
========================= */

let galleryItems = [];

let selectedGalleryFiles = [];

let galleryIdToDelete = null;

let galleryIsUploading = false;

let galleryIsSaving = false;

/* =========================
   API
========================= */

async function readGalleryError(
  response
) {
  try {
    const data = await response.json();

    return (
      data.error ||
      "Произошла ошибка."
    );
  } catch {
    return "Произошла ошибка.";
  }
}

async function apiGetGallery() {
  const response = await fetch(
    GALLERY_API_URL,
    {
      method: "GET",

      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      await readGalleryError(response)
    );
  }

  return response.json();
}

async function apiUploadGallery(
  files,
  title,
  category
) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  formData.append("title", title);
  formData.append("category", category);

  const response = await fetch(
    GALLERY_UPLOAD_API_URL,
    {
      method: "POST",
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error(
      await readGalleryError(response)
    );
  }

  return response.json();
}

async function apiUpdateGalleryItem(
  id,
  data
) {
  const response = await fetch(
    `${GALLERY_API_URL}/${encodeURIComponent(
      id
    )}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",

        Accept: "application/json"
      },

      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    throw new Error(
      await readGalleryError(response)
    );
  }

  return response.json();
}

async function apiDeleteGalleryItem(
  id
) {
  const response = await fetch(
    `${GALLERY_API_URL}/${encodeURIComponent(
      id
    )}`,
    {
      method: "DELETE",

      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      await readGalleryError(response)
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

function formatGalleryDate(
  dateValue
) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  ).format(date);
}

function setGalleryUploadState(
  isUploading
) {
  galleryIsUploading = isUploading;

  if (uploadGalleryButton) {
    uploadGalleryButton.disabled =
      isUploading;

    uploadGalleryButton.textContent =
      isUploading
        ? "Загрузка..."
        : "Загрузить фотографии";
  }

  if (galleryFiles) {
    galleryFiles.disabled =
      isUploading;
  }

  galleryUploadZone?.classList.toggle(
    "uploading",
    isUploading
  );
}

function setGalleryEditState(
  isSaving
) {
  galleryIsSaving = isSaving;

  const submitButton =
    editGalleryForm?.querySelector(
      'button[type="submit"]'
    );

  if (!submitButton) return;

  submitButton.disabled = isSaving;

  submitButton.textContent =
    isSaving
      ? "Сохранение..."
      : "Сохранить";
}

/* =========================
   ЗАГРУЗКА СПИСКА ГАЛЕРЕИ
========================= */

async function loadGallery() {
  if (!adminGalleryGrid) return;

  adminGalleryGrid.innerHTML = `
    <div class="admin-empty-state">
      <div>…</div>

      <h3>
        Загрузка
      </h3>

      <p>
        Получаем фотографии с сервера...
      </p>
    </div>
  `;

  try {
    const result =
      await apiGetGallery();

    galleryItems =
      Array.isArray(result)
        ? result
        : [];

    renderGalleryItems();
  } catch (error) {
    console.error(
      "Ошибка загрузки галереи:",
      error
    );

    galleryItems = [];

    if (galleryCount) {
      galleryCount.textContent = "0";
    }

    adminGalleryGrid.innerHTML = `
      <div class="admin-empty-state">
        <div>!</div>

        <h3>
          Не удалось загрузить фотографии
        </h3>

        <p>
          ${escapeHtml(
            error.message ||
            "Проверьте, запущен ли сервер."
          )}
        </p>
      </div>
    `;
  }
}

/* =========================
   ФИЛЬТРАЦИЯ
========================= */

function getFilteredGalleryItems() {
  const selectedCategory =
    galleryFilter?.value || "all";

  const searchValue =
    gallerySearch?.value
      .trim()
      .toLowerCase() || "";

  return galleryItems.filter(
    (item) => {
      const categoryMatches =
        selectedCategory === "all" ||
        item.category === selectedCategory;

      const title =
        String(item.title || "")
          .toLowerCase();

      const searchMatches =
        !searchValue ||
        title.includes(searchValue);

      return (
        categoryMatches &&
        searchMatches
      );
    }
  );
}

/* =========================
   ОТОБРАЖЕНИЕ ФОТОГРАФИЙ
========================= */

function renderGalleryItems() {
  if (
    !adminGalleryGrid ||
    !galleryEmptyState ||
    !galleryCount
  ) {
    return;
  }

  const filteredItems =
    getFilteredGalleryItems();

  galleryCount.textContent =
    String(galleryItems.length);

  if (galleryItems.length === 0) {
    adminGalleryGrid.innerHTML = "";
    galleryEmptyState.hidden = false;
    return;
  }

  galleryEmptyState.hidden = true;

  if (filteredItems.length === 0) {
    adminGalleryGrid.innerHTML = `
      <div class="admin-empty-state">
        <div>⌕</div>

        <h3>
          Ничего не найдено
        </h3>

        <p>
          Попробуйте изменить категорию
          или текст поиска.
        </p>
      </div>
    `;

    return;
  }

  adminGalleryGrid.innerHTML =
    filteredItems
      .map((item) => {
        const statusClass =
          item.published
            ? "published"
            : "hidden";

        const statusText =
          item.published
            ? "Опубликовано"
            : "Скрыто";

        return `
          <article class="admin-gallery-card">

            <div class="admin-gallery-card-image">
              <img
                src="${escapeHtml(item.image)}"
                alt="${escapeHtml(
                  item.title ||
                  "Фотография галереи"
                )}"
                loading="lazy"
              >

              <span
                class="admin-event-status ${statusClass}"
              >
                ${statusText}
              </span>
            </div>

            <div class="admin-gallery-card-content">

              <span class="admin-gallery-card-category">
                ${escapeHtml(
                  item.category || "Без категории"
                )}
              </span>

              <h3>
                ${
                  item.title
                    ? escapeHtml(item.title)
                    : "Без названия"
                }
              </h3>

              <time>
                ${escapeHtml(
                  formatGalleryDate(
                    item.createdAt
                  )
                )}
              </time>

              <div class="admin-gallery-card-actions">

                <button
                  class="admin-edit-button"
                  type="button"
                  data-gallery-action="edit"
                  data-gallery-id="${escapeHtml(item.id)}"
                >
                  Изменить
                </button>

                <button
                  class="admin-delete-button"
                  type="button"
                  data-gallery-action="delete"
                  data-gallery-id="${escapeHtml(item.id)}"
                >
                  Удалить
                </button>

              </div>

            </div>

          </article>
        `;
      })
      .join("");

  adminGalleryGrid
    .querySelectorAll(
      "[data-gallery-action]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const id =
            button.dataset.galleryId;

          const action =
            button.dataset.galleryAction;

          if (action === "edit") {
            openEditGalleryModal(id);
          }

          if (action === "delete") {
            openDeleteGalleryModal(id);
          }
        }
      );
    });
}

/* =========================
   ФИЛЬТРЫ И ПОИСК
========================= */

galleryFilter?.addEventListener(
  "change",
  renderGalleryItems
);

gallerySearch?.addEventListener(
  "input",
  renderGalleryItems
);

/* =========================
   ОТКРЫТИЕ ФОРМЫ ЗАГРУЗКИ
========================= */

function resetGalleryUploadForm() {
  galleryUploadForm?.reset();

  selectedGalleryFiles = [];

  if (galleryCategory) {
    galleryCategory.value =
      "Богослужения";
  }

  if (galleryPreviewGrid) {
    galleryPreviewGrid.innerHTML = "";
  }

  if (gallerySelectedSection) {
    gallerySelectedSection.hidden = true;
  }

  if (galleryUploadStatus) {
    galleryUploadStatus.textContent = "";
    galleryUploadStatus.className =
      "admin-upload-status";
  }

  if (galleryFormError) {
    galleryFormError.textContent = "";
  }

  setGalleryUploadState(false);
}

function openGalleryForm() {
  resetGalleryUploadForm();

  if (!galleryFormSection) return;

  galleryFormSection.hidden = false;

  galleryFormSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function closeGalleryForm() {
  if (galleryIsUploading) return;

  if (galleryFormSection) {
    galleryFormSection.hidden = true;
  }

  resetGalleryUploadForm();
}

openGalleryFormButton?.addEventListener(
  "click",
  openGalleryForm
);

closeGalleryFormButton?.addEventListener(
  "click",
  closeGalleryForm
);

cancelGalleryUploadButton?.addEventListener(
  "click",
  closeGalleryForm
);

/* =========================
   ВЫБОР И ПРЕДПРОСМОТР ФАЙЛОВ
========================= */

galleryFiles?.addEventListener(
  "change",
  () => {

    selectedGalleryFiles =
      Array.from(
        galleryFiles.files || []
      );

    renderGalleryPreview();

  }
);

clearGallerySelectionButton?.addEventListener(
  "click",
  () => {

    selectedGalleryFiles = [];

    galleryFiles.value = "";

    renderGalleryPreview();

  }
);

function renderGalleryPreview() {

  if(
    !galleryPreviewGrid ||
    !gallerySelectedSection
  ){
    return;
  }

  galleryPreviewGrid.innerHTML = "";

  if(selectedGalleryFiles.length===0){

    gallerySelectedSection.hidden=true;

    return;

  }

  gallerySelectedSection.hidden=false;

  selectedGalleryFiles.forEach((file,index)=>{

    const reader =
      new FileReader();

    reader.onload=(event)=>{

      const card=
      document.createElement("div");

      card.className=
        "admin-gallery-preview-card";

      card.innerHTML=`

        <img
          src="${event.target.result}"
          alt=""
        >

        <button
          type="button"
          data-remove-preview="${index}"
        >
          ×
        </button>

        <span>
          ${escapeHtml(file.name)}
        </span>

      `;

      galleryPreviewGrid.appendChild(card);

      card
        .querySelector("button")
        .addEventListener(
          "click",
          ()=>{

            selectedGalleryFiles.splice(
              index,
              1
            );

            renderGalleryPreview();

          }
        );

    };

    reader.readAsDataURL(file);

  });

}

/* =========================
   ЗАГРУЗКА ФОТОГРАФИЙ
========================= */

galleryUploadForm?.addEventListener(
  "submit",
  async(event)=>{

    event.preventDefault();

    if(galleryIsUploading){
      return;
    }

    galleryFormError.textContent="";

    if(selectedGalleryFiles.length===0){

      galleryFormError.textContent=
      "Выберите хотя бы одну фотографию.";

      return;

    }

    setGalleryUploadState(true);

    try{

      const createdItems=
        await apiUploadGallery(

          selectedGalleryFiles,

          galleryTitle.value.trim(),

          galleryCategory.value

        );

      galleryItems.unshift(
        ...createdItems
      );

      renderGalleryItems();

      closeGalleryForm();

    }

    catch(error){

      console.error(error);

      galleryFormError.textContent=
        error.message;

    }

    finally{

      setGalleryUploadState(false);

    }

  }
);

/* =========================
   DRAG & DROP
========================= */

galleryUploadZone?.addEventListener(
  "dragover",
  (event)=>{

    event.preventDefault();

    galleryUploadZone.classList.add(
      "dragging"
    );

  }
);

galleryUploadZone?.addEventListener(
  "dragleave",
  ()=>{

    galleryUploadZone.classList.remove(
      "dragging"
    );

  }
);

galleryUploadZone?.addEventListener(
  "drop",
  (event)=>{

    event.preventDefault();

    galleryUploadZone.classList.remove(
      "dragging"
    );

    selectedGalleryFiles=
      Array.from(
        event.dataTransfer.files
      );

    renderGalleryPreview();

  }
);

/* =========================
   РЕДАКТИРОВАНИЕ ФОТОГРАФИИ
========================= */

function openEditGalleryModal(id) {
  const item = galleryItems.find(
    (galleryItem) =>
      String(galleryItem.id) === String(id)
  );

  if (!item) return;

  editGalleryId.value = item.id;
  editGalleryTitle.value = item.title || "";
  editGalleryCategory.value =
    item.category || "Община";
  editGalleryPublished.checked =
    Boolean(item.published);

  editGalleryImage.src = item.image;
  editGalleryImage.alt =
    item.title || "Фотография галереи";

  editGalleryError.textContent = "";

  editGalleryModal.classList.add("active");
  editGalleryModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "admin-body-locked"
  );
}

function closeEditGalleryModal() {
  if (galleryIsSaving) return;

  editGalleryModal.classList.remove("active");
  editGalleryModal.setAttribute(
    "aria-hidden",
    "true"
  );

  editGalleryForm.reset();
  editGalleryId.value = "";
  editGalleryImage.src = "";
  editGalleryError.textContent = "";

  document.body.classList.remove(
    "admin-body-locked"
  );

  setGalleryEditState(false);
}

closeEditGalleryButton?.addEventListener(
  "click",
  closeEditGalleryModal
);

cancelEditGalleryButton?.addEventListener(
  "click",
  closeEditGalleryModal
);

editGalleryModal?.addEventListener(
  "click",
  (event) => {
    if (event.target === editGalleryModal) {
      closeEditGalleryModal();
    }
  }
);

editGalleryForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (galleryIsSaving) return;

    const id = editGalleryId.value;

    if (!id) {
      editGalleryError.textContent =
        "Не удалось определить фотографию.";
      return;
    }

    const data = {
      title:
        editGalleryTitle.value.trim(),
      category:
        editGalleryCategory.value,
      published:
        editGalleryPublished.checked
    };

    editGalleryError.textContent = "";
    setGalleryEditState(true);

    try {
      const updatedItem =
        await apiUpdateGalleryItem(
          id,
          data
        );

      galleryItems = galleryItems.map(
        (item) =>
          String(item.id) === String(id)
            ? updatedItem
            : item
      );

      renderGalleryItems();
      closeEditGalleryModal();
    } catch (error) {
      console.error(
        "Ошибка редактирования фотографии:",
        error
      );

      editGalleryError.textContent =
        error.message ||
        "Не удалось сохранить изменения.";
    } finally {
      setGalleryEditState(false);
    }
  }
);

/* =========================
   УДАЛЕНИЕ ФОТОГРАФИИ
========================= */

function openDeleteGalleryModal(id) {
  galleryIdToDelete = id;

  deleteGalleryModal.classList.add(
    "active"
  );

  deleteGalleryModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "admin-body-locked"
  );
}

function closeDeleteGalleryModal() {
  galleryIdToDelete = null;

  deleteGalleryModal.classList.remove(
    "active"
  );

  deleteGalleryModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "admin-body-locked"
  );
}

cancelDeleteGalleryButton?.addEventListener(
  "click",
  closeDeleteGalleryModal
);

confirmDeleteGalleryButton?.addEventListener(
  "click",
  async () => {
    if (!galleryIdToDelete) return;

    confirmDeleteGalleryButton.disabled =
      true;

    confirmDeleteGalleryButton.textContent =
      "Удаление...";

    try {
      await apiDeleteGalleryItem(
        galleryIdToDelete
      );

      galleryItems = galleryItems.filter(
        (item) =>
          String(item.id) !==
          String(galleryIdToDelete)
      );

      renderGalleryItems();
      closeDeleteGalleryModal();
    } catch (error) {
      console.error(
        "Ошибка удаления фотографии:",
        error
      );

      alert(
        error.message ||
        "Не удалось удалить фотографию."
      );
    } finally {
      confirmDeleteGalleryButton.disabled =
        false;

      confirmDeleteGalleryButton.textContent =
        "Удалить";
    }
  }
);

deleteGalleryModal?.addEventListener(
  "click",
  (event) => {
    if (
      event.target === deleteGalleryModal
    ) {
      closeDeleteGalleryModal();
    }
  }
);

/* =========================
   КЛАВИША ESCAPE
========================= */

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Escape") return;

    if (
      editGalleryModal?.classList.contains(
        "active"
      )
    ) {
      closeEditGalleryModal();
    }

    if (
      deleteGalleryModal?.classList.contains(
        "active"
      )
    ) {
      closeDeleteGalleryModal();
    }
  }
);

/* =========================
   ЗАПУСК
========================= */

loadGallery();