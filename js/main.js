// ===== PHASER INIT =====
let game;

window.addEventListener("load", () => {
  console.log("Window loaded, initializing Phaser...");

  const boardEl = document.getElementById("phaser-board");
  if (!boardEl) {
    console.error("ERROR: #phaser-board tidak ditemukan!");
    return;
  }

  // Delay dikit biar DOM selesai layout
  setTimeout(() => {
    function getBoardSize() {
      const wrapper = boardEl.parentElement;
      if (!wrapper) return 500;

      const w = wrapper.clientWidth - 16;
      const h = wrapper.clientHeight - 16;

      console.log("Wrapper size:", w, "x", h);

      // Minimal 400px, maximal 800px
      const size = Math.max(400, Math.min(w, h, 800));
      return Math.floor(size);
    }

    const initialSize = getBoardSize();
    console.log("Initial board size:", initialSize);

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "phaser-board",
      width: initialSize,
      height: initialSize,
      backgroundColor: "#0f172a",
      scene: [BootScene, BoardScene],
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER,
        width: initialSize,
        height: initialSize,
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

    // Resize observer
    let resizeTimer = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newSize = getBoardSize();
        if (Math.abs(newSize - game.scale.width) > 20) {
          console.log("Resize detected:", newSize);
          game.scale.resize(newSize, newSize);
          if (window.boardScene) {
            const canvasW = window.boardScene.scale.width;
            window.boardScene.GAP = 5;
            window.boardScene.TILE = Math.floor(
              (canvasW - 20 - 6 * window.boardScene.GAP) / 7
            );
            window.boardScene.refresh();
          }
        }
      }, 300);
    });

    const wrapper = boardEl.parentElement;
    if (wrapper) resizeObserver.observe(wrapper);
  }, 200);
});