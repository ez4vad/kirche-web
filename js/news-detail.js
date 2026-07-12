const burgerBtn = document.getElementById("burgerBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (burgerBtn && mobileMenu) {
  burgerBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
  });
}

const newsData = [
  {
    id: 1,
    title: "Воскресное служение в церкви «Филадельфия»",
    category: "Богослужение",
    date: "12 июля 2026",
    image: "images/news-1.jpg",
    shortDescription:
      "Приглашаем провести воскресный день вместе в молитве, прославлении и общении.",
    content: [
      "Каждое воскресенье мы собираемся вместе, чтобы поклоняться Богу, молиться и слушать Божье Слово.",
      "После служения остаётся время для общения, знакомства и совместной трапезы.",
      "Мы будем рады видеть каждого. Приходи таким, какой ты есть."
    ]
  },

  {
    id: 2,
    title: "Молодёжная встреча: вера, дружба и честные вопросы",
    category: "Молодёжь",
    date: "5 июля 2026",
    image: "images/news-2.jpg",
    shortDescription:
      "Вечер для молодых людей, где можно общаться, задавать вопросы и вместе узнавать Бога.",
    content: [
      "Молодёжные встречи — это место для настоящего общения, дружбы и духовного роста.",
      "Мы говорим о вере, отношениях, выборе, будущем и других важных темах.",
      "Здесь можно задавать честные вопросы и быть собой."
    ]
  },

  {
    id: 3,
    title: "Время общения и тёплый обед после служения",
    category: "Община",
    date: "28 июня 2026",
    image: "images/news-3.jpg",
    shortDescription:
      "После богослужения мы остаёмся вместе, знакомимся и разделяем трапезу.",
    content: [
      "Общение после служения — важная часть жизни нашей церкви.",
      "За одним столом мы знакомимся, поддерживаем друг друга и строим настоящие отношения.",
      "Кухонное служение помогает создавать тёплую и гостеприимную атмосферу."
    ]
  }
];

const newsDetail = document.getElementById("newsDetail");
const params = new URLSearchParams(window.location.search);
const newsId = Number(params.get("id"));

const currentNews = newsData.find((newsItem) => newsItem.id === newsId);

if (!currentNews) {
  newsDetail.innerHTML = `
    <section class="news-not-found">
      <h1>Новость не найдена</h1>
      <p>Возможно, она была удалена или ссылка указана неправильно.</p>
      <a href="news.html" class="news-back-btn">Вернуться к новостям</a>
    </section>
  `;
} else {
  document.title = `${currentNews.title} | Philadelphia`;

  const contentParagraphs = currentNews.content
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");

  newsDetail.innerHTML = `
    <div class="news-detail-image">
      <img src="${currentNews.image}" alt="${currentNews.title}">
      <span>${currentNews.category}</span>
    </div>

    <div class="news-detail-content">
      <time>${currentNews.date}</time>

      <h1>${currentNews.title}</h1>

      <p class="news-detail-lead">
        ${currentNews.shortDescription}
      </p>

      <div class="news-detail-text">
        ${contentParagraphs}
      </div>

      <a href="news.html" class="news-back-btn">
        ← Все новости
      </a>
    </div>
  `;
}