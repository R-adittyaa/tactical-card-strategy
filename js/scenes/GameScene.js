class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.CANVAS_W = this.scale.width;
    this.CANVAS_H = this.scale.height;
    this.isMobile = this.CANVAS_W < 900;

    // === RESPONSIVE LAYOUT — pakai % dari tinggi canvas ===
    // Top bar: 0-8% | Board: 10-72% | Hint: 73% | Hand: 76-100%
    this.TOP_BAR_H = Math.max(50, this.CANVAS_H * 0.08);
    
    // Space buat board: antara top bar & hint
    const boardAreaTop = this.TOP_BAR_H + 10;
    const boardAreaBottom = this.CANVAS_H * 0.72;
    const boardAreaH = boardAreaBottom - boardAreaTop;
    const boardAreaW = this.CANVAS_W * 0.95;
    
    // Tile size = min(lebar area / 5, tinggi area / 5) - gap
    const maxTileByW = (boardAreaW - 4 * 6) / 5;
    const maxTileByH = (boardAreaH - 4 * 6) / 5;
    this.TILE_SIZE = Math.floor(Math.min(maxTileByW, maxTileByH, 110));
    this.TILE_GAP = 6;
    this.BOARD_W = 5 * this.TILE_SIZE + 4 * this.TILE_GAP;
    this.BOARD_H = this.BOARD_W;
    this.BOARD_X = (this.CANVAS_W - this.BOARD_W) / 2;
    this.BOARD_Y = boardAreaTop + (boardAreaH - this.BOARD_H) / 2;

    // === DIFFICULTY ===
    const diff = gameSettings.difficulty;
    const kingHP = diff === "easy" ? 15 : diff === "hard" ? 25 : 20;
    const aiBonusAP = diff === "hard" ? 2 : 0;

    this.gameState = {
      turn: 1,
      playerAP: 3, enemyAP: 0,
      playerKingHP: kingHP, enemyKingHP: kingHP, maxKingHP: kingHP,
      board: [],
      deck: [], hand: [], discard: [],
      enemyDeck: [], enemyHand: [], enemyDiscard: [],
      selectedCard: null, selectedUnit: null,
      isAITurn: false, isGameOver: false, isAnimating: false,
      aiBonusAP: aiBonusAP, infoPanelOpen: false,
    };

    this.boardContainer = this.add.container(this.BOARD_X, this.BOARD_Y);
    this.handContainer = this.add.container(0, 0);

    this.initBoard();
    this.initDeck();
    for (let i = 0; i < 3; i++) this.drawCard();

    this.createTopBar();
    this.createHintText();
    this.createBoardVisual();
    this.createHandVisual();
    this.createInfoPanel();

    this.showTurnBanner("YOUR TURN");
    this.playSound("turn");

    this.scale.on("resize", () => this.scene.restart());
  }

  // ===================== SOUND =====================
  playSound(key, vol = null) {
    if (!gameSettings.soundEnabled) return;
    try {
      if (this.sound.get(key)) this.sound.play(key, { volume: vol ?? gameSettings.volume });
    } catch (e) {}
  }

  showSpellNotification(icon, name, color) {
    const cx = this.CANVAS_W / 2;
    const cy = this.CANVAS_H / 2;

    const container = this.add.container(cx, cy);
    const glow = this.add.rectangle(0, 0, 340, 95, color, 0.2);
    const bg = this.add.rectangle(0, 0, 320, 80, 0x0f172a, 0.95);
    bg.setStrokeStyle(3, color);

    const iconText = this.add.text(-100, 0, icon, { fontSize: "48px" }).setOrigin(0.5);
    const nameText = this.add.text(25, 0, name, {
      fontFamily: THEME.fonts.body,
      fontSize: "26px",
      color: THEME.hex(color),
      fontStyle: "800",
    }).setOrigin(0.5);

    container.add([glow, bg, iconText, nameText]);
    container.setScale(0).setAlpha(0);

    this.tweens.add({
      targets: container, scale: 1, alpha: 1, duration: 250, ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: container, alpha: 0, y: cy - 60, delay: 700, duration: 400,
          onComplete: () => container.destroy(),
        });
      },
    });
  }

  // ===================== STATE INIT =====================
  initBoard() {
    this.gameState.board = [];
    for (let row = 0; row < 5; row++) {
      const rowArr = [];
      for (let col = 0; col < 5; col++) rowArr.push(null);
      this.gameState.board.push(rowArr);
    }
    this.gameState.board[0][2] = { type: "KING", owner: "enemy", hp: this.gameState.enemyKingHP, maxHp: this.gameState.maxKingHP, name: "Enemy King" };
    this.gameState.board[4][2] = { type: "KING", owner: "player", hp: this.gameState.playerKingHP, maxHp: this.gameState.maxKingHP, name: "Your King" };
  }

  initDeck() {
    this.gameState.deck = [...DEFAULT_DECK];
    this.gameState.enemyDeck = [...DEFAULT_DECK];
    this.shuffleArray(this.gameState.deck);
    this.shuffleArray(this.gameState.enemyDeck);
  }

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  drawCard() {
    if (this.gameState.deck.length === 0) {
      if (this.gameState.discard.length === 0) return null;
      this.gameState.deck = [...this.gameState.discard];
      this.gameState.discard = [];
      this.shuffleArray(this.gameState.deck);
    }
    if (this.gameState.hand.length >= 5) return null;
    this.gameState.hand.push(this.gameState.deck.pop());
  }

  drawEnemyCard() {
    if (this.gameState.enemyDeck.length === 0) {
      if (this.gameState.enemyDiscard.length === 0) return;
      this.gameState.enemyDeck = [...this.gameState.enemyDiscard];
      this.gameState.enemyDiscard = [];
      this.shuffleArray(this.gameState.enemyDeck);
    }
    if (this.gameState.enemyHand.length >= 5) return;
    this.gameState.enemyHand.push(this.gameState.enemyDeck.pop());
  }

  // ===================== TOP BAR =====================
  createTopBar() {
    const W = this.CANVAS_W;
    const barH = this.TOP_BAR_H;
    const barY = barH / 2 + 4;
    const padding = 16;

    const barBg = this.add.rectangle(W / 2, barY, W - padding * 2, barH - 8, 0x0f172a, 0.9);
    barBg.setStrokeStyle(1, 0x1e293b);

    const fontSize = this.isMobile ? "13px" : "15px";

    this.turnText = this.add.text(padding + 16, barY, "", {
      fontFamily: THEME.fonts.title,
      fontSize: this.isMobile ? "14px" : "16px",
      color: THEME.hex(THEME.colors.gold),
      fontStyle: "700",
    }).setOrigin(0, 0.5);

    this.apText = this.add.text(padding + (this.isMobile ? 80 : 120), barY, "", {
      fontFamily: THEME.fonts.body,
      fontSize: fontSize,
      color: THEME.hex(THEME.colors.green),
      fontStyle: "700",
    }).setOrigin(0, 0.5);

    // HP display: di sebelah kiri tombol INFO
    const infoW = this.isMobile ? 50 : 100;
    const infoH = barH - 16;
    const infoX = W - padding - (this.isMobile ? 110 : 230);

    this.hpText = this.add.text(infoX - 20, barY, "", {
      fontFamily: THEME.fonts.body,
      fontSize: fontSize,
      color: THEME.hex(THEME.colors.text),
      fontStyle: "600",
    }).setOrigin(1, 0.5);

    // INFO button
    const infoBtn = this.add.rectangle(infoX, barY, infoW, infoH, THEME.colors.blue);
    infoBtn.setStrokeStyle(1, 0xffffff, 0.15);
    infoBtn.setInteractive({ useHandCursor: true });
    this.add.text(infoX, barY, this.isMobile ? "ℹ" : "ℹ INFO", {
      fontFamily: THEME.fonts.body,
      fontSize: this.isMobile ? "16px" : "12px",
      color: "#ffffff",
      fontStyle: "700",
    }).setOrigin(0.5);

    infoBtn.on("pointerover", () => infoBtn.setFillStyle(THEME.colors.blueDark));
    infoBtn.on("pointerout", () => infoBtn.setFillStyle(THEME.colors.blue));
    infoBtn.on("pointerdown", () => this.toggleInfoPanel());

    // END TURN button
    const endW = this.isMobile ? 90 : 150;
    const endX = W - padding - endW / 2;
    this.endTurnBtn = this.add.rectangle(endX, barY, endW, infoH, THEME.colors.gold);
    this.endTurnBtn.setStrokeStyle(1, 0xffffff, 0.2);
    this.endTurnBtn.setInteractive({ useHandCursor: true });
    this.endTurnBtnText = this.add.text(endX, barY, this.isMobile ? "END" : "END TURN →", {
      fontFamily: THEME.fonts.body,
      fontSize: this.isMobile ? "12px" : "13px",
      color: "#0f172a",
      fontStyle: "800",
    }).setOrigin(0.5);

    this.endTurnBtn.on("pointerover", () => {
      if (this.endTurnBtn.input && this.endTurnBtn.input.enabled)
        this.endTurnBtn.setFillStyle(THEME.colors.goldGlow);
    });
    this.endTurnBtn.on("pointerout", () => {
      if (this.endTurnBtn.input && this.endTurnBtn.input.enabled)
        this.endTurnBtn.setFillStyle(THEME.colors.gold);
    });
    this.endTurnBtn.on("pointerdown", () => this.onEndTurn());

    this.updateTopBar();
  }

  updateTopBar() {
    this.turnText.setText(`TURN ${this.gameState.turn}`);
    this.apText.setText(`⚡ ${this.gameState.playerAP}`);
    this.hpText.setText(`👑 You ${this.gameState.playerKingHP}  ·  Enemy ${this.gameState.enemyKingHP}`);
  }

  setButtonEnabled(enabled) {
    if (enabled) {
      this.endTurnBtn.setFillStyle(THEME.colors.gold);
      this.endTurnBtn.setInteractive({ useHandCursor: true });
      this.endTurnBtnText.setAlpha(1);
    } else {
      this.endTurnBtn.setFillStyle(0x334155);
      this.endTurnBtn.disableInteractive();
      this.endTurnBtnText.setAlpha(0.4);
    }
  }

  // ===================== HINT =====================
  createHintText() {
    const y = this.BOARD_Y + this.BOARD_H + (this.CANVAS_H - this.BOARD_Y - this.BOARD_H) * 0.05 + 5;
    this.hintText = this.add.text(this.CANVAS_W / 2, y, "", {
      fontFamily: THEME.fonts.body,
      fontSize: this.isMobile ? "11px" : "12px",
      color: THEME.hex(THEME.colors.textMuted),
      fontStyle: "500",
    }).setOrigin(0.5);
    this.updateHint();
  }

  updateHint() {
    if (this.gameState.isAITurn) {
      this.hintText.setText("⏳ Enemy is thinking...");
      this.hintText.setColor(THEME.hex(THEME.colors.red));
    } else if (this.gameState.selectedCard !== null) {
      this.hintText.setText("📍 Klik tile yang nyala");
      this.hintText.setColor(THEME.hex(THEME.colors.green));
    } else if (this.gameState.selectedUnit) {
      this.hintText.setText("🔵 Gerak  ·  🔴 Nyerang");
      this.hintText.setColor(THEME.hex(THEME.colors.gold));
    } else {
      this.hintText.setText("💡 Klik kartu atau unit");
      this.hintText.setColor(THEME.hex(THEME.colors.textMuted));
    }
  }

  // ===================== INFO PANEL =====================
  createInfoPanel() {
    const pw = this.isMobile ? 230 : 280;
    const ph = 210;
    const px = this.CANVAS_W - pw - 15;
    const py = this.TOP_BAR_H + 10;

    this.infoPanel = this.add.container(px, py);
    this.infoPanel.setAlpha(0);
    this.infoPanel.setVisible(false);

    const bg = this.add.rectangle(pw / 2, ph / 2, pw, ph, 0x0f172a, 0.97);
    bg.setStrokeStyle(2, THEME.colors.blue);

    const title = this.add.text(pw / 2, 20, "📊 GAME INFO", {
      fontFamily: THEME.fonts.title,
      fontSize: "12px",
      color: THEME.hex(THEME.colors.blue),
      fontStyle: "700",
    }).setOrigin(0.5);

    const textStyle = {
      fontFamily: THEME.fonts.body,
      fontSize: this.isMobile ? "11px" : "12px",
      color: THEME.hex(THEME.colors.text),
    };

    this.deckText = this.add.text(20, 55, "", textStyle);
    this.enemyDeckText = this.add.text(20, 80, "", textStyle);
    this.handText = this.add.text(20, 115, "", textStyle);
    this.enemyHandText = this.add.text(20, 140, "", textStyle);
    this.diffText = this.add.text(20, 175, "", {
      ...textStyle, fontSize: "10px",
      color: THEME.hex(THEME.colors.textDim), fontStyle: "italic",
    });

    this.infoPanel.add([bg, title, this.deckText, this.enemyDeckText, this.handText, this.enemyHandText, this.diffText]);
    this.updateInfoPanel();
  }

  updateInfoPanel() {
    if (!this.deckText) return;
    this.deckText.setText(`🃏 Your Deck: ${this.gameState.deck.length}`);
    this.enemyDeckText.setText(`🃏 Enemy Deck: ${this.gameState.enemyDeck.length}`);
    this.handText.setText(`✋ Hand: ${this.gameState.hand.length}/5`);
    this.enemyHandText.setText(`✋ Enemy Hand: ${this.gameState.enemyHand.length}/5`);
    const d = { easy: "Easy", normal: "Normal", hard: "Hard" };
    this.diffText.setText(`🎯 Difficulty: ${d[gameSettings.difficulty]}`);
  }

  toggleInfoPanel() {
    this.playSound("click", gameSettings.volume * 0.5);
    this.gameState.infoPanelOpen = !this.gameState.infoPanelOpen;

    if (this.gameState.infoPanelOpen) {
      this.infoPanel.setVisible(true);
      this.tweens.add({ targets: this.infoPanel, alpha: 1, duration: 200 });
    } else {
      this.tweens.add({
        targets: this.infoPanel, alpha: 0, duration: 150,
        onComplete: () => this.infoPanel.setVisible(false),
      });
    }
  }

  // ===================== TURN BANNER =====================
  showTurnBanner(text) {
    const cx = this.CANVAS_W / 2;
    const cy = this.CANVAS_H / 2;

    const banner = this.add.text(cx, cy, text, {
      fontFamily: THEME.fonts.title,
      fontSize: this.isMobile ? "36px" : "52px",
      color: THEME.hex(THEME.colors.gold),
      fontStyle: "900",
      stroke: "#000000",
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: banner, alpha: 1, scale: 1, duration: 300, ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: banner, alpha: 0, delay: 600, duration: 300,
          onComplete: () => banner.destroy(),
        });
      },
    });
  }

  // ===================== BOARD =====================
  createBoardVisual() {
    this.boardContainer.removeAll(true);

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const x = col * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;
        const y = row * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;

        const tile = this.add.rectangle(x, y, this.TILE_SIZE, this.TILE_SIZE, 0x0f172a);
        tile.setStrokeStyle(1, 0x1e293b);
        tile.setInteractive({ useHandCursor: true });
        tile.tileRow = row;
        tile.tileCol = col;

        tile.on("pointerover", () => {
          if (!this.gameState.isAITurn && !this.gameState.isGameOver && !this.gameState.isAnimating)
            tile.setStrokeStyle(2, THEME.colors.gold, 0.6);
        });
        tile.on("pointerout", () => tile.setStrokeStyle(1, 0x1e293b));
        tile.on("pointerdown", () => this.onTileClick(row, col));

        this.boardContainer.add(tile);

        const overlay = this.add.rectangle(x, y, this.TILE_SIZE, this.TILE_SIZE, 0xffffff, 0);
        overlay.tileRow = row;
        overlay.tileCol = col;
        this.boardContainer.add(overlay);
        tile.overlay = overlay;

        const occupant = this.gameState.board[row][col];
        if (occupant) this.renderOccupant(row, col, occupant);
      }
    }
    this.updateHighlights();
  }

  renderOccupant(row, col, occupant, animate = false) {
    const x = col * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;
    const y = row * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;

    const color = occupant.type === "KING"
      ? (occupant.owner === "player" ? THEME.colors.blue : THEME.colors.red)
      : (occupant.owner === "player" ? THEME.colors.blue : THEME.colors.redDark);

    const radius = occupant.type === "KING"
      ? this.TILE_SIZE * 0.35 : this.TILE_SIZE * 0.32;

    const glow = this.add.circle(x, y, radius + 4, color, 0.2);
    const circle = this.add.circle(x, y, radius, color);
    circle.setStrokeStyle(2, 0xffffff, 0.5);

    let label = occupant.type === "KING" ? "👑" : occupant.name[0];
    const iconText = this.add.text(x, y - 4, label, {
      fontSize: occupant.type === "KING"
        ? `${Math.round(this.TILE_SIZE * 0.42)}px`
        : `${Math.round(this.TILE_SIZE * 0.34)}px`,
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);

    const barWidth = radius * 2;
    const barHeight = this.isMobile ? 5 : 7;
    const barY = y + radius + 7;

    const hpBg = this.add.rectangle(x, barY, barWidth, barHeight, 0x000000, 0.75);
    const hpRatio = Math.max(0, occupant.hp / occupant.maxHp);
    const hpColor = hpRatio > 0.5 ? THEME.colors.green : hpRatio > 0.25 ? THEME.colors.orange : THEME.colors.red;
    const hpBar = this.add.rectangle(
      x - barWidth / 2 + (barWidth * hpRatio) / 2,
      barY, barWidth * hpRatio, barHeight, hpColor
    );

    const hpText = this.add.text(x, barY, `${occupant.hp}`, {
      fontSize: this.isMobile ? "8px" : "10px",
      color: "#ffffff",
      fontStyle: "700",
      fontFamily: THEME.fonts.body,
    }).setOrigin(0.5);

    const allObjs = [glow, circle, iconText, hpBg, hpBar, hpText];

    if (animate) {
      allObjs.forEach((obj) => obj.setScale(0));
      this.tweens.add({ targets: allObjs, scale: 1, duration: 300, ease: "Back.easeOut" });
    }
    allObjs.forEach((obj) => this.boardContainer.add(obj));
  }

  updateHighlights() {
    this.boardContainer.list.forEach((obj) => {
      if (obj.overlay) obj.overlay.setFillStyle(0xffffff, 0);
    });

    if (this.gameState.selectedCard !== null) {
      const cardKey = this.gameState.hand[this.gameState.selectedCard];
      const card = CARDS[cardKey];

      if (card && card.type === "UNIT") {
        for (let r = 3; r <= 4; r++) {
          for (let c = 0; c < 5; c++) {
            if (this.gameState.board[r][c] === null) {
              const tile = this.getTileAt(r, c);
              if (tile && tile.overlay) tile.overlay.setFillStyle(THEME.colors.green, 0.35);
            }
          }
        }
      } else if (card && card.type === "SPELL") {
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            const occ = this.gameState.board[r][c];
            if (occ) {
              const tile = this.getTileAt(r, c);
              if (tile && tile.overlay) {
                if (card.targetType === "ANY_UNIT" && occ.type !== "KING") {
                  tile.overlay.setFillStyle(THEME.colors.orange, 0.4);
                } else if (card.targetType === "ALLY_UNIT" && occ.owner === "player" && occ.type === "UNIT") {
                  tile.overlay.setFillStyle(THEME.colors.green, 0.5);
                }
              }
            }
          }
        }
      }
    }

    if (this.gameState.selectedUnit) {
      const { row: sr, col: sc } = this.gameState.selectedUnit;
      const selTile = this.getTileAt(sr, sc);
      if (selTile && selTile.overlay) selTile.overlay.setFillStyle(THEME.colors.gold, 0.4);

      const attacker = this.gameState.board[sr][sc];
      if (!attacker) return;

      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const occ = this.gameState.board[r][c];
          const dist = Math.abs(sr - r) + Math.abs(sc - c);
          const tile = this.getTileAt(r, c);

          if (!occ && dist === 1) {
            if (tile && tile.overlay) tile.overlay.setFillStyle(THEME.colors.blue, 0.35);
          }
          if (occ && occ.owner === "enemy" && dist <= attacker.range && dist > 0) {
            if (tile && tile.overlay) tile.overlay.setFillStyle(THEME.colors.red, 0.4);
          }
        }
      }
    }
  }

  getTileAt(row, col) {
    return this.boardContainer.list.find(
      (obj) => obj.tileRow === row && obj.tileCol === col && obj.type === "Rectangle" && !obj.overlay
    );
  }

  // ===================== HAND =====================
  createHandVisual() {
    this.handContainer.removeAll(true);

    // Hitung space available buat hand
    const hintY = this.BOARD_Y + this.BOARD_H + (this.CANVAS_H - this.BOARD_Y - this.BOARD_H) * 0.05 + 5;
    const handAreaTop = hintY + 15;
    const handAreaBottom = this.CANVAS_H - 10;
    const handAreaH = handAreaBottom - handAreaTop;

    // Card size: lebar max 140, tapi tinggi max = handAreaH - 10
    let cardW = this.isMobile ? 90 : 120;
    let cardH = this.isMobile ? 110 : 145;

    // Clamp kalau area hand kekecilan
    if (cardH > handAreaH - 10) {
      const ratio = (handAreaH - 10) / cardH;
      cardH = cardH * ratio;
      cardW = cardW * ratio;
    }

    const cardGap = this.isMobile ? 8 : 12;
    const totalWidth = this.gameState.hand.length * (cardW + cardGap) - cardGap;
    const handY = handAreaTop + handAreaH / 2;
    const startX = this.CANVAS_W / 2 - totalWidth / 2;

    this.gameState.hand.forEach((cardKey, index) => {
      const card = CARDS[cardKey];
      const x = startX + index * (cardW + cardGap) + cardW / 2;
      const cardContainer = this.add.container(x, handY);

      const isSelected = this.gameState.selectedCard === index;
      const canAfford = card.cost <= this.gameState.playerAP;
      const isSpell = card.type === "SPELL";

      if (isSelected) {
        const glow = this.add.rectangle(0, 0, cardW + 8, cardH + 8, THEME.colors.green, 0.25);
        cardContainer.add(glow);
      }

      const bgColor = isSpell ? 0x1a1030 : 0x0f172a;
      const bg = this.add.rectangle(0, 0, cardW, cardH, bgColor);
      bg.setStrokeStyle(isSelected ? 3 : 2, isSelected ? THEME.colors.green : (isSpell ? THEME.colors.purple : THEME.colors.gold), 1);
      bg.setInteractive({ useHandCursor: true });

      // Badge
      const badgeColor = isSpell ? THEME.colors.purple : THEME.colors.blue;
      const badgeH = Math.max(14, cardH * 0.13);
      const badgeW = cardW * 0.75;
      const badgeY = -cardH / 2 + badgeH / 2 + 4;
      const badge = this.add.rectangle(0, badgeY, badgeW, badgeH, badgeColor);
      const badgeText = this.add.text(0, badgeY, isSpell ? "✦ SPELL" : "⚔ UNIT", {
        fontFamily: THEME.fonts.body,
        fontSize: `${Math.max(8, cardW * 0.08)}px`,
        color: "#ffffff",
        fontStyle: "800",
      }).setOrigin(0.5);

      const nameText = this.add.text(0, -cardH / 2 + badgeH + cardH * 0.13, card.name, {
        fontFamily: THEME.fonts.body,
        fontSize: `${Math.max(10, cardW * 0.12)}px`,
        color: THEME.hex(THEME.colors.gold),
        fontStyle: "700",
      }).setOrigin(0.5);

      const iconText = this.add.text(0, 0, card.icon, {
        fontSize: `${Math.max(24, cardW * 0.4)}px`,
      }).setOrigin(0.5);

      const descText = this.add.text(0, cardH / 2 - cardH * 0.22, card.desc, {
        fontFamily: THEME.fonts.body,
        fontSize: `${Math.max(8, cardW * 0.085)}px`,
        color: THEME.hex(THEME.colors.textMuted),
        wordWrap: { width: cardW - 10 },
        align: "center",
      }).setOrigin(0.5);

      const costText = this.add.text(0, cardH / 2 - cardH * 0.08, `◆ ${card.cost}`, {
        fontFamily: THEME.fonts.body,
        fontSize: `${Math.max(10, cardW * 0.11)}px`,
        color: canAfford ? THEME.hex(THEME.colors.green) : THEME.hex(THEME.colors.red),
        fontStyle: "800",
      }).setOrigin(0.5);

      cardContainer.add([bg, badge, badgeText, nameText, iconText, descText, costText]);

      if (!canAfford) cardContainer.setAlpha(0.4);

      bg.on("pointerdown", () => this.onCardClick(index));
      bg.on("pointerover", () => { if (canAfford) cardContainer.setScale(1.08); });
      bg.on("pointerout", () => cardContainer.setScale(1.0));

      this.handContainer.add(cardContainer);
    });
  }

  // ===================== INTERACTIONS =====================
  onCardClick(index) {
    if (this.gameState.isAITurn || this.gameState.isGameOver || this.gameState.isAnimating) return;
    this.playSound("click", gameSettings.volume * 0.6);

    if (this.gameState.selectedCard === index) {
      this.gameState.selectedCard = null;
    } else {
      this.gameState.selectedCard = index;
      this.gameState.selectedUnit = null;
    }
    this.refreshAll();
  }

  onTileClick(row, col) {
    if (this.gameState.isAITurn || this.gameState.isGameOver || this.gameState.isAnimating) return;

    const occupant = this.gameState.board[row][col];

    if (this.gameState.selectedCard !== null) {
      this.handleCardPlay(row, col);
      return;
    }

    if (this.gameState.selectedUnit) {
      const { row: sr, col: sc } = this.gameState.selectedUnit;

      if (sr === row && sc === col) {
        this.gameState.selectedUnit = null;
        this.refreshAll();
        return;
      }

      const attacker = this.gameState.board[sr][sc];
      const dist = Math.abs(sr - row) + Math.abs(sc - col);

      if (occupant && occupant.owner === "enemy" && dist <= attacker.range && dist > 0) {
        if (this.gameState.playerAP < 1) return;
        this.executeAttack(sr, sc, row, col);
        return;
      }

      if (!occupant && dist === 1) {
        if (this.gameState.playerAP < 1) return;
        this.executeMove(sr, sc, row, col);
        return;
      }

      this.gameState.selectedUnit = null;
      this.refreshAll();
      return;
    }

    if (occupant && occupant.owner === "player" && occupant.type === "UNIT") {
      this.playSound("click", gameSettings.volume * 0.4);
      this.gameState.selectedUnit = { row, col };
      this.refreshAll();
    }
  }

  handleCardPlay(row, col) {
    const cardKey = this.gameState.hand[this.gameState.selectedCard];
    const card = CARDS[cardKey];

    if (card.cost > this.gameState.playerAP) return;

    if (card.type === "UNIT") {
      if (row < 3 || this.gameState.board[row][col] !== null) return;

      this.gameState.board[row][col] = {
        type: "UNIT", owner: "player", name: card.name,
        hp: card.hp, maxHp: card.hp,
        attack: card.attack, range: card.range,
      };

      this.gameState.hand.splice(this.gameState.selectedCard, 1);
      this.gameState.discard.push(cardKey);
      this.gameState.playerAP -= card.cost;
      this.gameState.selectedCard = null;

      this.playSound("click", gameSettings.volume * 0.8);

      this.createBoardVisual();
      this.createHandVisual();
      this.updateTopBar();
      this.updateHint();
      this.updateInfoPanel();
      this.renderOccupant(row, col, this.gameState.board[row][col], true);
      this.updateHighlights();
      return;
    }

    if (card.type === "SPELL") {
      const occupant = this.gameState.board[row][col];
      if (!occupant) return;
      if (card.targetType === "ANY_UNIT" && occupant.type === "KING") return;
      if (card.targetType === "ALLY_UNIT" && (occupant.owner !== "player" || occupant.type !== "UNIT")) return;
      this.executeSpell(row, col, card);
    }
  }

  executeSpell(row, col, card) {
    const target = this.gameState.board[row][col];
    if (!target) return;

    this.gameState.isAnimating = true;
    this.playSound("spell", gameSettings.volume * 1.2);

    if (card.effect === "DAMAGE") this.showSpellNotification("🔥", "FIREBALL!", THEME.colors.orange);
    else if (card.effect === "HEAL") this.showSpellNotification("💚", "HEAL!", THEME.colors.green);
    else if (card.effect === "BUFF") this.showSpellNotification("💪", "RAGE!", THEME.colors.gold);

    const tile = this.getTileAt(row, col);
    if (tile) this.tweens.add({ targets: tile, alpha: 0.3, yoyo: true, repeat: 2, duration: 100 });

    if (card.effect === "DAMAGE") {
      target.hp -= card.value;
      this.showFloatingText(row, col, `-${card.value}`, THEME.colors.orange);
    } else if (card.effect === "HEAL") {
      const healed = Math.min(card.value, target.maxHp - target.hp);
      target.hp += healed;
      this.showFloatingText(row, col, `+${healed}`, THEME.colors.green);
    } else if (card.effect === "BUFF") {
      target.attack += card.value;
      this.showFloatingText(row, col, `+${card.value} ATK`, THEME.colors.gold);
    }

    this.gameState.playerAP -= card.cost;
    this.gameState.hand.splice(this.gameState.selectedCard, 1);
    this.gameState.discard.push(card.id);
    this.gameState.selectedCard = null;

    if (target.hp <= 0) {
      this.gameState.board[row][col] = null;
      this.playSound("death", gameSettings.volume * 0.8);
    }

    this.time.delayedCall(400, () => {
      this.gameState.isAnimating = false;
      this.refreshAll();
      this.checkWinLoss();
    });
  }

  executeMove(fromRow, fromCol, toRow, toCol) {
    this.gameState.isAnimating = true;
    this.gameState.board[toRow][toCol] = this.gameState.board[fromRow][fromCol];
    this.gameState.board[fromRow][fromCol] = null;
    this.gameState.playerAP -= 1;

    this.playSound("click", gameSettings.volume * 0.5);

    this.refreshAll();
    this.gameState.selectedUnit = { row: toRow, col: toCol };
    this.updateHighlights();

    this.time.delayedCall(50, () => {
      this.animateTileSpawn(toRow, toCol);
      this.gameState.isAnimating = false;
    });
  }

  animateTileSpawn(row, col) {
    const x = this.BOARD_X + col * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;
    const y = this.BOARD_Y + row * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;

    const nearby = this.boardContainer.list.filter((obj) => {
      const ox = obj.x + this.BOARD_X;
      const oy = obj.y + this.BOARD_Y;
      return Math.abs(ox - x) < 40 && Math.abs(oy - y) < 45;
    });

    nearby.forEach((obj) => {
      obj.setScale(0.3);
      this.tweens.add({ targets: obj, scale: 1, duration: 250, ease: "Back.easeOut" });
    });
  }

  executeAttack(fromRow, fromCol, toRow, toCol) {
    this.gameState.isAnimating = true;
    const attacker = this.gameState.board[fromRow][fromCol];
    const target = this.gameState.board[toRow][toCol];

    this.playSound("attack", gameSettings.volume * 0.8);

    const ax = this.BOARD_X + fromCol * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;
    const ay = this.BOARD_Y + fromRow * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;

    const attackerObjs = this.boardContainer.list.filter((obj) => {
      const ox = obj.x + this.BOARD_X;
      const oy = obj.y + this.BOARD_Y;
      return Math.abs(ox - ax) < 45 && Math.abs(oy - ay) < 50;
    });

    this.tweens.add({ targets: attackerObjs, x: "+=10", y: "+=10", yoyo: true, duration: 120 });

    const tx = this.BOARD_X + toCol * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;
    const ty = this.BOARD_Y + toRow * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;

    const targetObjs = this.boardContainer.list.filter((obj) => {
      const ox = obj.x + this.BOARD_X;
      const oy = obj.y + this.BOARD_Y;
      return Math.abs(ox - tx) < 45 && Math.abs(oy - ty) < 50;
    });

    this.time.delayedCall(120, () => {
      targetObjs.forEach((obj) => {
        this.tweens.add({ targets: obj, alpha: 0.3, yoyo: true, repeat: 1, duration: 80 });
      });
    });

    target.hp -= attacker.attack;
    this.gameState.playerAP -= 1;
    this.showFloatingText(toRow, toCol, `-${attacker.attack}`, THEME.colors.red);

    if (target.type === "KING") {
      if (target.owner === "enemy") this.gameState.enemyKingHP = target.hp;
      else this.gameState.playerKingHP = target.hp;
    }

    const died = target.hp <= 0 && target.type !== "KING";
    if (died) {
      this.gameState.board[toRow][toCol] = null;
      this.gameState.selectedUnit = null;
      this.playSound("death", gameSettings.volume * 0.8);

      this.time.delayedCall(300, () => {
        targetObjs.forEach((obj) => {
          this.tweens.add({ targets: obj, alpha: 0, scale: 0.3, duration: 300 });
        });
      });
    }

    this.time.delayedCall(500, () => {
      this.gameState.isAnimating = false;
      this.refreshAll();
      this.checkWinLoss();
    });
  }

  showFloatingText(row, col, text, color) {
    const x = this.BOARD_X + col * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;
    const y = this.BOARD_Y + row * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;

    const txt = this.add.text(x, y, text, {
      fontFamily: THEME.fonts.title,
      fontSize: this.isMobile ? "18px" : "24px",
      color: THEME.hex(color),
      fontStyle: "900",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: txt, scale: 1.4, duration: 150, ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: txt, y: y - 50, alpha: 0, scale: 1, duration: 700,
          onComplete: () => txt.destroy(),
        });
      },
    });
  }

  refreshAll() {
    this.createBoardVisual();
    this.createHandVisual();
    this.updateTopBar();
    this.updateHint();
    this.updateInfoPanel();
  }

  // ===================== TURN =====================
  onEndTurn() {
    if (this.gameState.isAITurn || this.gameState.isGameOver || this.gameState.isAnimating) return;
    this.playSound("click", gameSettings.volume * 0.6);

    this.gameState.selectedCard = null;
    this.gameState.selectedUnit = null;
    this.refreshAll();

    this.showTurnBanner("ENEMY TURN");
    this.playSound("turn", gameSettings.volume * 0.8);

    this.time.delayedCall(900, () => this.runAITurn());
  }

  runAITurn() {
    this.gameState.isAITurn = true;
    this.gameState.enemyAP = Math.min(this.gameState.turn + 2 + this.gameState.aiBonusAP, 10);
    this.drawEnemyCard();

    this.setButtonEnabled(false);
    this.updateHint();
    this.updateInfoPanel();

    this.time.delayedCall(500, () => this.aiStep(1));
  }

  aiStep(stepNum) {
    if (this.gameState.isGameOver) { this.endAITurn(); return; }
    if (stepNum > 20) { this.endAITurn(); return; }

    const acted = this.aiDoAction();

    if (acted && this.gameState.enemyAP > 0) {
      this.time.delayedCall(600, () => this.aiStep(stepNum + 1));
    } else {
      this.time.delayedCall(500, () => this.endAITurn());
    }
  }

  aiDoAction() {
    const enemyUnits = this.getUnitsByOwner("enemy");
    const playerUnits = this.getUnitsByOwner("player");

    if (this.gameState.enemyAP >= 2) {
      for (let i = 0; i < this.gameState.enemyHand.length; i++) {
        const card = CARDS[this.gameState.enemyHand[i]];
        if (card.type === "SPELL" && card.effect === "HEAL") {
          const wounded = enemyUnits.find((u) => u.unit.hp < u.unit.maxHp * 0.5);
          if (wounded) { this.aiCastSpell(i, wounded.row, wounded.col, card); return true; }
        }
      }
    }

    for (const eu of enemyUnits) {
      for (const pu of playerUnits) {
        const d = Math.abs(eu.row - pu.row) + Math.abs(eu.col - pu.col);
        if (d <= eu.unit.range && d > 0) {
          if (this.gameState.enemyAP >= 1) { this.aiAttack(eu.row, eu.col, pu.row, pu.col); return true; }
        }
      }
      const dKing = Math.abs(eu.row - 4) + Math.abs(eu.col - 2);
      if (dKing <= eu.unit.range && dKing > 0) {
        if (this.gameState.enemyAP >= 1) { this.aiAttack(eu.row, eu.col, 4, 2); return true; }
      }
    }

    for (let i = 0; i < this.gameState.enemyHand.length; i++) {
      const card = CARDS[this.gameState.enemyHand[i]];
      if (card.type === "UNIT" && card.cost <= this.gameState.enemyAP) {
        const tile = this.findEnemySummonTile();
        if (tile) { this.aiSummon(i, tile.row, tile.col); return true; }
      }
    }

    for (const eu of enemyUnits) {
      if (this.gameState.enemyAP >= 1) {
        const move = this.findBestMove(eu.row, eu.col);
        if (move) { this.aiMove(eu.row, eu.col, move.row, move.col); return true; }
      }
    }

    return false;
  }

  aiCastSpell(handIndex, row, col, card) {
    const target = this.gameState.board[row][col];
    if (!target) return;

    this.playSound("spell", gameSettings.volume * 0.7);

    if (card.effect === "HEAL") {
      this.showSpellNotification("💚", "ENEMY HEAL!", THEME.colors.green);
      const healed = Math.min(card.value, target.maxHp - target.hp);
      target.hp += healed;
      this.showFloatingText(row, col, `+${healed}`, THEME.colors.green);
    } else if (card.effect === "BUFF") {
      this.showSpellNotification("💪", "ENEMY RAGE!", THEME.colors.gold);
      target.attack += card.value;
      this.showFloatingText(row, col, `+${card.value} ATK`, THEME.colors.gold);
    } else if (card.effect === "DAMAGE") {
      this.showSpellNotification("🔥", "ENEMY FIREBALL!", THEME.colors.orange);
      target.hp -= card.value;
      this.showFloatingText(row, col, `-${card.value}`, THEME.colors.orange);
      if (target.hp <= 0) this.gameState.board[row][col] = null;
    }

    this.gameState.enemyHand.splice(handIndex, 1);
    this.gameState.enemyDiscard.push(card.id);
    this.gameState.enemyAP -= card.cost;
    this.refreshAll();
  }

  getUnitsByOwner(owner) {
    const units = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const o = this.gameState.board[r][c];
        if (o && o.owner === owner && o.type === "UNIT") {
          units.push({ row: r, col: c, unit: o });
        }
      }
    }
    return units;
  }

  findEnemySummonTile() {
    const candidates = [];
    for (let r = 0; r <= 1; r++) {
      for (let c = 0; c < 5; c++) {
        if (this.gameState.board[r][c] === null) candidates.push({ row: r, col: c });
      }
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => Math.abs(a.col - 2) - Math.abs(b.col - 2));
    return candidates[0];
  }

  findBestMove(fromRow, fromCol) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let best = null;
    let bestDist = Math.abs(fromRow - 4) + Math.abs(fromCol - 2);

    for (const [dr, dc] of dirs) {
      const nr = fromRow + dr;
      const nc = fromCol + dc;
      if (nr < 0 || nr > 4 || nc < 0 || nc > 4) continue;
      if (this.gameState.board[nr][nc] !== null) continue;

      const d = Math.abs(nr - 4) + Math.abs(nc - 2);
      if (d < bestDist) { bestDist = d; best = { row: nr, col: nc }; }
    }
    return best;
  }

  aiSummon(handIndex, row, col) {
    const cardKey = this.gameState.enemyHand[handIndex];
    const card = CARDS[cardKey];

    this.gameState.board[row][col] = {
      type: "UNIT", owner: "enemy", name: card.name,
      hp: card.hp, maxHp: card.hp,
      attack: card.attack, range: card.range,
    };

    this.gameState.enemyHand.splice(handIndex, 1);
    this.gameState.enemyDiscard.push(cardKey);
    this.gameState.enemyAP -= card.cost;

    this.refreshAll();
    this.renderOccupant(row, col, this.gameState.board[row][col], true);
  }

  aiMove(fromRow, fromCol, toRow, toCol) {
    this.gameState.board[toRow][toCol] = this.gameState.board[fromRow][fromCol];
    this.gameState.board[fromRow][fromCol] = null;
    this.gameState.enemyAP -= 1;
    this.refreshAll();
  }

  aiAttack(fromRow, fromCol, toRow, toCol) {
    const attacker = this.gameState.board[fromRow][fromCol];
    const target = this.gameState.board[toRow][toCol];

    this.playSound("attack", gameSettings.volume * 0.5);

    target.hp -= attacker.attack;
    this.gameState.enemyAP -= 1;
    this.showFloatingText(toRow, toCol, `-${attacker.attack}`, THEME.colors.red);

    if (target.type === "KING") {
      if (target.owner === "player") this.gameState.playerKingHP = target.hp;
      else this.gameState.enemyKingHP = target.hp;
    }

    if (target.hp <= 0 && target.type !== "KING") {
      this.gameState.board[toRow][toCol] = null;
      this.playSound("death", gameSettings.volume * 0.5);
    }

    this.refreshAll();
    this.checkWinLoss();
  }

  endAITurn() {
    if (this.gameState.isGameOver) return;
    this.gameState.isAITurn = false;
    this.gameState.turn++;
    this.gameState.playerAP = Math.min(this.gameState.turn + 2, 10);
    this.drawCard();

    this.setButtonEnabled(true);
    this.refreshAll();
    this.showTurnBanner("YOUR TURN");
    this.playSound("turn", gameSettings.volume * 0.8);
  }

  // ===================== WIN / LOSS =====================
  checkWinLoss() {
    if (this.gameState.enemyKingHP <= 0) {
      this.showGameOver("🎉 YOU WIN!", "King musuh berhasil lu hancurin!");
    } else if (this.gameState.playerKingHP <= 0) {
      this.showGameOver("💀 YOU LOSE", "King lu hancur. Coba lagi!");
    }
  }

  showGameOver(title, message) {
    this.gameState.isGameOver = true;
    this.setButtonEnabled(false);

    const cx = this.CANVAS_W / 2;
    const cy = this.CANVAS_H / 2;

    this.add.rectangle(cx, cy, this.CANVAS_W * 2, this.CANVAS_H * 2, 0x000000, 0.85);

    const boxW = this.isMobile ? 300 : 460;
    const boxH = this.isMobile ? 240 : 280;

    const box = this.add.rectangle(cx, cy, boxW, boxH, 0x0f172a);
    box.setStrokeStyle(3, THEME.colors.gold);
    box.setScale(0);
    this.tweens.add({ targets: box, scale: 1, duration: 400, ease: "Back.easeOut" });

    this.add.text(cx, cy - (this.isMobile ? 60 : 80), title, {
      fontFamily: THEME.fonts.title,
      fontSize: this.isMobile ? "22px" : "30px",
      color: THEME.hex(THEME.colors.gold),
      fontStyle: "900",
    }).setOrigin(0.5);

    this.add.text(cx, cy, message, {
      fontFamily: THEME.fonts.body,
      fontSize: this.isMobile ? "13px" : "15px",
      color: THEME.hex(THEME.colors.text),
      wordWrap: { width: boxW - 40 },
      align: "center",
    }).setOrigin(0.5);

    const btnW = this.isMobile ? 120 : 170;
    const btnH = this.isMobile ? 42 : 52;
    const btnGap = 12;

    const btnAgain = this.add.rectangle(cx - (btnW / 2 + btnGap / 2), cy + (this.isMobile ? 75 : 90), btnW, btnH, THEME.colors.green);
    btnAgain.setInteractive({ useHandCursor: true });
    this.add.text(cx - (btnW / 2 + btnGap / 2), cy + (this.isMobile ? 75 : 90), "MAIN LAGI", {
      fontFamily: THEME.fonts.body,
      fontSize: this.isMobile ? "12px" : "14px",
      color: "#ffffff",
      fontStyle: "800",
    }).setOrigin(0.5);
    btnAgain.on("pointerdown", () => this.scene.start("GameScene"));

    const btnMenu = this.add.rectangle(cx + (btnW / 2 + btnGap / 2), cy + (this.isMobile ? 75 : 90), btnW, btnH, THEME.colors.gold);
    btnMenu.setInteractive({ useHandCursor: true });
    this.add.text(cx + (btnW / 2 + btnGap / 2), cy + (this.isMobile ? 75 : 90), "MENU", {
      fontFamily: THEME.fonts.body,
      fontSize: this.isMobile ? "12px" : "14px",
      color: "#0f172a",
      fontStyle: "800",
    }).setOrigin(0.5);
    btnMenu.on("pointerdown", () => this.scene.start("MenuScene"));
  }
}