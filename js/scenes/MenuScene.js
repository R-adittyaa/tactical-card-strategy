class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    // Background gradient
    this.createBackground(W, H);

    // Title
    this.add.text(cx, H * 0.15, "EXERCIST", {
      fontFamily: THEME.fonts.title,
      fontSize: this.getResponsiveSize(W, 72, 42),
      color: "#fbbf24",
      fontStyle: "900",
    }).setOrigin(0.5).setShadow(0, 0, "#fbbf24", 20, true, true);

    this.add.text(cx, H * 0.15 + this.getResponsiveSize(W, 55, 35), "⚔ TACTICAL CARD STRATEGY ⚔", {
      fontFamily: THEME.fonts.body,
      fontSize: this.getResponsiveSize(W, 16, 12),
      color: "#94a3b8",
      fontStyle: "600",
    }).setOrigin(0.5);

    // Buttons
    const btnW = this.getResponsiveSize(W, 280, 240);
    const btnH = this.getResponsiveSize(W, 54, 48);
    const btnGap = 14;
    const startY = H * 0.42;

    this.createButton(cx, startY, btnW, btnH, "▶  PLAY", THEME.colors.green, () => {
      this.playClick();
      this.scene.start("GameScene");
    });

    this.createButton(cx, startY + btnH + btnGap, btnW, btnH, "📖  HOW TO PLAY", THEME.colors.blue, () => {
      this.playClick();
      this.scene.start("HowToPlayScene");
    });

    this.createButton(cx, startY + (btnH + btnGap) * 2, btnW, btnH, "⚙  SETTINGS", THEME.colors.gold, () => {
      this.playClick();
      this.scene.start("SettingsScene");
    });

    // Footer
    this.add.text(cx, H - 20, "v1.0  ·  Dibuat dengan Phaser.js", {
      fontFamily: THEME.fonts.body,
      fontSize: "11px",
      color: "#475569",
    }).setOrigin(0.5);

    // Handle resize
    this.scale.on("resize", () => this.scene.restart());
  }

  getResponsiveSize(W, desktopSize, mobileSize) {
    return W < 768 ? mobileSize : desktopSize;
  }

  createBackground(W, H) {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0f172a, 0x0f172a, 0x050810, 0x050810, 1);
    g.fillRect(0, 0, W, H);

    // Floating particles (bintang)
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const star = this.add.circle(x, y, size, 0xfbbf24, 0.3);

      this.tweens.add({
        targets: star,
        alpha: { from: 0.1, to: 0.6 },
        duration: Phaser.Math.Between(1500, 3500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }
  }

  createButton(x, y, w, h, label, color, onClick) {
    const container = this.add.container(x, y);

    // Glow
    const glow = this.add.rectangle(0, 0, w + 4, h + 4, color, 0.15);
    glow.setOrigin(0.5);

    // Main
    const bg = this.add.rectangle(0, 0, w, h, color);
    bg.setStrokeStyle(2, 0xffffff, 0.15);

    const txt = this.add.text(0, 0, label, {
      fontFamily: THEME.fonts.body,
      fontSize: this.scale.width < 768 ? "16px" : "18px",
      color: "#ffffff",
      fontStyle: "700",
    }).setOrigin(0.5);

    container.add([glow, bg, txt]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerover", () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 120, ease: "Back.easeOut" });
      glow.setAlpha(0.4);
    });
    container.on("pointerout", () => {
      this.tweens.add({ targets: container, scale: 1.0, duration: 120 });
      glow.setAlpha(0.15);
    });
    container.on("pointerdown", onClick);
  }

  playClick() {
    if (!gameSettings.soundEnabled) return;
    try {
      if (this.sound.get("click")) this.sound.play("click", { volume: gameSettings.volume });
    } catch (e) {}
  }
}