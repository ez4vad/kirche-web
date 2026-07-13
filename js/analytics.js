/* =========================
   АНАЛИТИКА САЙТА
========================= */

const ANALYTICS_SESSION_KEY =
  "philadelphiaAnalyticsSession";

function createAnalyticsSessionId() {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID ===
      "function"
  ) {
    return window.crypto.randomUUID();
  }

  return [
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2)
  ].join("-");
}

function getAnalyticsSessionId() {
  let sessionId = sessionStorage.getItem(
    ANALYTICS_SESSION_KEY
  );

  if (!sessionId) {
    sessionId =
      createAnalyticsSessionId();

    sessionStorage.setItem(
      ANALYTICS_SESSION_KEY,
      sessionId
    );
  }

  return sessionId;
}

function getDeviceType() {
  const width = window.innerWidth;

  const userAgent =
    navigator.userAgent.toLowerCase();

  const isTablet =
    /ipad|tablet|kindle|silk/.test(
      userAgent
    ) ||
    (width >= 600 && width <= 1024);

  if (isTablet) {
    return "tablet";
  }

  if (width < 600) {
    return "mobile";
  }

  return "desktop";
}

async function trackPageView() {
  /*
    Админку не учитываем.
  */
  if (
    window.location.pathname.startsWith(
      "/admin/"
    )
  ) {
    return;
  }

  const data = {
    sessionId: getAnalyticsSessionId(),

    pagePath:
      window.location.pathname +
      window.location.search,

    pageTitle: document.title,

    referrer: document.referrer,

    deviceType: getDeviceType()
  };

  try {
    await fetch(
      "/api/analytics/track",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify(data),

        keepalive: true
      }
    );
  } catch (error) {
    /*
      Ошибка аналитики не должна
      мешать работе сайта.
    */
    console.error(
      "Не удалось записать просмотр:",
      error
    );
  }
}

trackPageView();