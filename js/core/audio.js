// ===== AUDIO MANAGER — HTML5 AUDIO =====
const AudioManager = {
  cache: {},
  bgmAudio: null,
  ready: false,

  // ===== SFX =====
  init() {
    console.log("🎵 AudioManager init...");
    const keys = ["click", "attack", "spell", "death", "turn"];

    keys.forEach((key) => {
      const audio = new Audio(`assets/sfx/${key}.mp3`);
      audio.preload = "auto";
      audio.volume = gameSettings.volume;

      audio.addEventListener("canplaythrough", () => {
        console.log(`✅ SFX loaded: ${key}`);
      });

      audio.addEventListener("error", () => {
        console.warn(`⚠️ SFX gagal load: ${key}`);
      });

      this.cache[key] = audio;
    });

    this.ready = true;
  },

  play(key) {
    if (!gameSettings.soundEnabled) return;
    const audio = this.cache[key];
    if (!audio) return;

    try {
      const clone = audio.cloneNode();
      clone.volume = gameSettings.volume;
      clone.play().catch(() => {});
    } catch (e) {}
  },

  setVolume(vol) {
    Object.values(this.cache).forEach((a) => {
      a.volume = vol;
    });
    if (this.bgmAudio) this.bgmAudio.volume = gameSettings.bgmVolume;
  },

  // ===== BGM =====
  bgmLoaded: false,
  currentBgmTrack: null,

  initBGM() {
    // BGM di-init pas user interaksi pertama
    if (this.bgmLoaded) return;
    this.bgmLoaded = true;
    this.playBGM(gameSettings.bgmTrack);
  },

  playBGM(track) {
    if (!gameSettings.bgmEnabled) {
      this.stopBGM();
      return;
    }

    const trackData = BGM_LIBRARY[track];
    if (!trackData) return;

    // Kalau track sama & udah main, skip
    if (this.currentBgmTrack === track && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }

    // Stop lagu lama dulu
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }

    // Buat audio baru
    const audio = new Audio(trackData.file);
    audio.loop = true;
    audio.volume = 0; // Fade in dari 0
    audio.preload = "auto";

    audio.addEventListener("error", () => {
      console.warn(`⚠️ BGM gagal load: ${trackData.file}`);
      this.bgmAudio = null;
    });

    audio.play()
      .then(() => {
        // Fade in
        this.fadeIn(audio, gameSettings.bgmVolume, 800);
        console.log(`🎵 BGM playing: ${trackData.name}`);
      })
      .catch((e) => {
        console.warn("BGM autoplay blocked, waiting for user interaction:", e);
        this.bgmAudio = audio;
      });

    this.bgmAudio = audio;
    this.currentBgmTrack = track;
  },

  stopBGM() {
    if (this.bgmAudio) {
      const audio = this.bgmAudio;
      this.fadeOut(audio, 500, () => {
        audio.pause();
      });
    }
    this.currentBgmTrack = null;
  },

  setBgmVolume(vol) {
    if (this.bgmAudio) {
      this.bgmAudio.volume = vol;
    }
  },

  fadeIn(audio, targetVol, duration) {
    const start = Date.now();
    const startVol = audio.volume;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      audio.volume = startVol + (targetVol - startVol) * progress;
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  },

  fadeOut(audio, duration, onComplete) {
    const start = Date.now();
    const startVol = audio.volume;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      audio.volume = startVol * (1 - progress);
      if (progress < 1) requestAnimationFrame(tick);
      else if (onComplete) onComplete();
    };
    tick();
  },
};