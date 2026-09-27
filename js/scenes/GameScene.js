class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.CANVAS_W = this.scale.width;
    this.CANVAS_H = this.scale.height;

    // === LAYOUT (board center) ===
    this.TILE_SIZE = 100;
    this.TILE_GAP = 6;
    this.BOARD_W = 5 * this.TILE_SIZE + 4 * this.TILE_GAP; // 524
    this.BOARD_X = (this.CANVAS_W - this.BOARD_W) / 2;
    this.BOARD_Y = 140;

    // === DIFFICULTY ===
    const diff = gameSettings.difficulty;
    const kingHP = diff === "easy" ? 15 : diff === "hard" ? 25 : 20;
    const aiBonusAP = diff === "hard" ? 2 : 0;

    this.gameState = {
      turn: 1,
      playerAP: 3,
      enemyAP: 0,
      playerKingHP: kingHP,
      enemyKingHP: kingHP,
      maxKingHP: kingHP,
      board: [],
      deck: [],
      hand: [],
      discard: [],
      enemyDeck: [],
      enemyHand: [],
      enemyDiscard: [],
      selectedCard: null,
      selectedUnit: null,
      isAITurn: false,
      isGameOver: false,
      isAnimating: false,
      aiBonusAP: aiBonusAP,
      infoPanelOpen: false,
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
  }

  // ===================== SOUND =====================
  playSound(key, vol = null) {
    if (!gameSettings.soundEnabled) return;
    try {
      if (this.sound.get(key)) {
        this.sound.play(key, { volume: vol ?? gameSettings.volume });
      }
    } catch (e) {}
  }

  showSpellNotification(icon, name, color) {
    const cx = this.CANVAS_W / 2;
    const cy = this.CANVAS_H / 2;

    const container = this.add.container(cx, cy);
    const bg = this.add.rectangle(0, 0, 320, 85, 0x000000, 0.9);
    bg.setStrokeStyle(4, color);

    const iconText = this.add.text(-100, 0, icon, { fontSize: "52px" }).setOrigin(0.5);
    const nameText = this.add.text(25, 0, name, {
      fontSize: "30px",
      color: "#" + color.toString(16).padStart(6, "0"),
      fontStyle: "bold",
    }).setOrigin(0.5);

    container.add([bg, iconText, nameText]);
    container.setScale(0).setAlpha(0);

    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 250,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: container,
          alpha: 0,
          y: cy - 60,
          delay: 700,
          duration: 400,
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
    const barBg = this.add.rectangle(this.CANVAS_W / 2, 45, this.CANVAS_W - 40, 60, 0x16213e);
    barBg.setStrokeStyle(2, 0x0f3460);

    this.turnText = this.add.text(60, 45, "", {
      fontSize: "20px", color: "#f0c040", fontStyle: "bold",
    }).setOrigin(0, 0.5);

    this.apText = this.add.text(280, 45, "", {
      fontSize: "22px", color: "#2ecc71", fontStyle: "bold",
    }).setOrigin(0, 0.5);

    this.hpText = this.add.text(500, 45, "", {
      fontSize: "20px", color: "#e74c3c", fontStyle: "bold",
    }).setOrigin(0, 0.5);

    // === INFO BUTTON (toggle panel) ===
    const infoBtn = this.add.rectangle(this.CANVAS_W - 260, 45, 130, 42, 0x3498db);
    infoBtn.setStrokeStyle(2, 0xffffff, 0.3);
    infoBtn.setInteractive({ useHandCursor: true });
    this.infoBtnText = this.add.text(this.CANVAS_W - 260, 45, "ℹ️ INFO", {
      fontSize: "15px", color: "#fff", fontStyle: "bold",
    }).setOrigin(0.5);

    infoBtn.on("pointerover", () => infoBtn.setFillStyle(0x2980b9));
    infoBtn.on("pointerout", () => infoBtn.setFillStyle(0x3498db));
    infoBtn.on("pointerdown", () => this.toggleInfoPanel());

    // === END TURN BUTTON (top bar) ===
    this.endTurnBtn = this.add.rectangle(this.CANVAS_W - 120, 45, 190, 42, 0xf0c040);
    this.endTurnBtn.setStrokeStyle(2, 0xffffff, 0.3);
    this.endTurnBtn.setInteractive({ useHandCursor: true });
    this.endTurnBtnText = this.add.text(this.CANVAS_W - 120, 45, "END TURN →", {
      fontSize: "16px", color: "#1a1a2e", fontStyle: "bold",
    }).setOrigin(0.5);

    this.endTurnBtn.on("pointerover", () => {
      if (this.endTurnBtn.input && this.endTurnBtn.input.enabled)
        this.endTurnBtn.setFillStyle(0xffd700);
    });
    this.endTurnBtn.on("pointerout", () => {
      if (this.endTurnBtn.input && this.endTurnBtn.input.enabled)
        this.endTurnBtn.setFillStyle(0xf0c040);
    });
    this.endTurnBtn.on("pointerdown", () => this.onEndTurn());

    this.updateTopBar();
  }

  updateTopBar() {
    this.turnText.setText(`TURN ${this.gameState.turn}`);
    this.apText.setText(`⚡ AP: ${this.gameState.playerAP}`);
    this.hpText.setText(`👑 You ${this.gameState.playerKingHP}  |  Enemy ${this.gameState.enemyKingHP}`);
  }

  setButtonEnabled(enabled) {
    if (enabled) {
      this.endTurnBtn.setFillStyle(0xf0c040);
      this.endTurnBtn.setInteractive({ useHandCursor: true });
      this.endTurnBtnText.setAlpha(1);
    } else {
      this.endTurnBtn.setFillStyle(0x555555);
      this.endTurnBtn.disableInteractive();
      this.endTurnBtnText.setAlpha(0.4);
    }
  }

  // ===================== HINT TEXT =====================
  createHintText() {
    const handY = this.BOARD_Y + 5 * this.TILE_SIZE + 4 * this.TILE_GAP + 30;
    this.hintText = this.add.text(this.CANVAS_W / 2, handY, "", {
      fontSize: "14px",
      color: "#888",
      fontStyle: "italic",
    }).setOrigin(0.5);
    this.updateHint();
  }

  updateHint() {
    if (this.gameState.isAITurn) {
      this.hintText.setText("⏳ Enemy is thinking...");
      this.hintText.setColor("#e74c3c");
    } else if (this.gameState.selectedCard !== null) {
      this.hintText.setText("📍 Klik tile yang nyala buat mainin kartu");
      this.hintText.setColor("#2ecc71");
    } else if (this.gameState.selectedUnit) {
      this.hintText.setText("🔵 Biru = gerak  |  🔴 Merah = nyerang  |  Klik unit lagi buat deselect");
      this.hintText.setColor("#f0c040");
    } else {
      this.hintText.setText("💡 Klik kartu di hand atau klik unit di board");
      this.hintText.setColor("#888");
    }
  }

  // ===================== INFO PANEL (COLLAPSIBLE) =====================
  createInfoPanel() {
    const pw = 320;
    const ph = 260;
    const px = this.CANVAS_W - pw - 30; // kanan atas
    const py = 90;

    this.infoPanel = this.add.container(px, py);
    this.infoPanel.setAlpha(0);
    this.infoPanel.setVisible(false);

    // BG
    const bg = this.add.rectangle(pw / 2, ph / 2, pw, ph, 0x16213e);
    bg.setStrokeStyle(2, 0x3498db);

    // Title
    const title = this.add.text(pw / 2, 25, "📊 GAME INFO", {
      fontSize: "18px", color: "#3498db", fontStyle: "bold",
    }).setOrigin(0.5);

    // Deck counts
    this.deckText = this.add.text(20, 65, "", {
      fontSize: "16px", color: "#eee",
    });
    this.enemyDeckText = this.add.text(20, 95, "", {
      fontSize: "16px", color: "#eee",
    });

    // Divider
    const div = this.add.rectangle(pw / 2, 130, pw - 40, 1, 0x0f3460);

    // Stats
    this.handText = this.add.text(20, 150, "", {
      fontSize: "16px", color: "#eee",
    });
    this.enemyHandText = this.add.text(20, 180, "", {
      fontSize: "16px", color: "#eee",
    });
    this.diffText = this.add.text(20, 210, "", {
      fontSize: "14px", color: "#888", fontStyle: "italic",
    });

    this.infoPanel.add([bg, title, this.deckText, this.enemyDeckText, div,
                        this.handText, this.enemyHandText, this.diffText]);

    this.updateInfoPanel();
  }

  updateInfoPanel() {
    if (!this.deckText) return;
    this.deckText.setText(`🃏 Your Deck: ${this.gameState.deck.length}`);
    this.enemyDeckText.setText(`🃏 Enemy Deck: ${this.gameState.enemyDeck.length}`);
    this.handText.setText(`✋ Your Hand: ${this.gameState.hand.length}/5`);
    this.enemyHandText.setText(`✋ Enemy Hand: ${this.gameState.enemyHand.length}/5`);
    const diffLabels = { easy: "Easy", normal: "Normal", hard: "Hard" };
    this.diffText.setText(`🎯 Difficulty: ${diffLabels[gameSettings.difficulty]}`);
  }

  toggleInfoPanel() {
    this.playSound("click", gameSettings.volume * 0.5);
    this.gameState.infoPanelOpen = !this.gameState.infoPanelOpen;

    if (this.gameState.infoPanelOpen) {
      this.infoPanel.setVisible(true);
      this.tweens.add({
        targets: this.infoPanel,
        alpha: 1,
        y: 90,
        duration: 200,
        ease: "Back.easeOut",
      });
    } else {
      this.tweens.add({
        targets: this.infoPanel,
        alpha: 0,
        duration: 150,
        onComplete: () => this.infoPanel.setVisible(false),
      });
    }
  }

  // ===================== TURN BANNER =====================
  showTurnBanner(text) {
    const cx = this.CANVAS_W / 2;
    const cy = this.CANVAS_H / 2;

    const banner = this.add.text(cx, cy, text, {
      fontSize: "60px", color: "#f0c040", fontStyle: "bold",
      stroke: "#000", strokeThickness: 8,
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

  // ===================== BOARD VISUAL =====================
  createBoardVisual() {
    this.boardContainer.removeAll(true);
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const x = col * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;
        const y = row * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;

        const tile = this.add.rectangle(x, y, this.TILE_SIZE, this.TILE_SIZE, 0x1a1a2e);
        tile.setStrokeStyle(2, 0x0f3460);
        tile.setInteractive({ useHandCursor: true });
        tile.tileRow = row;
        tile.tileCol = col;

        tile.on("pointerover", () => {
          if (!this.gameState.isAITurn && !this.gameState.isGameOver && !this.gameState.isAnimating)
            tile.setStrokeStyle(3, 0xf0c040);
        });
        tile.on("pointerout", () => tile.setStrokeStyle(2, 0x0f3460));
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
      ? (occupant.owner === "player" ? 0x3498db : 0xe74c3c)
      : (occupant.owner === "player" ? 0x2980b9 : 0xc0392b);

    const radius = occupant.type === "KING" ? 36 : 32;
    const circle = this.add.circle(x, y, radius, color);
    circle.setStrokeStyle(3, 0xffffff, 0.6);
    this.boardContainer.add(circle);

    let label = occupant.type === "KING" ? "👑" : occupant.name[0];
    const iconText = this.add.text(x, y - 6, label, {
      fontSize: occupant.type === "KING" ? "38px" : "28px",
      fontStyle: "bold", color: "#fff",
    }).setOrigin(0.5);
    this.boardContainer.add(iconText);

    const barWidth = radius * 1.8;
    const barY = y + radius + 10;

    const hpBg = this.add.rectangle(x, barY, barWidth, 8, 0x000000);
    this.boardContainer.add(hpBg);

    const hpRatio = Math.max(0, occupant.hp / occupant.maxHp);
    const hpColor = hpRatio > 0.5 ? 0x2ecc71 : hpRatio > 0.25 ? 0xf39c12 : 0xe74c3c;
    const hpBar = this.add.rectangle(
      x - barWidth / 2 + (barWidth * hpRatio) / 2,
      barY, barWidth * hpRatio, 8, hpColor
    );
    this.boardContainer.add(hpBar);

    const hpText = this.add.text(x, barY, `${occupant.hp}`, {
      fontSize: "12px", color: "#fff", fontStyle: "bold",
    }).setOrigin(0.5);
    this.boardContainer.add(hpText);

    if (animate) {
      [circle, iconText, hpBg, hpBar, hpText].forEach((obj) => obj.setScale(0));
      this.tweens.add({
        targets: [circle, iconText, hpBg, hpBar, hpText],
        scale: 1, duration: 300, ease: "Back.easeOut",
      });
    }
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
              if (tile && tile.overlay) tile.overlay.setFillStyle(0x2ecc71, 0.35);
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
                  tile.overlay.setFillStyle(0xe67e22, 0.4);
                } else if (card.targetType === "ALLY_UNIT" && occ.owner === "player" && occ.type === "UNIT") {
                  tile.overlay.setFillStyle(0x2ecc71, 0.5);
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
      if (selTile && selTile.overlay) selTile.overlay.setFillStyle(0xf0c040, 0.4);

      const attacker = this.gameState.board[sr][sc];
      if (!attacker) return;

      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const occ = this.gameState.board[r][c];
          const dist = Math.abs(sr - r) + Math.abs(sc - c);
          const tile = this.getTileAt(r, c);

          if (!occ && dist === 1) {
            if (tile && tile.overlay) tile.overlay.setFillStyle(0x3498db, 0.35);
          }
          if (occ && occ.owner === "enemy" && dist <= attacker.range && dist > 0) {
            if (tile && tile.overlay) tile.overlay.setFillStyle(0xe74c3c, 0.4);
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

  // ===================== HAND VISUAL =====================
  createHandVisual() {
    this.handContainer.removeAll(true);

    const cardW = 130;
    const cardH = 165;
    const cardGap = 15;

    const totalWidth = this.gameState.hand.length * (cardW + cardGap) - cardGap;
    const handY = this.BOARD_Y + 5 * this.TILE_SIZE + 4 * this.TILE_GAP + 130;
    const startX = this.CANVAS_W / 2 - totalWidth / 2;

    this.gameState.hand.forEach((cardKey, index) => {
      const card = CARDS[cardKey];
      const x = startX + index * (cardW + cardGap) + cardW / 2;
      const cardContainer = this.add.container(x, handY);

      const isSelected = this.gameState.selectedCard === index;
      const canAfford = card.cost <= this.gameState.playerAP;
      const isSpell = card.type === "SPELL";

      const bgColor = isSpell ? 0x2a1a3e : 0x16213e;
      const bg = this.add.rectangle(0, 0, cardW, cardH, bgColor);
      bg.setStrokeStyle(4, isSelected ? 0x2ecc71 : (isSpell ? 0xa855f7 : 0xf0c040));
      bg.setInteractive({ useHandCursor: true });

      const badgeColor = isSpell ? 0xa855f7 : 0x3498db;
      const badge = this.add.rectangle(0, -cardH / 2 + 16, 90, 22, badgeColor);
      const badgeText = this.add.text(0, -cardH / 2 + 16, isSpell ? "✦ SPELL" : "⚔ UNIT", {
        fontSize: "12px", color: "#fff", fontStyle: "bold",
      }).setOrigin(0.5);

      const nameText = this.add.text(0, -cardH / 2 + 42, card.name, {
        fontSize: "16px", color: "#f0c040", fontStyle: "bold",
      }).setOrigin(0.5);

      const iconText = this.add.text(0, -5, card.icon, {
        fontSize: "48px",
      }).setOrigin(0.5);

      const descText = this.add.text(0, 48, card.desc, {
        fontSize: "11px", color: "#ccc",
        wordWrap: { width: cardW - 15 },
        align: "center",
      }).setOrigin(0.5);

      const costText = this.add.text(0, cardH / 2 - 15, `Cost ${card.cost}`, {
        fontSize: "14px", color: canAfford ? "#2ecc71" : "#e74c3c",
        fontStyle: "bold",
      }).setOrigin(0.5);

      cardContainer.add([bg, badge, badgeText, nameText, iconText, descText, costText]);

      if (!canAfford) cardContainer.setAlpha(0.45);

      bg.on("pointerdown", () => this.onCardClick(index));
      bg.on("pointerover", () => {
        if (canAfford) cardContainer.setScale(1.08);
      });
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
        type: "UNIT",
        owner: "player",
        name: card.name,
        hp: card.hp,
        maxHp: card.hp,
        attack: card.attack,
        range: card.range,
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

    if (card.effect === "DAMAGE") this.showSpellNotification("🔥", "FIREBALL!", 0xe67e22);
    else if (card.effect === "HEAL") this.showSpellNotification("💚", "HEAL!", 0x2ecc71);
    else if (card.effect === "BUFF") this.showSpellNotification("💪", "RAGE!", 0xf39c12);

    const tile = this.getTileAt(row, col);
    if (tile) {
      this.tweens.add({ targets: tile, alpha: 0.3, yoyo: true, repeat: 2, duration: 100 });
    }

    if (card.effect === "DAMAGE") {
      target.hp -= card.value;
      this.showFloatingText(row, col, `-${card.value}`, "#e67e22");
    } else if (card.effect === "HEAL") {
      const healed = Math.min(card.value, target.maxHp - target.hp);
      target.hp += healed;
      this.showFloatingText(row, col, `+${healed}`, "#2ecc71");
    } else if (card.effect === "BUFF") {
      target.attack += card.value;
      this.showFloatingText(row, col, `+${card.value} ATK`, "#f39c12");
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
    this.showFloatingText(toRow, toCol, `-${attacker.attack}`, "#e74c3c");

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
      fontSize: "28px", color: color, fontStyle: "bold",
      stroke: "#000", strokeThickness: 4,
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
      this.showSpellNotification("💚", "ENEMY HEAL!", 0x2ecc71);
      const healed = Math.min(card.value, target.maxHp - target.hp);
      target.hp += healed;
      this.showFloatingText(row, col, `+${healed}`, "#2ecc71");
    } else if (card.effect === "BUFF") {
      this.showSpellNotification("💪", "ENEMY RAGE!", 0xf39c12);
      target.attack += card.value;
      this.showFloatingText(row, col, `+${card.value} ATK`, "#f39c12");
    } else if (card.effect === "DAMAGE") {
      this.showSpellNotification("🔥", "ENEMY FIREBALL!", 0xe67e22);
      target.hp -= card.value;
      this.showFloatingText(row, col, `-${card.value}`, "#e67e22");
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
      type: "UNIT",
      owner: "enemy",
      name: card.name,
      hp: card.hp,
      maxHp: card.hp,
      attack: card.attack,
      range: card.range,
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
    this.showFloatingText(toRow, toCol, `-${attacker.attack}`, "#e74c3c");

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
      this.showGameOver("🎉 YOU WIN! 🎉", "King musuh berhasil lu hancurin!");
    } else if (this.gameState.playerKingHP <= 0) {
      this.showGameOver("💀 YOU LOSE 💀", "King lu hancur. Coba lagi!");
    }
  }

  showGameOver(title, message) {
    this.gameState.isGameOver = true;
    this.setButtonEnabled(false);

    const cx = this.CANVAS_W / 2;
    const cy = this.CANVAS_H / 2;

    this.add.rectangle(cx, cy, this.CANVAS_W, this.CANVAS_H, 0x000000, 0.85);

    const box = this.add.rectangle(cx, cy, 520, 300, 0x16213e);
    box.setStrokeStyle(4, 0xf0c040);
    box.setScale(0);

    this.tweens.add({ targets: box, scale: 1, duration: 400, ease: "Back.easeOut" });

    this.add.text(cx, cy - 90, title, {
      fontSize: "38px", color: "#f0c040", fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(cx, cy, message, {
      fontSize: "18px", color: "#eee",
      wordWrap: { width: 460 }, align: "center",
    }).setOrigin(0.5);

    const btnAgain = this.add.rectangle(cx - 110, cy + 100, 180, 55, 0x2ecc71);
    btnAgain.setInteractive({ useHandCursor: true });
    this.add.text(cx - 110, cy + 100, "MAIN LAGI", {
      fontSize: "18px", color: "#fff", fontStyle: "bold",
    }).setOrigin(0.5);
    btnAgain.on("pointerdown", () => this.scene.start("GameScene"));
    btnAgain.on("pointerover", () => btnAgain.setFillStyle(0x27ae60));
    btnAgain.on("pointerout", () => btnAgain.setFillStyle(0x2ecc71));

    const btnMenu = this.add.rectangle(cx + 110, cy + 100, 180, 55, 0xf0c040);
    btnMenu.setInteractive({ useHandCursor: true });
    this.add.text(cx + 110, cy + 100, "MAIN MENU", {
      fontSize: "18px", color: "#1a1a2e", fontStyle: "bold",
    }).setOrigin(0.5);
    btnMenu.on("pointerdown", () => this.scene.start("MenuScene"));
    btnMenu.on("pointerover", () => btnMenu.setFillStyle(0xffd700));
    btnMenu.on("pointerout", () => btnMenu.setFillStyle(0xf0c040));
  }
}