function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  playClickSound();
}

function playClickSound() {
  if (!gameSettings.soundEnabled) return;
  try {
    const s = game.sound.get("click");
    if (s) game.sound.play("click", { volume: gameSettings.volume });
  } catch (e) {}
}

function initMenu() {
  // Navigasi tombol
  document.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", () => {
      const action = el.dataset.action;
      if (action === "play") {
        showScreen("game-screen");
        initGameUI();
      } else if (action === "howto") {
        showScreen("howto-screen");
      } else if (action === "settings") {
        showScreen("settings-screen");
      } else if (action === "back-to-menu") {
        showScreen("menu-screen");
      }
    });
  });

  // Sound toggle
  const soundBtn = document.getElementById("setting-sound");
  soundBtn.addEventListener("click", () => {
    gameSettings.soundEnabled = !gameSettings.soundEnabled;
    soundBtn.textContent = gameSettings.soundEnabled ? "ON" : "OFF";
    soundBtn.classList.toggle("off", !gameSettings.soundEnabled);
    if (gameSettings.soundEnabled) playClickSound();
  });

  // Volume slider
  const volSlider = document.getElementById("setting-volume");
  const volValue = document.getElementById("volume-value");
  volSlider.addEventListener("input", (e) => {
    gameSettings.volume = e.target.value / 100;
    volValue.textContent = e.target.value + "%";
  });

  // Difficulty
  const diffDescs = {
    easy: "AI santai, King HP 15. Cocok buat belajar.",
    normal: "Balance. King HP 20. Recommended.",
    hard: "AI agresif, King HP 25, AP AI +2. Buat pro.",
  };

  document.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".diff-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      gameSettings.difficulty = btn.dataset.diff;
      document.getElementById("difficulty-desc").textContent = diffDescs[btn.dataset.diff];
      playClickSound();
    });
  });
}