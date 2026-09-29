// ===== SCREEN NAVIGATION =====
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  playClickSound();

  // BGM behavior per screen
  if (id === "game-screen") {
    // Masuk gameplay → BGM mati
    AudioManager.stopBGM();
  } else {
    // Menu / howto / settings → BGM main
    if (gameSettings.bgmEnabled) {
      AudioManager.playBGM(gameSettings.bgmTrack);
    }
  }
}

function playClickSound() {
  if (!gameSettings.soundEnabled) return;
  try {
    if (game && game.sound && game.sound.get("click")) {
      game.sound.play("click", { volume: gameSettings.volume });
    }
  } catch (e) {}
}

// ===== INIT MENU =====
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
  if (soundBtn) {
    soundBtn.textContent = gameSettings.soundEnabled ? "ON" : "OFF";
    soundBtn.classList.toggle("off", !gameSettings.soundEnabled);
    soundBtn.addEventListener("click", () => {
      gameSettings.soundEnabled = !gameSettings.soundEnabled;
      soundBtn.textContent = gameSettings.soundEnabled ? "ON" : "OFF";
      soundBtn.classList.toggle("off", !gameSettings.soundEnabled);
      if (gameSettings.soundEnabled) playClickSound();
      saveSettings();
    });
  }

  // Volume slider (SFX)
  const volSlider = document.getElementById("setting-volume");
  const volValue = document.getElementById("volume-value");
  if (volSlider && volValue) {
    volSlider.value = Math.round(gameSettings.volume * 100);
    volValue.textContent = Math.round(gameSettings.volume * 100) + "%";
    volSlider.addEventListener("input", (e) => {
      gameSettings.volume = e.target.value / 100;
      volValue.textContent = e.target.value + "%";
      AudioManager.setVolume(gameSettings.volume);
      saveSettings();
    });
  }

  // BGM toggle
  const bgmBtn = document.getElementById("setting-bgm");
  if (bgmBtn) {
    bgmBtn.textContent = gameSettings.bgmEnabled ? "ON" : "OFF";
    bgmBtn.classList.toggle("off", !gameSettings.bgmEnabled);
    bgmBtn.addEventListener("click", () => {
      gameSettings.bgmEnabled = !gameSettings.bgmEnabled;
      bgmBtn.textContent = gameSettings.bgmEnabled ? "ON" : "OFF";
      bgmBtn.classList.toggle("off", !gameSettings.bgmEnabled);
      if (gameSettings.bgmEnabled) {
        AudioManager.playBGM(gameSettings.bgmTrack);
      } else {
        AudioManager.stopBGM();
      }
      saveSettings();
    });
  }

  // BGM volume slider
  const bgmSlider = document.getElementById("setting-bgm-volume");
  const bgmValue = document.getElementById("bgm-volume-value");
  if (bgmSlider && bgmValue) {
    bgmSlider.value = Math.round(gameSettings.bgmVolume * 100);
    bgmValue.textContent = Math.round(gameSettings.bgmVolume * 100) + "%";
    bgmSlider.addEventListener("input", (e) => {
      gameSettings.bgmVolume = e.target.value / 100;
      bgmValue.textContent = e.target.value + "%";
      AudioManager.setBgmVolume(gameSettings.bgmVolume);
      saveSettings();
    });
  }

  // Song selector
  document.querySelectorAll(".song-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const track = parseInt(btn.dataset.track);
      document.querySelectorAll(".song-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      gameSettings.bgmTrack = track;
      AudioManager.playBGM(track);
      saveSettings();
      playClickSound();
    });
  });

  // Set initial active song
  const activeSong = document.querySelector(`.song-btn[data-track="${gameSettings.bgmTrack}"]`);
  if (activeSong) {
    document.querySelectorAll(".song-btn").forEach((b) => b.classList.remove("active"));
    activeSong.classList.add("active");
  }

  // Difficulty
  const diffDescs = {
    easy: "AI santai, King HP 18. Cocok buat belajar.",
    normal: "Balance. King HP 25. Recommended.",
    hard: "AI agresif, King HP 30, AP +2. Buat pro.",
  };

  document.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".diff-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      gameSettings.difficulty = btn.dataset.diff;
      const descEl = document.getElementById("difficulty-desc");
      if (descEl) descEl.textContent = diffDescs[btn.dataset.diff];
      playClickSound();
      saveSettings();
    });
  });

  // Set initial difficulty active
  const activeDiff = document.querySelector(`.diff-btn[data-diff="${gameSettings.difficulty}"]`);
  if (activeDiff) {
    document.querySelectorAll(".diff-btn").forEach((b) => b.classList.remove("active"));
    activeDiff.classList.add("active");
    const descEl = document.getElementById("difficulty-desc");
    if (descEl) descEl.textContent = diffDescs[gameSettings.difficulty];
  }

  // Start hero rotation
  startHeroRotation();

  // BGM autoplay attempt
  // Browsers block autoplay sampai user interaksi — jadi tunggu klik pertama
  const startBgmOnFirstClick = () => {
    if (gameSettings.bgmEnabled) {
      AudioManager.initBGM();
    }
    document.removeEventListener("click", startBgmOnFirstClick);
    document.removeEventListener("touchstart", startBgmOnFirstClick);
  };
  document.addEventListener("click", startBgmOnFirstClick, { once: true });
  document.addEventListener("touchstart", startBgmOnFirstClick, { once: true });
}

// ===== HERO ROTATION FOR LANDING =====
let _heroRotationInterval = null;
let _currentHeroIndex = 0;

function startHeroRotation() {
  if (_heroRotationInterval) clearInterval(_heroRotationInterval);
  if (typeof HEROES === "undefined") return;

  const heroes = Object.values(HEROES);
  _currentHeroIndex = 0;

  updateHeroPreview(heroes[0], 0);

  _heroRotationInterval = setInterval(() => {
    _currentHeroIndex = (_currentHeroIndex + 1) % heroes.length;
    updateHeroPreview(heroes[_currentHeroIndex], _currentHeroIndex);
  }, 3000);
}

function updateHeroPreview(hero, index) {
  const card = document.getElementById("hero-preview-card");
  const dots = document.querySelectorAll("#hero-preview-dots .dot");
  if (!card) return;

  card.classList.add("switching");

  setTimeout(() => {
    card.className = "hero-preview-card " + hero.id + " switching";
    card.innerHTML = `
      <div class="hero-preview-icon">${hero.icon}</div>
      <div class="hero-preview-name">${hero.name}</div>
      <div class="hero-preview-desc">${hero.desc}</div>
    `;

    setTimeout(() => {
      card.classList.remove("switching");
    }, 250);
  }, 250);

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });
}