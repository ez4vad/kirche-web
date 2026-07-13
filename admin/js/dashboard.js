const temporaryAdminAccess =
  sessionStorage.getItem("temporaryAdminAccess");

if (temporaryAdminAccess !== "true") {
  window.location.href = "login.html";
}
const todayVisitors =
document.getElementById(
"todayVisitors"
);

const todayViews =
document.getElementById(
"todayViews"
);

const todayOnline =
document.getElementById(
"todayOnline"
);

const totalViews =
document.getElementById(
"totalViews"
);

const topPagesList =
document.getElementById(
"topPagesList"
);

const analyticsChart =
document.getElementById(
"analyticsChart"
);

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
  document.getElementById("adminSidebarOverlay");

const adminLogoutButton =
  document.getElementById("adminLogoutButton");

function openAdminSidebar() {
  adminSidebar?.classList.add("active");
  adminSidebarOverlay?.classList.add("active");

  document.body.classList.add(
    "admin-body-locked"
  );
}

function closeAdminSidebar() {
  adminSidebar?.classList.remove("active");
  adminSidebarOverlay?.classList.remove("active");

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
   ЭЛЕМЕНТЫ DASHBOARD
========================= */

const dashboardNewsCount =
  document.getElementById(
    "dashboardNewsCount"
  );

const dashboardEventsCount =
  document.getElementById(
    "dashboardEventsCount"
  );

const dashboardGalleryCount =
  document.getElementById(
    "dashboardGalleryCount"
  );

const dashboardPrayerCount =
  document.getElementById(
    "dashboardPrayerCount"
  );

const dashboardPrayerCard =
  document.getElementById(
    "dashboardPrayerCard"
  );

const dashboardUpcomingEvents =
  document.getElementById(
    "dashboardUpcomingEvents"
  );

const dashboardLatestNews =
  document.getElementById(
    "dashboardLatestNews"
  );

const dashboardLatestPrayers =
  document.getElementById(
    "dashboardLatestPrayers"
  );
async function loadAnalytics(){

const analytics=
await fetchJson(
"/api/admin/analytics/summary"
);

todayVisitors.textContent=
analytics.today.visitors;

todayViews.textContent=
analytics.today.pageviews;

todayOnline.textContent=
analytics.today.online;

totalViews.textContent=
analytics.total.pageviews;

topPagesList.innerHTML=
analytics.topPages
.map(page=>{

return`

<div class="top-page">

<div>

<strong>

${page.title || page.path}

</strong>

<small>

${page.path}

</small>

</div>

<span>

${page.views}

</span>

</div>

`;

}).join("");

drawAnalyticsChart(
analytics.visitsByDay
);

}

function drawAnalyticsChart(data){

if(!analyticsChart)return;

const ctx=
analyticsChart.getContext("2d");

const width=
analyticsChart.width;

const height=
analyticsChart.height;

ctx.clearRect(
0,
0,
width,
height
);

if(data.length===0){
return;
}

const max=Math.max(
...data.map(
d=>d.pageviews
),
1
);

ctx.beginPath();

ctx.lineWidth=3;

ctx.strokeStyle="#32AEE2";

data.forEach((day,index)=>{

const x=
index*
(width/(data.length-1));

const y=
height-
(day.pageviews/max)
*(height-20);

if(index===0){

ctx.moveTo(x,y);

}else{

ctx.lineTo(x,y);

}

});

ctx.stroke();

}
/* =========================
   ПОМОЩНИКИ
========================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const normalizedValue =
    String(dateValue).includes("T")
      ? dateValue
      : `${dateValue}T12:00:00`;

  const date =
    new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  ).format(date);
}

function formatDateTime(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue || "";
  }

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    let message =
      "Не удалось загрузить данные.";

    try {
      const data = await response.json();

      if (data.error) {
        message = data.error;
      }
    } catch {
      // Ответ сервера не является JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

function showDashboardError(
  container,
  message
) {
  if (!container) return;

  container.innerHTML = `
    <div class="admin-dashboard-empty">
      ${escapeHtml(message)}
    </div>
  `;
}

/* =========================
   СОБЫТИЯ
========================= */

function renderUpcomingEvents(events) {
  if (!dashboardUpcomingEvents) return;

  const now = new Date();

  const upcomingEvents = events
    .filter((event) => {
      const eventDate = new Date(
        `${event.date}T${event.time || "00:00"}`
      );

      return (
        !Number.isNaN(eventDate.getTime()) &&
        eventDate >= now
      );
    })
    .sort((a, b) => {
      return `${a.date}T${a.time}`
        .localeCompare(
          `${b.date}T${b.time}`
        );
    });

  dashboardEventsCount.textContent =
    String(upcomingEvents.length);

  if (upcomingEvents.length === 0) {
    dashboardUpcomingEvents.innerHTML = `
      <div class="admin-dashboard-empty">
        Ближайших событий пока нет.
      </div>
    `;

    return;
  }

  dashboardUpcomingEvents.innerHTML =
    upcomingEvents
      .slice(0, 4)
      .map((event) => {
        return `
          <a
            href="events.html"
            class="admin-dashboard-list-item"
          >
            <div class="admin-dashboard-item-icon">
              ◫
            </div>

            <div class="admin-dashboard-item-content">
              <strong>
                ${escapeHtml(event.title)}
              </strong>

              <span>
                ${escapeHtml(
                  formatDate(event.date)
                )}
                ·
                ${escapeHtml(event.time)}
              </span>

              <small>
                ${escapeHtml(event.place)}
              </small>
            </div>

            <span class="admin-dashboard-arrow">
              →
            </span>
          </a>
        `;
      })
      .join("");
}

/* =========================
   НОВОСТИ
========================= */

function renderLatestNews(newsItems) {
  if (!dashboardLatestNews) return;

  dashboardNewsCount.textContent =
    String(newsItems.length);

  if (newsItems.length === 0) {
    dashboardLatestNews.innerHTML = `
      <div class="admin-dashboard-empty">
        Новостей пока нет.
      </div>
    `;

    return;
  }

  const sortedNews = [...newsItems]
    .sort((a, b) => {
      return String(b.date)
        .localeCompare(String(a.date));
    })
    .slice(0, 4);

  dashboardLatestNews.innerHTML =
    sortedNews
      .map((item) => {
        return `
          <a
            href="news.html"
            class="admin-dashboard-list-item"
          >
            ${
              item.image
                ? `
                  <img
                    class="admin-dashboard-item-image"
                    src="${escapeHtml(item.image)}"
                    alt="${escapeHtml(item.title)}"
                  >
                `
                : `
                  <div class="admin-dashboard-item-icon">
                    ▤
                  </div>
                `
            }

            <div class="admin-dashboard-item-content">
              <strong>
                ${escapeHtml(item.title)}
              </strong>

              <span>
                ${escapeHtml(
                  formatDate(item.date)
                )}
              </span>

              <small>
                ${
                  item.published
                    ? "Опубликовано"
                    : "Скрыто"
                }
              </small>
            </div>

            <span class="admin-dashboard-arrow">
              →
            </span>
          </a>
        `;
      })
      .join("");
}

/* =========================
   ГАЛЕРЕЯ
========================= */

function renderGalleryCount(galleryItems) {
  dashboardGalleryCount.textContent =
    String(galleryItems.length);
}

/* =========================
   МОЛИТВЕННЫЕ ЗАПРОСЫ
========================= */

function renderLatestPrayers(requests) {
  if (!dashboardLatestPrayers) return;

  const newRequests = requests.filter(
    (item) => item.status === "new"
  );

  dashboardPrayerCount.textContent =
    String(newRequests.length);

  dashboardPrayerCard?.classList.toggle(
    "has-new-items",
    newRequests.length > 0
  );

  if (newRequests.length === 0) {
    dashboardLatestPrayers.innerHTML = `
      <div class="admin-dashboard-empty">
        Новых молитвенных запросов нет.
      </div>
    `;

    return;
  }

  dashboardLatestPrayers.innerHTML =
    newRequests
      .slice(0, 4)
      .map((item) => {
        const name = item.anonymous
          ? "Анонимно"
          : item.name || "Без имени";

        return `
          <a
            href="prayer.html"
            class="admin-dashboard-list-item"
          >
            <div class="admin-dashboard-item-icon prayer">
              ♡
            </div>

            <div class="admin-dashboard-item-content">
              <strong>
                ${escapeHtml(name)}
              </strong>

              <span>
                ${escapeHtml(
                  formatDateTime(
                    item.createdAt
                  )
                )}
              </span>

              <small class="admin-dashboard-prayer-text">
                ${escapeHtml(item.request)}
              </small>
            </div>

            <span class="admin-dashboard-arrow">
              →
            </span>
          </a>
        `;
      })
      .join("");
}

/* =========================
   ЗАГРУЗКА DASHBOARD
========================= */

async function loadDashboardData() {
  const results =
    await Promise.allSettled([
      fetchJson("/api/admin/events"),
      fetchJson("/api/admin/news"),
      fetchJson("/api/admin/gallery"),
      fetchJson(
        "/api/admin/prayer-requests"
      )
    ]);

  const [
    eventsResult,
    newsResult,
    galleryResult,
    prayerResult
  ] = results;

  if (
    eventsResult.status === "fulfilled"
  ) {
    const events =
      Array.isArray(eventsResult.value)
        ? eventsResult.value
        : [];

    renderUpcomingEvents(events);
  } else {
    dashboardEventsCount.textContent =
      "—";

    showDashboardError(
      dashboardUpcomingEvents,
      "Не удалось загрузить события."
    );

    console.error(
      eventsResult.reason
    );
  }

  if (
    newsResult.status === "fulfilled"
  ) {
    const newsItems =
      Array.isArray(newsResult.value)
        ? newsResult.value
        : [];

    renderLatestNews(newsItems);
  } else {
    dashboardNewsCount.textContent =
      "—";

    showDashboardError(
      dashboardLatestNews,
      "Не удалось загрузить новости."
    );

    console.error(
      newsResult.reason
    );
  }

  if (
    galleryResult.status === "fulfilled"
  ) {
    const galleryItems =
      Array.isArray(galleryResult.value)
        ? galleryResult.value
        : [];

    renderGalleryCount(galleryItems);
  } else {
    dashboardGalleryCount.textContent =
      "—";

    console.error(
      galleryResult.reason
    );
  }

  if (
    prayerResult.status === "fulfilled"
  ) {
    const requests =
      Array.isArray(prayerResult.value)
        ? prayerResult.value
        : [];

    renderLatestPrayers(requests);
  } else {
    dashboardPrayerCount.textContent =
      "—";

    showDashboardError(
      dashboardLatestPrayers,
      "Не удалось загрузить запросы."
    );

    console.error(
      prayerResult.reason
    );
  }
}

Promise.all([

loadDashboardData(),

loadAnalytics()

]);