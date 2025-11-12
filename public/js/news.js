document.addEventListener("DOMContentLoaded", () => {
  const viewButtons = document.querySelectorAll(".btn-view");
  const hearts = document.querySelectorAll(".fa-heart");

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".news-card");
      const viewCount = card.querySelector(".view-count");
      let count = parseInt(viewCount.textContent);
      viewCount.textContent = count + 1;
    });
  });

  hearts.forEach((heart) => {
    heart.addEventListener("click", () => {
      heart.classList.toggle("liked");
    });
  });
});
