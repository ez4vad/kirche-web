const temporaryAdminAccess =
  sessionStorage.getItem("temporaryAdminAccess");

if (temporaryAdminAccess !== "true") {
  window.location.href = "login.html";
}

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

adminMenuButton.addEventListener(
  "click",
  openAdminSidebar
);

adminSidebarClose.addEventListener(
  "click",
  closeAdminSidebar
);

adminSidebarOverlay.addEventListener(
  "click",
  closeAdminSidebar
);

adminSidebar
  .querySelectorAll("a")
  .forEach((link) => {
    link.addEventListener("click", closeAdminSidebar);
  });

adminLogoutButton.addEventListener("click", () => {
  sessionStorage.removeItem("temporaryAdminAccess");
  window.location.href = "login.html";
});