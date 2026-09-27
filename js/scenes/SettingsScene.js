class SettingsScene extends Phaser.Scene {
  constructor() {
    super("SettingsScene");
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a15, 0x0a0a15, 0x1a1a3e, 0x1a1a3e, 1);
    bg.fillRect(0, 0, W, H);

    this.add.text(cx, 80, "⚙  SETTINGS", {
      fontSize: "42px",
      color: "#f0c040",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // === SOUND TOGGLE ===
    this.add.text(cx - 250, 200, "🔊 Sound", {
      fontSize: "24px",
      color: "#eee",
      fontStyle: "bold",
    }).setOrigin(0, 0.5);

    this.soundBtn = this.add.rectangle(cx + 150, 200, 120, 45, gameSettings.soundEnabled ? 0x2ecc71 : 0xe74c3c);
    this.soundBtn.setInteractive({ useHandCursor: true });
    this.soundBtnText = this.add.text(cx + 150, 200, gameSettings.soundEnabled ? "ON" : "OFF", {
      fontSize: "20px",
      color: "#fff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.soundBtn.on("pointerdown", () => {
      gameSettings.soundEnabled = !gameSettings.soundEnabled;
      this.soundBtn.setFillStyle(gameSettings.soundEnabled ? 0x2ecc71 : 0xe74c3c);
      this.soundBtnText.setText(gameSettings.soundEnabled ? "ON" : "OFF");
      if (gameSettings.soundEnabled && this.sound.get("click")) {
        this.sound.play("click", { volume: gameSettings.volume });
      }
    });

    // === VOLUME SLIDER ===
    this.add.text(cx - 250, 280, "🎚  Volume", {
      fontSize: "24px",
      color: "#eee",
      fontStyle: "bold",
    }).setOrigin(0, 0.5);

    const sliderBg = this.add.rectangle(cx + 100, 280, 300, 12, 0x333);
    const sliderFill = this.add.rectangle(
      cx - 50 + (gameSettings.volume * 150),
      280,
      gameSettings.volume * 300,
      12,
      0xf0c040
    );
    const sliderKnob = this.add.circle(cx - 50 + gameSettings.volume * 300, 280, 14, 0xf0c040);
    sliderKnob.setInteractive({ useHandCursor: true, draggable: true });

    this.volumeText = this.add.text(cx + 280, 280, `${Math.round(gameSettings.volume * 100)}%`, {
      fontSize: "18px",
      color: "#f0c040",
      fontStyle: "bold",
    }).setOrigin(0, 0.5);

    this.input.setDraggable(sliderKnob);
    this.input.on("drag", (pointer, obj, dragX) => {
      const minX = cx - 50;
      const maxX = cx + 250;
      const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
      obj.x = clampedX;
      const pct = (clampedX - minX) / 300;
      gameSettings.volume = pct;
      sliderFill.width = pct * 300;
      sliderFill.x = minX + (pct * 300) / 2;
      this.volumeText.setText(`${Math.round(pct * 100)}%`);
    });

    // === DIFFICULTY ===
    this.add.text(cx - 250, 370, "🎯 Difficulty", {
      fontSize: "24px",
      color: "#eee",
      fontStyle: "bold",
    }).setOrigin(0, 0.5);

    const difficulties = ["easy", "normal", "hard"];
    const diffLabels = { easy: "EASY", normal: "NORMAL", hard: "HARD" };
    const diffColors = { easy: 0x2ecc71, normal: 0xf39c12, hard: 0xe74c3c };

    difficulties.forEach((d, i) => {
      const x = cx - 80 + i * 130;
      const isActive = gameSettings.difficulty === d;

      const btn = this.add.rectangle(x, 370, 110, 45, isActive ? diffColors[d] : 0x333);
      btn.setStrokeStyle(2, isActive ? 0xffffff : 0x555);
      btn.setInteractive({ useHandCursor: true });

      const txt = this.add.text(x, 370, diffLabels[d], {
        fontSize: "16px",
        color: "#fff",
        fontStyle: "bold",
      }).setOrigin(0.5);

      btn.on("pointerdown", () => {
        gameSettings.difficulty = d;
        this.scene.restart();
        if (gameSettings.soundEnabled && this.sound.get("click")) {
          this.sound.play("click", { volume: gameSettings.volume });
        }
      });
    });

    // === DESKRIPSI DIFFICULTY ===
    const diffDesc = {
      easy: "AI santai, King musuh HP 15. Buat belajar.",
      normal: "Balance. King musuh HP 20. Recommended.",
      hard: "AI agresif, King musuh HP 25, AP AI +2. Buat pro.",
    };
    this.add.text(cx, 440, diffDesc[gameSettings.difficulty], {
      fontSize: "16px",
      color: "#aaa",
      fontStyle: "italic",
    }).setOrigin(0.5);

    // === BACK BUTTON ===
    const backBtn = this.add.rectangle(cx, H - 80, 220, 50, 0xf0c040);
    backBtn.setInteractive({ useHandCursor: true });
    this.add.text(cx, H - 80, "← BACK TO MENU", {
      fontSize: "18px",
      color: "#1a1a2e",
      fontStyle: "bold",
    }).setOrigin(0.5);

    backBtn.on("pointerover", () => backBtn.setFillStyle(0xffd700));
    backBtn.on("pointerout", () => backBtn.setFillStyle(0xf0c040));
    backBtn.on("pointerdown", () => {
      if (gameSettings.soundEnabled && this.sound.get("click")) {
        this.sound.play("click", { volume: gameSettings.volume });
      }
      this.scene.start("MenuScene");
    });
  }
}