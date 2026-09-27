class SettingsScene extends Phaser.Scene {
  constructor() {
    super("SettingsScene");
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const isMobile = W < 768;
    const labelSize = isMobile ? "16px" : "20px";
    const labelX = cx - W * 0.3;
    const controlX = cx + W * 0.05;

    // Background
    const g = this.add.graphics();
    g.fillGradientStyle(0x0f172a, 0x0f172a, 0x050810, 0x050810, 1);
    g.fillRect(0, 0, W, H);

    this.add.text(cx, 50, "⚙  SETTINGS", {
      fontFamily: THEME.fonts.title,
      fontSize: isMobile ? "24px" : "32px",
      color: "#fbbf24",
      fontStyle: "900",
    }).setOrigin(0.5);

    const startY = H * 0.28;
    const rowH = isMobile ? 70 : 85;

    // === SOUND TOGGLE ===
    this.add.text(labelX, startY, "🔊  Sound", {
      fontFamily: THEME.fonts.body,
      fontSize: labelSize,
      color: "#e5e7eb",
      fontStyle: "600",
    }).setOrigin(0, 0.5);

    const soundBtn = this.add.rectangle(controlX, startY, 110, 42, gameSettings.soundEnabled ? THEME.colors.green : THEME.colors.red);
    soundBtn.setStrokeStyle(2, 0xffffff, 0.15);
    soundBtn.setInteractive({ useHandCursor: true });
    const soundTxt = this.add.text(controlX, startY, gameSettings.soundEnabled ? "ON" : "OFF", {
      fontFamily: THEME.fonts.body,
      fontSize: "15px",
      color: "#ffffff",
      fontStyle: "800",
    }).setOrigin(0.5);

    soundBtn.on("pointerdown", () => {
      gameSettings.soundEnabled = !gameSettings.soundEnabled;
      soundBtn.setFillStyle(gameSettings.soundEnabled ? THEME.colors.green : THEME.colors.red);
      soundTxt.setText(gameSettings.soundEnabled ? "ON" : "OFF");
      if (gameSettings.soundEnabled && this.sound.get("click"))
        this.sound.play("click", { volume: gameSettings.volume });
    });

    // === VOLUME ===
    const volY = startY + rowH;
    this.add.text(labelX, volY, "🎚  Volume", {
      fontFamily: THEME.fonts.body,
      fontSize: labelSize,
      color: "#e5e7eb",
      fontStyle: "600",
    }).setOrigin(0, 0.5);

    const sliderW = isMobile ? 180 : 240;
    const sliderX = controlX - sliderW / 2;

    this.add.rectangle(sliderX + sliderW / 2, volY, sliderW, 8, 0x1e293b);
    const fillW = gameSettings.volume * sliderW;
    const fill = this.add.rectangle(sliderX + fillW / 2, volY, fillW, 8, THEME.colors.gold);

    const knobX = sliderX + gameSettings.volume * sliderW;
    const knob = this.add.circle(knobX, volY, isMobile ? 10 : 12, THEME.colors.gold);
    knob.setStrokeStyle(2, 0xffffff, 0.5);
    knob.setInteractive({ useHandCursor: true, draggable: true });

    const volTxt = this.add.text(sliderX + sliderW + 30, volY, `${Math.round(gameSettings.volume * 100)}%`, {
      fontFamily: THEME.fonts.body,
      fontSize: "14px",
      color: "#fbbf24",
      fontStyle: "700",
    }).setOrigin(0, 0.5);

    this.input.setDraggable(knob);
    this.input.on("drag", (pointer, obj, dragX) => {
      const clampedX = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderW);
      obj.x = clampedX;
      const pct = (clampedX - sliderX) / sliderW;
      gameSettings.volume = pct;
      fill.width = pct * sliderW;
      fill.x = sliderX + fill.width / 2;
      volTxt.setText(`${Math.round(pct * 100)}%`);
    });

    // === DIFFICULTY ===
    const diffY = startY + rowH * 2;
    this.add.text(labelX, diffY, "🎯  Difficulty", {
      fontFamily: THEME.fonts.body,
      fontSize: labelSize,
      color: "#e5e7eb",
      fontStyle: "600",
    }).setOrigin(0, 0.5);

    const diffs = [
      { key: "easy", label: "EASY", color: THEME.colors.green },
      { key: "normal", label: "NORMAL", color: THEME.colors.orange },
      { key: "hard", label: "HARD", color: THEME.colors.red },
    ];

    const btnW = isMobile ? 70 : 90;
    const btnH = 42;
    const btnGap = 10;
    const totalW = diffs.length * btnW + (diffs.length - 1) * btnGap;
    const startBX = controlX - totalW / 2 + btnW / 2;

    diffs.forEach((d, i) => {
      const x = startBX + i * (btnW + btnGap);
      const isActive = gameSettings.difficulty === d.key;

      const btn = this.add.rectangle(x, diffY, btnW, btnH, isActive ? d.color : 0x1e293b);
      btn.setStrokeStyle(2, isActive ? 0xffffff : 0x334155, isActive ? 0.8 : 0.4);
      btn.setInteractive({ useHandCursor: true });

      this.add.text(x, diffY, d.label, {
        fontFamily: THEME.fonts.body,
        fontSize: isMobile ? "11px" : "13px",
        color: isActive ? "#ffffff" : "#64748b",
        fontStyle: "800",
      }).setOrigin(0.5);

      btn.on("pointerdown", () => {
        gameSettings.difficulty = d.key;
        if (gameSettings.soundEnabled && this.sound.get("click"))
          this.sound.play("click", { volume: gameSettings.volume });
        this.scene.restart();
      });
    });

    // Description
    const desc = {
      easy: "AI santai, King HP 15. Cocok buat belajar.",
      normal: "Balance. King HP 20. Recommended.",
      hard: "AI agresif, King HP 25, AP AI +2.",
    };
    this.add.text(cx, diffY + 60, desc[gameSettings.difficulty], {
      fontFamily: THEME.fonts.body,
      fontSize: isMobile ? "11px" : "13px",
      color: "#64748b",
      fontStyle: "italic",
    }).setOrigin(0.5);

    // Back
    this.createBackButton(cx, H - 50, isMobile);
  }

  createBackButton(x, y, isMobile) {
    const w = isMobile ? 200 : 240;
    const h = isMobile ? 46 : 52;

    const bg = this.add.rectangle(x, y, w, h, THEME.colors.gold);
    bg.setStrokeStyle(2, 0xffffff, 0.15);
    bg.setInteractive({ useHandCursor: true });

    this.add.text(x, y, "← BACK", {
      fontFamily: THEME.fonts.body,
      fontSize: "16px",
      color: "#0f172a",
      fontStyle: "800",
    }).setOrigin(0.5);

    bg.on("pointerover", () => bg.setFillStyle(THEME.colors.goldGlow));
    bg.on("pointerout", () => bg.setFillStyle(THEME.colors.gold));
    bg.on("pointerdown", () => {
      if (gameSettings.soundEnabled && this.sound.get("click"))
        this.sound.play("click", { volume: gameSettings.volume });
      this.scene.start("MenuScene");
    });
  }
}