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
      disableWebAudio: true,
      noAudio: false,
    },
  });

  console.log("Phaser initialized:", game);

  initMenu();

  // Init audio manager
  setTimeout(() => AudioManager.init(), 500);
});