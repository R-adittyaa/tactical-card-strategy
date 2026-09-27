class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super("HowToPlayScene");
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const isMobile = W < 768;

    // Background
    const g = this.add.graphics();
    g.fillGradientStyle(0x0f172a, 0x0f172a, 0x050810, 0x050810, 1);
    g.fillRect(0, 0, W, H);

    // Title
    this.add.text(cx, 40, "📖  HOW TO PLAY", {
      fontFamily: THEME.fonts.title,
      fontSize: isMobile ? "24px" : "32px",
      color: "#fbbf24",
      fontStyle: "900",
    }).setOrigin(0.5);

    // Content sections
    const sections = [
      { icon: "🎯", title: "TUJUAN", body: "Hancurin King musuh (HP 20) sebelum King lu dihancurin." },
      { icon: "⚡", title: "ACTION POINTS", body: "AP nambah tiap turn (Turn 1 = 3, Turn 2 = 4, dst, max 10)." },
      { icon: "🃏", title: "KARTU", body: "⚔ UNIT = prajurit. ✦ SPELL = sihir instant dari jauh." },
      { icon: "🎮", title: "CARA MAIN", body: "Klik kartu → klik tile nyala → eksekusi. Klik END TURN kalau selesai." },
      { icon: "🏃", title: "UNIT", body: "Klik unit → biru = gerak, merah = nyerang. Klik unit lagi buat deselect." },
    ];

    const startY = 100;
    const sectionH = isMobile ? 75 : 90;

    sections.forEach((s, i) => {
      const y = startY + i * sectionH;

      // Icon
      this.add.text(cx - W * 0.35, y, s.icon, {
        fontSize: isMobile ? "20px" : "28px",
      }).setOrigin(0, 0.5);

      // Title
      this.add.text(cx - W * 0.28, y - 14, s.title, {
        fontFamily: THEME.fonts.body,
        fontSize: isMobile ? "14px" : "17px",
        color: "#fbbf24",
        fontStyle: "700",
      }).setOrigin(0, 0.5);

      // Body
      this.add.text(cx - W * 0.28, y + 12, s.body, {
        fontFamily: THEME.fonts.body,
        fontSize: isMobile ? "12px" : "14px",
        color: "#94a3b8",
        wordWrap: { width: W * 0.65 },
        lineSpacing: 3,
      }).setOrigin(0, 0.5);
    });

    // Back button
    this.createBackButton(cx, H - 50, isMobile);
  }

  createBackButton(x, y, isMobile) {
    const w = isMobile ? 200 : 240;
    const h = isMobile ? 46 : 52;

    const bg = this.add.rectangle(x, y, w, h, THEME.colors.gold);
    bg.setStrokeStyle(2, 0xffffff, 0.15);
    bg.setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, "← BACK", {
      fontFamily: THEME.fonts.body,
      fontSize: "16px",
      color: "#0f172a",
      fontStyle: "800",
    }).setOrigin(0.5);

    bg.on("pointerover", () => bg.setFillStyle(THEME.colors.goldGlow));
    bg.on("pointerout", () => bg.setFillStyle(THEME.colors.gold));
    bg.on("pointerdown", () => {
      try {
        if (gameSettings.soundEnabled && this.sound.get("click"))
          this.sound.play("click", { volume: gameSettings.volume });
      } catch (e) {}
      this.scene.start("MenuScene");
    });
  }
}