class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super("HowToPlayScene");
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a15, 0x0a0a15, 0x1a1a3e, 0x1a1a3e, 1);
    bg.fillRect(0, 0, W, H);

    this.add.text(cx, 60, "📖  HOW TO PLAY", {
      fontSize: "42px",
      color: "#f0c040",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const content = [
      { title: "🎯 TUJUAN", body: "Hancurin King musuh (HP 20) sebelum King lu dihancurin." },
      { title: "⚡ ACTION POINTS (AP)", body: "AP nambah tiap turn (Turn 1 = 3 AP, Turn 2 = 4 AP, dst, max 10).\nMain kartu, gerak, atau nyerang butuh AP." },
      { title: "🃏 KARTU", body: "⚔ UNIT = prajurit (ada HP, ATK, range).\n✦ SPELL = sihir instant (bisa dari jauh)." },
      { title: "🎮 CARA MAIN", body: "1. Klik kartu di hand.\n2. Tile yang valid bakal nyala.\n3. Klik tile buat eksekusi.\n4. Klik End Turn kalau udah selesai." },
      { title: "🏃 UNIT", body: "Klik unit lu → tile biru = bisa gerak.\nTile merah = bisa nyerang musuh." },
      { title: "🏆 MENANG", body: "Hancurin King musuh pakai unit atau spell." },
    ];

    let y = 130;
    content.forEach((item) => {
      this.add.text(100, y, item.title, {
        fontSize: "22px",
        color: "#f0c040",
        fontStyle: "bold",
      });
      this.add.text(100, y + 35, item.body, {
        fontSize: "17px",
        color: "#ddd",
        lineSpacing: 6,
        wordWrap: { width: W - 200 },
      });
      y += 100;
    });

    this.createBackButton(cx, H - 50);
  }

  createBackButton(x, y) {
    const btn = this.add.rectangle(x, y, 220, 50, 0xf0c040);
    btn.setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, "← BACK TO MENU", {
      fontSize: "18px",
      color: "#1a1a2e",
      fontStyle: "bold",
    }).setOrigin(0.5);

    btn.on("pointerover", () => btn.setFillStyle(0xffd700));
    btn.on("pointerout", () => btn.setFillStyle(0xf0c040));
    btn.on("pointerdown", () => {
      try {
        if (gameSettings.soundEnabled && this.sound.get("click")) {
          this.sound.play("click", { volume: gameSettings.volume });
        }
      } catch (e) {}
      this.scene.start("MenuScene");
    });
  }
}