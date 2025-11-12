document.addEventListener("DOMContentLoaded", () => {
  const pendingSection = document.querySelector(".pending");
  const appointmentsSection = document.querySelector(".appointments");

  document.querySelectorAll(".pending-card").forEach(card => {
    const acceptBtn = card.querySelector(".accept");
    const declineBtn = card.querySelector(".decline");

    declineBtn.addEventListener("click", () => {
      card.remove();
    });

    acceptBtn.addEventListener("click", () => {
      const name = card.querySelector("h4").textContent;
      const details = card.querySelector("p").textContent;

      const newCard = document.createElement("div");
      newCard.classList.add("appointment-card", "blue"); 
      newCard.innerHTML = `
        <span class="avatar">${getInitials(name)}</span>
        <div>
          <h4>${name}</h4>
          <p>${details.split("–")[0].trim()}</p>
          <span>${details.split("–")[1]?.trim() || "Scheduled soon"}</span>
        </div>
        <button class="navigate-btn">Navigate</button>
      `;

      appointmentsSection.appendChild(newCard);

      card.remove();

      newCard.style.transition = "transform 0.3s ease";
      newCard.style.transform = "scale(1.05)";
      setTimeout(() => (newCard.style.transform = "scale(1)"), 200);
    });
  });

  function getInitials(name) {
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("navigate-btn")) {
      alert("Opening navigation for appointment...");
    }
  });
});
