const gameSettings = {
  soundEnabled: true,
  volume: 0.5,
  difficulty: "normal",
};

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#050810",
  scale: {
    mode: Phaser.Scale.RESIZE,      // ← RESPONSIVE, ikut ukuran layar
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: "100%",
    height: "100%",
  },
  render: {
    antialias: true,
    roundPixels: false,
    pixelArt: false,
  },
  scene: [BootScene, MenuScene, HowToPlayScene, SettingsScene, GameScene],
};

const game = new Phaser.Game(config);

// Handle resize (buat HP yang rotate)
window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});