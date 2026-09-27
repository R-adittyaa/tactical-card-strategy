const AudioManager = {
  cache: {},
  ready: false,

  init() {
    console.log("🎵 AudioManager init...");
    const keys = ["click", "attack", "spell", "death", "turn"];

    keys.forEach((key) => {
      const audio = new Audio(`assets/sfx/${key}.mp3`);
      audio.preload = "auto";
      audio.volume = gameSettings.volume;

      audio.addEventListener("canplaythrough", () => {
        console.log(`✅ Audio loaded: ${key}`);
      });

      audio.addEventListener("error", (e) => {
        console.error(`❌ Audio gagal load: ${key}`, e);
      });

      this.cache[key] = audio;
    });

    this.ready = true;
  },

  play(key) {
    if (!gameSettings.soundEnabled) return;
    const audio = this.cache[key];
    if (!audio) {
      console.warn(`⚠️ Sound '${key}' tidak ada di cache`);
      return;
    }

    try {
      const clone = audio.cloneNode();
      clone.volume = gameSettings.volume;
      clone.play().catch((e) => {
        console.warn(`Play "${key}" gagal:`, e.message);
      });
    } catch (e) {
      console.warn("Play error:", e);
    }
  },

  setVolume(vol) {
    Object.values(this.cache).forEach((a) => {
      a.volume = vol;
    });
  },
};