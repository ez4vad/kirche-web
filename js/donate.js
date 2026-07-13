const burgerBtn = document.getElementById("burgerBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (burgerBtn && mobileMenu) {
  burgerBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("active");

    burgerBtn.setAttribute("aria-expanded", String(isOpen));
  });
}

const copyButtons = document.querySelectorAll(".copy-button");

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;

    try {
      await navigator.clipboard.writeText(value);

      const oldText = button.textContent;
      button.textContent = "Скопировано";

      setTimeout(() => {
        button.textContent = oldText;
      }, 1500);
    } catch (error) {
      console.error("Не удалось скопировать:", error);
      button.textContent = "Ошибка";
    }
  });
});

document
  .querySelectorAll(".copy-button")
  .forEach((button) => {
    button.addEventListener(
      "click",
      async () => {
        const value =
          button.dataset.copy || "";

        const originalText =
          button.textContent;

        try {
          await navigator.clipboard.writeText(
            value
          );

          button.textContent = "Скопировано";
          button.classList.add("copied");

          setTimeout(() => {
            button.textContent =
              originalText;

            button.classList.remove(
              "copied"
            );
          }, 1800);
        } catch (error) {
          console.error(
            "Не удалось скопировать:",
            error
          );

          button.textContent = "Ошибка";

          setTimeout(() => {
            button.textContent =
              originalText;
          }, 1800);
        }
      }
    );
  });