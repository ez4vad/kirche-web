const burgerBtn = document.getElementById("burgerBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (burgerBtn && mobileMenu) {
  burgerBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("active");

    burgerBtn.setAttribute("aria-expanded", String(isOpen));
  });
}

const prayerForm = document.getElementById("prayerForm");
const prayerName = document.getElementById("prayerName");
const prayerContact = document.getElementById("prayerContact");
const prayerText = document.getElementById("prayerText");
const anonymousRequest = document.getElementById("anonymousRequest");
const privacyConsent = document.getElementById("privacyConsent");

const prayerError = document.getElementById("prayerError");
const privacyError = document.getElementById("privacyError");
const characterCounter = document.getElementById("characterCounter");

const prayerSuccess = document.getElementById("prayerSuccess");
const sendAnotherRequest = document.getElementById(
  "sendAnotherRequest"
);

function updateCharacterCounter() {
  characterCounter.textContent = `${prayerText.value.length} / 2000`;
}

prayerText.addEventListener("input", () => {
  updateCharacterCounter();

  if (prayerText.value.trim().length >= 10) {
    prayerError.textContent = "";
    prayerText.classList.remove("input-error");
  }
});

anonymousRequest.addEventListener("change", () => {
  if (anonymousRequest.checked) {
    prayerName.value = "";
    prayerName.disabled = true;
    prayerName.placeholder = "Запрос будет отправлен анонимно";
  } else {
    prayerName.disabled = false;
    prayerName.placeholder = "Как к вам обращаться?";
  }
});

privacyConsent.addEventListener("change", () => {
  if (privacyConsent.checked) {
    privacyError.textContent = "";
  }
});

prayerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const requestText = prayerText.value.trim();

  prayerError.textContent = "";
  privacyError.textContent = "";
  prayerText.classList.remove("input-error");

  let formIsValid = true;

  if (requestText.length < 10) {
    prayerError.textContent =
      "Напишите молитвенный запрос минимум из 10 символов.";

    prayerText.classList.add("input-error");
    formIsValid = false;
  }

  if (!privacyConsent.checked) {
    privacyError.textContent =
      "Необходимо подтвердить согласие на обработку данных.";

    formIsValid = false;
  }

  if (!formIsValid) {
    return;
  }

  const prayerRequest = {
    name: anonymousRequest.checked
      ? "Анонимно"
      : prayerName.value.trim(),

    contact: prayerContact.value.trim(),
    request: requestText,
    anonymous: anonymousRequest.checked,
   
  };

 const submitButton =
  prayerForm.querySelector(
    'button[type="submit"]'
  );

submitButton.disabled = true;
submitButton.innerHTML =
  "<span>⏳</span> Отправка...";

try {

  const response = await fetch(
    "/api/prayer-requests",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },

      body: JSON.stringify(
        prayerRequest
      )
    }
  );

  if (!response.ok) {

    const data =
      await response.json();

    throw new Error(
      data.error ||
      "Не удалось отправить запрос."
    );

  }

  prayerForm.hidden = true;

  prayerSuccess.classList.add(
    "active"
  );

  prayerSuccess.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

} catch (error) {

  console.error(error);

  prayerError.textContent =
    error.message;

} finally {

  submitButton.disabled = false;

  submitButton.innerHTML =
    "<span>🙏</span> Отправить молитвенный запрос";

}});

sendAnotherRequest.addEventListener("click", () => {
  prayerForm.reset();

  prayerName.disabled = false;
  prayerName.placeholder = "Как к вам обращаться?";

  prayerText.classList.remove("input-error");
  prayerError.textContent = "";
  privacyError.textContent = "";

  updateCharacterCounter();

  prayerSuccess.classList.remove("active");
  prayerForm.hidden = false;

  prayerForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

updateCharacterCounter();
