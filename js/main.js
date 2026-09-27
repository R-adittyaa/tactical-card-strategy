const gameSettings = {
  soundEnabled: true,
  volume: 0.5,
  difficulty: "normal", // easy | normal | hard
};

const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 800,
  backgroundColor: "#0a0a15",
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, HowToPlayScene, SettingsScene, GameScene],
};

const game = new Phaser.Game(config);