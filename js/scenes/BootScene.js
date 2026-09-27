class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Loading bar
    const W = this.scale.width;
    const H = this.scale.height;

    const barW = 300;
    const barH = 6;
    const barX = W / 2 - barW / 2;
    const barY = H / 2;

    const barBg = this.add.rectangle(barX, barY, barW, barH, 0x1e293b).setOrigin(0, 0.5);
    const bar = this.add.rectangle(barX, barY, 0, barH, 0xfbbf24).setOrigin(0, 0.5);

    this.add.text(W / 2, barY - 30, "LOADING", {
      fontFamily: THEME.fonts.title,
      fontSize: "18px",
      color: "#fbbf24",
    }).setOrigin(0.5);

    this.load.on("progress", (value) => {
      bar.width = barW * value;
    });

    // Sound (kalau gak ada, tetep lanjut)
    this.load.audio("click", "assets/sfx/click.mp3");
    this.load.audio("attack", "assets/sfx/attack.mp3");
    this.load.audio("spell", "assets/sfx/spell.mp3");
    this.load.audio("death", "assets/sfx/death.mp3");
    this.load.audio("turn", "assets/sfx/turn.mp3");

    this.load.on("loaderror", (file) => {
      console.warn("Asset gagal load:", file.key);
    });
  }

  create() {
    this.scene.start("MenuScene");
  }
}