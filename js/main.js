// ===== PHASER INIT =====
let game;

window.addEventListener("load", () => {
  console.log("Window loaded, initializing Phaser...");

  const boardEl = document.getElementById("phaser-board");
  if (!boardEl) {
    console.error("ERROR: #phaser-board tidak ditemukan!");
    return;
  }

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "phaser-board",
    width: 424,
    height: 424,
    backgroundColor: "#0a0e1a",
    scene: [BootScene, BoardScene],
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width: 424,
      height: 424,
    },
    audio: {
      disableWebAudio: false,
      noAudio: false,
    },
  });

  console.log("Phaser initialized:", game);

  // ===== UNLOCK AUDIO =====
  // Resume AudioContext. Dipanggil DARI DALAM onclick event.
  window.unlockAudio = function () {
    try {
      const ctx = game.sound && game.sound.context;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().then(() => {
          console.log("✅ AudioContext resumed:", ctx.state);
        });
      }
    } catch (e) {
      console.warn("unlock error:", e);
    }
  };

  initMenu();

  // Pasang unlock ke SEMUA button & body, tapi langsung di onclick
  // biar browser percaya itu "user gesture"
  const attachUnlock = () => {
    document.querySelectorAll("button, .btn, .game-card, .btn-end-turn-bottom, .diff-btn, .toggle-btn")
      .forEach((el) => {
        el.addEventListener("click", window.unlockAudio, { capture: true });
      });
  };

  // Attach sekarang & tiap kali ada button baru (game cards)
  attachUnlock();
  setInterval(attachUnlock, 1000); // refresh tiap detik (buat game cards dinamis)

  // Fallback: klik body juga
  document.body.addEventListener("click", window.unlockAudio, { capture: true });
});