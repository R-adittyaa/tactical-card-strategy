// ===== PHASER INIT =====
let game;

window.addEventListener("load", () => {
  console.log("Window loaded, initializing Phaser...");

  const boardEl = document.getElementById("phaser-board");
  if (!boardEl) {
    console.error("ERROR: #phaser-board tidak ditemukan!");
    return;
  }

  const vh = window.innerHeight;
  const vw = window.innerWidth;

  // Reserved: top bar + hint + hand + end turn
  let reservedH;
  if (vh < 500) {
    reservedH = 280;
  } else if (vh < 600) {
    reservedH = 300;   // ← naik dari 280, King player gak ketutup
  } else if (vh < 700) {
    reservedH = 320;
  } else if (vh < 800) {
    reservedH = 350;
  } else {
    reservedH = 400;
  }

  const reservedW = 40;

  const availableSize = Math.min(vh - reservedH, vw - reservedW);
  const minCanvas = 200;
  const maxCanvas = 800;
  const canvasSize = Math.max(minCanvas, Math.min(availableSize, maxCanvas));

  console.log("Viewport:", vw, "x", vh);
  console.log("Reserved:", reservedH);
  console.log("Available:", availableSize);
  console.log("Canvas size:", canvasSize);

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "phaser-board",
    width: canvasSize,
    height: canvasSize,
    backgroundColor: "#0f172a",
    scene: [BootScene, BoardScene],
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width: canvasSize,
      height: canvasSize,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    audio: { disableWebAudio: true, noAudio: false },
  });

  console.log("Phaser initialized:", game);

  initMenu();
  setTimeout(() => AudioManager.init(), 500);
});

// Resize handler
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    window.location.reload();
  }, 500);
});