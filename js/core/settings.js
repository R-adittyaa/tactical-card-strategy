// ===== GLOBAL SETTINGS =====
const gameSettings = {
  soundEnabled: true,
  volume: 0.5,
  bgmEnabled: true,
  bgmVolume: 0.3,
  bgmTrack: 1,
  difficulty: "normal",
  autoEndTurn: true,
  gameMode: "solo",
};

// ===== BGM LIBRARY =====
const BGM_LIBRARY = {
  1: { name: "Menu Theme 1", file: "assets/bgm/menu-1.mp3" },
  2: { name: "Menu Theme 2", file: "assets/bgm/menu-2.mp3" },
  3: { name: "Menu Theme 3", file: "assets/bgm/menu-3.mp3" },
};

// ===== SAVE / LOAD =====
function saveSettings() {
  try {
    localStorage.setItem("exercist_settings", JSON.stringify({
      soundEnabled: gameSettings.soundEnabled,
      volume: gameSettings.volume,
      bgmEnabled: gameSettings.bgmEnabled,
      bgmVolume: gameSettings.bgmVolume,
      bgmTrack: gameSettings.bgmTrack,
      difficulty: gameSettings.difficulty,
      autoEndTurn: gameSettings.autoEndTurn,
      gameMode: gameSettings.gameMode,
    }));
  } catch (e) {
    console.warn("Gagal save settings:", e);
  }
}

function loadSettings() {
  try {
    const saved = localStorage.getItem("exercist_settings");
    if (!saved) return;
    const data = JSON.parse(saved);
    if (typeof data.soundEnabled === "boolean") gameSettings.soundEnabled = data.soundEnabled;
    if (typeof data.volume === "number") gameSettings.volume = data.volume;
    if (typeof data.bgmEnabled === "boolean") gameSettings.bgmEnabled = data.bgmEnabled;
    if (typeof data.bgmVolume === "number") gameSettings.bgmVolume = data.bgmVolume;
    if (typeof data.bgmTrack === "number") gameSettings.bgmTrack = data.bgmTrack;
    if (typeof data.difficulty === "string") gameSettings.difficulty = data.difficulty;
    if (typeof data.autoEndTurn === "boolean") gameSettings.autoEndTurn = data.autoEndTurn;
    if (typeof data.gameMode === "string") gameSettings.gameMode = data.gameMode;
  } catch (e) {
    console.warn("Gagal load settings:", e);
  }
}

loadSettings();