const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginInput = document.getElementById("adminLogin");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginError = document.getElementById("adminLoginError");
const passwordToggle = document.getElementById("passwordToggle");

passwordToggle.addEventListener("click", () => {
  const passwordIsHidden =
    adminPasswordInput.type === "password";

  adminPasswordInput.type =
    passwordIsHidden ? "text" : "password";

  passwordToggle.textContent =
    passwordIsHidden ? "🙈" : "👁";

  passwordToggle.setAttribute(
    "aria-label",
    passwordIsHidden
      ? "Скрыть пароль"
      : "Показать пароль"
  );
});

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const login = adminLoginInput.value.trim();
  const password = adminPasswordInput.value;

  adminLoginError.textContent = "";

  if (!login || !password) {
    adminLoginError.textContent =
      "Введите логин и пароль.";
    return;
  }

  /*
    Временные тестовые данные.

    В настоящем проекте пароль нельзя проверять
    внутри JavaScript и нельзя хранить в браузере.
    Позже эту проверку заменит backend.
  */

  const temporaryAdminLogin = "admin";
  const temporaryAdminPassword = "admin";

  const credentialsAreCorrect =
    login === temporaryAdminLogin &&
    password === temporaryAdminPassword;

  if (!credentialsAreCorrect) {
    adminLoginError.textContent =
      "Неверный логин или пароль.";
    return;
  }

  sessionStorage.setItem(
    "temporaryAdminAccess",
    "true"
  );

  window.location.href = "dashboard.html";
});