const adminLoginForm =
  document.getElementById("adminLoginForm");

const adminLoginInput =
  document.getElementById("adminLogin");

const adminPasswordInput =
  document.getElementById("adminPassword");

const adminLoginError =
  document.getElementById("adminLoginError");

const passwordToggle =
  document.getElementById("passwordToggle");

const submitButton =
  adminLoginForm?.querySelector(
    'button[type="submit"]'
  );

passwordToggle?.addEventListener(
  "click",
  () => {
    const isHidden =
      adminPasswordInput.type === "password";

    adminPasswordInput.type =
      isHidden ? "text" : "password";

    passwordToggle.textContent =
      isHidden ? "🙈" : "👁";

    passwordToggle.setAttribute(
      "aria-label",
      isHidden
        ? "Скрыть пароль"
        : "Показать пароль"
    );
  }
);

async function checkExistingSession() {
  try {
    const response = await fetch(
      "/api/auth/me",
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (response.ok) {
      window.location.href =
        "dashboard.html";
    }
  } catch (error) {
    console.error(
      "Ошибка проверки сессии:",
      error
    );
  }
}

adminLoginForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const username =
      adminLoginInput.value.trim();

    const password =
      adminPasswordInput.value;

    adminLoginError.textContent = "";

    if (!username || !password) {
      adminLoginError.textContent =
        "Введите логин и пароль.";

      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Вход...";

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },

          body: JSON.stringify({
            username,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Не удалось выполнить вход."
        );
      }

      window.location.href =
        "dashboard.html";
    } catch (error) {
      adminLoginError.textContent =
        error.message ||
        "Не удалось выполнить вход.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Войти";
    }
  }
);

checkExistingSession();