async function requireAdminSession() {
  try {
    const response = await fetch(
      "/api/auth/me",
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      window.location.replace(
        "/admin/login.html"
      );

      return null;
    }

    const data = await response.json();

    return data.admin;
  } catch (error) {
    console.error(
      "Ошибка проверки входа:",
      error
    );

    window.location.replace(
      "/admin/login.html"
    );

    return null;
  }
}

async function logoutAdmin() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",

      headers: {
        Accept: "application/json"
      }
    });
  } finally {
    window.location.replace(
      "/admin/login.html"
    );
  }
}

window.AdminAuth = {
  requireAdminSession,
  logoutAdmin
};