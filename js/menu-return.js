const RETURN_TO_GAME_STORAGE_KEY = "lab-zero-return-to-game";

function markReturnToGame() {
  sessionStorage.setItem(RETURN_TO_GAME_STORAGE_KEY, "true");
}

document.querySelectorAll("[data-return-to-game]").forEach((link) => {
  link.addEventListener("click", markReturnToGame);
});
