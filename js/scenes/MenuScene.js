class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a15, 0x0a0a15, 0x1a1a3e, 0x1a1a3e, 1);
    bg.fillRect(0, 0, W, H);

    // Title
    const title = this.add.text(cx, 120, "⚔️ TACTICAL CARD ⚔️", {
      fontSize: "58px",
      color: "#f0c040",
      fontStyle: "bold",
      stroke: "#000",
      strokeThickness: 8,
    }).setOrigin(0.5);

    // Floating animation
    this.tweens.add({
      targets: title,
      y: 130,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add.text(cx, 190, "Grid Strategy Game", {
      fontSize: "22px",
      color: "#aaa",
      fontStyle: "italic",
    }).setOrigin(0.5);

    // Decorative cards
    this.createDecoCard(cx - 400, 250, "⚔️", 0x2980b9);
    this.createDecoCard(cx - 200, 220, "🏹", 0x27ae60);
    this.createDecoCard(cx + 200, 220, "🔥", 0xe67e22);
    this.createDecoCard(cx + 400, 250, "🛡️", 0x8e44ad);

    // Menu buttons
    this.createButton(cx, 400, "▶  PLAY", 0x2ecc71, () => {
      this.playClick();
      this.scene.start("GameScene");
    });

    this.createButton(cx, 480, "📖  HOW TO PLAY", 0x3498db, () => {
      this.playClick();
      this.scene.start("HowToPlayScene");
    });

    this.createButton(cx, 560, "⚙  SETTINGS", 0xf39c12, () => {
      this.playClick();
      this.scene.start("SettingsScene");
    });

    this.createButton(cx, 640, "❌  QUIT", 0xe74c3c, () => {
      this.playClick();
      // Karena game web, kita cuma tampilin pesan
      this.showToast("Tutup tab browser buat keluar 😄");
    });

    // Footer
    this.add.text(cx, H - 30, "v0.3  |  Dibuat pakai Phaser.js", {
      fontSize: "14px",
      color: "#555",
    }).setOrigin(0.5);
  }

  createDecoCard(x, y, icon, color) {
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 100, 130, 0x16213e);
    bg.setStrokeStyle(3, color);
    const iconText = this.add.text(0, 0, icon, { fontSize: "48px" }).setOrigin(0.5);
    card.add([bg, iconText]);
    card.setAngle(Phaser.Math.Between(-15, 15));

    this.tweens.add({
      targets: card,
      y: y - 15,
      duration: Phaser.Math.Between(1500, 2200),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  createButton(x, y, label, color, onClick) {
    const btn = this.add.rectangle(x, y, 320, 60, color);
    btn.setStrokeStyle(3, 0xffffff, 0.3);
    btn.setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, label, {
      fontSize: "22px",
      color: "#fff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    btn.on("pointerover", () => {
      this.tweens.add({ targets: [btn, txt], scale: 1.05, duration: 100 });
      btn.setStrokeStyle(3, 0xffffff, 0.8);
    });
    btn.on("pointerout", () => {
      this.tweens.add({ targets: [btn, txt], scale: 1.0, duration: 100 });
      btn.setStrokeStyle(3, 0xffffff, 0.3);
    });
    btn.on("pointerdown", onClick);
  }

  playClick() {
    try {
      if (gameSettings.soundEnabled && this.sound.get("click")) {
        this.sound.play("click", { volume: gameSettings.volume });
      }
    } catch (e) {}
  }

  showToast(msg) {
    const W = this.scale.width;
    const toast = this.add.text(W / 2, 720, msg, {
      fontSize: "16px",
      color: "#f0c040",
      backgroundColor: "#000",
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 200,
      onComplete: () => {
        this.tweens.add({
          targets: toast,
          alpha: 0,
          delay: 1500,
          duration: 400,
          onComplete: () => toast.destroy(),
        });
      },
    });
  }
}