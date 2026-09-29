class BoardScene extends Phaser.Scene {
  constructor() {
    super("BoardScene");
  }

  create() {
    console.log("BoardScene.create() dipanggil!");

    const canvasW = this.scale.width;
    const canvasH = this.scale.height;

    const PADDING = 10;

    this.GAP = 5;
    const tileByW = Math.floor((canvasW - PADDING * 2 - (BOARD_SIZE - 1) * this.GAP) / BOARD_SIZE);
    const tileByH = Math.floor((canvasH - PADDING * 2 - (BOARD_SIZE - 1) * this.GAP) / BOARD_SIZE);
    this.TILE = Math.min(tileByW, tileByH);

    this.OFFSET_X = PADDING;
    this.OFFSET_Y = PADDING;

    console.log("BoardScene: canvas", canvasW, "x", canvasH, "TILE", this.TILE);

    this.boardContainer = this.add.container(this.OFFSET_X, this.OFFSET_Y);
    window.boardScene = this;

    if (!gameState.board || gameState.board.length === 0) {
      console.warn("gameState.board kosong, init dulu...");
      initGameState();
    }

    this.renderBoard();
  }

  renderBoard() {
    this.boardContainer.removeAll(true);

    const TILE = this.TILE;
    const GAP = this.GAP;

    let selectedIsUnit = false;
    let selectedIsSpell = false;
    let selectedIsTrap = false;
    let selectedUnitPos = null;
    let attackerRange = 1;

    if (gameState.selectedCard !== null) {
      const cardKey = gameState.hand[gameState.selectedCard];
      const card = CARDS[cardKey];
      if (card) {
        if (card.type === "UNIT") selectedIsUnit = true;
        if (card.type === "SPELL") selectedIsSpell = true;
        if (card.effect === "TRAP") selectedIsTrap = true;
      }
    } else if (gameState.selectedUnit) {
      selectedUnitPos = gameState.selectedUnit;
      const attacker = gameState.board[selectedUnitPos.row][selectedUnitPos.col];
      if (attacker) attackerRange = attacker.range;
    }

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const x = col * (TILE + GAP) + TILE / 2;
        const y = row * (TILE + GAP) + TILE / 2;

        const tile = this.add.rectangle(x, y, TILE, TILE, 0x1a2238);
        tile.setStrokeStyle(1, 0x2d3548, 1);
        tile.setInteractive({ useHandCursor: true });

        tile.tileRow = row;
        tile.tileCol = col;

        tile.on("pointerover", () => {
          if (gameState.isAITurn || gameState.isGameOver || gameState.isAnimating) return;
          if (!tile._stateColor) tile.setStrokeStyle(2, 0xf4c869, 1);
        });
        tile.on("pointerout", () => {
          if (!tile._stateColor) tile.setStrokeStyle(1, 0x2d3548, 1);
        });
        tile.on("pointerdown", () => this.onTileClick(row, col));

        this.boardContainer.add(tile);

        const overlay = this.add.rectangle(x, y, TILE, TILE, 0xffffff, 0);
        overlay.tileRow = row;
        overlay.tileCol = col;
        this.boardContainer.add(overlay);
        tile.overlay = overlay;

        const occupant = gameState.board[row][col];
        const dist = selectedUnitPos
          ? Math.abs(selectedUnitPos.row - row) + Math.abs(selectedUnitPos.col - col)
          : 99;

        let borderColor = 0x2d3548;
        let borderWidth = 1;
        let hasState = false;

        // Summon area
        if (selectedIsUnit && row >= 4 && occupant === null) {
          overlay.setFillStyle(0x00d2ff, 0.15);
          borderColor = 0x00d2ff;
          borderWidth = 2;
          hasState = true;
        }

        // Trap area
        if (selectedIsTrap && occupant === null) {
          overlay.setFillStyle(0x8b5cf6, 0.15);
          borderColor = 0x8b5cf6;
          borderWidth = 2;
          hasState = true;
        }

        // Spell target
        if (selectedIsSpell && !selectedIsTrap) {
          const cardKey = gameState.hand[gameState.selectedCard];
          const card = CARDS[cardKey];
          if (card) {
            // Row Damage — highlight seluruh baris
            if (card.targetType === "ANY_ROW") {
              overlay.setFillStyle(0xfbbf24, 0.15);
              borderColor = 0xfbbf24;
              borderWidth = 2;
              hasState = true;
            }
            // Target unit tunggal
            else if (card.targetType === "ANY_UNIT" && occupant && occupant.type !== "KING") {
              overlay.setFillStyle(0xff3232, 0.2);
              borderColor = 0xff3232;
              borderWidth = 2;
              hasState = true;
            } else if (card.targetType === "ALLY_UNIT" && occupant && occupant.owner === "player" && occupant.type === "UNIT") {
              overlay.setFillStyle(0x5db85d, 0.2);
              borderColor = 0x5db85d;
              borderWidth = 2;
              hasState = true;
            }
          }
        }

        // Unit select
        if (selectedUnitPos) {
          if (selectedUnitPos.row === row && selectedUnitPos.col === col) {
            overlay.setFillStyle(0xf4c869, 0.25);
            borderColor = 0xf4c869;
            borderWidth = 2.5;
            hasState = true;
          } else if (!occupant && dist === 1) {
            overlay.setFillStyle(0x0096ff, 0.12);
            borderColor = 0x0096ff;
            borderWidth = 2;
            hasState = true;
          } else if (occupant && occupant.owner === "enemy" && dist <= attackerRange && dist > 0) {
            overlay.setFillStyle(0xff3232, 0.2);
            borderColor = 0xff3232;
            borderWidth = 2;
            hasState = true;
          } else if (dist <= attackerRange && dist > 0) {
            overlay.setFillStyle(0xff3232, 0.05);
            borderColor = 0x5a1a1a;
            borderWidth = 1.5;
            hasState = true;
          }
        }

        tile._stateColor = hasState ? borderColor : null;
        tile.setStrokeStyle(borderWidth, borderColor, 1);

        // Trap TIDAK di-render (invisible)

        if (occupant) this.renderOccupant(row, col, occupant);
      }
    }
  }

  renderOccupant(row, col, occupant, animate = false) {
    const TILE = this.TILE;
    const GAP = this.GAP;
    const x = col * (TILE + GAP) + TILE / 2;
    const y = row * (TILE + GAP) + TILE / 2;

    const allObjs = [];

    let fillColor, strokeColor, glowColor;
    if (occupant.type === "KING") {
      fillColor = occupant.owner === "player" ? 0x3b82f6 : 0xdc2626;
      strokeColor = occupant.owner === "player" ? 0x93c5fd : 0xfca5a5;
      glowColor = occupant.owner === "player" ? 0x3b82f6 : 0xdc2626;
    } else {
      fillColor = occupant.owner === "player" ? 0x2563eb : 0xb91c1c;
      strokeColor = occupant.owner === "player" ? 0x58a6ff : 0xef4444;
      glowColor = occupant.owner === "player" ? 0x2563eb : 0xb91c1c;
    }

    const radius = occupant.type === "KING" ? TILE * 0.42 : TILE * 0.38;
    const isKing = occupant.type === "KING";

    const glow = this.add.circle(x, y, radius + 4, glowColor, 0.25);
    allObjs.push(glow);

    const shadow = this.add.ellipse(x, y + radius * 0.75, radius * 1.7, radius * 0.4, 0x000000, 0.4);
    allObjs.push(shadow);

    const circle = this.add.circle(x, y, radius, fillColor);
    circle.setStrokeStyle(isKing ? 3 : 2.5, strokeColor, 1);
    allObjs.push(circle);

    const inner = this.add.circle(x, y - radius * 0.3, radius * 0.6, 0xffffff, 0.15);
    allObjs.push(inner);

    let icon = "?";
    if (occupant.type === "KING") {
      icon = "👑";
    } else {
      const nameLower = occupant.name.toLowerCase();
      if (nameLower.includes("knight")) icon = "⚔️";
      else if (nameLower.includes("archer")) icon = "🏹";
      else if (nameLower.includes("guardian")) icon = "🛡️";
      else if (nameLower.includes("assassin")) icon = "🗡️";
      else if (nameLower.includes("wizard") || nameLower.includes("mage")) icon = "🧙";
      else if (nameLower.includes("priest") || nameLower.includes("healer")) icon = "✨";
      else icon = occupant.name[0];
    }

    const iconText = this.add.text(x, y - 2, icon, {
      fontSize: isKing ? `${Math.floor(TILE * 0.42)}px` : `${Math.floor(TILE * 0.38)}px`,
    }).setOrigin(0.5);
    allObjs.push(iconText);

    const barW = radius * 1.9;
    const barH = 6;
    const barY = y + radius + 5;

    const hpBg = this.add.rectangle(x, barY, barW + 2, barH + 2, 0x000000, 0.85);
    hpBg.setStrokeStyle(1, 0x000000, 1);
    allObjs.push(hpBg);

    const hpRatio = Math.max(0, occupant.hp / occupant.maxHp);
    const hpColor = hpRatio > 0.5 ? 0x5db85d : hpRatio > 0.25 ? 0xd4a24a : 0xc93d3d;
    const hpBar = this.add.rectangle(
      x - barW / 2 + (barW * hpRatio) / 2,
      barY,
      barW * hpRatio,
      barH,
      hpColor
    );
    allObjs.push(hpBar);

    const hpText = this.add.text(x, barY, `${occupant.hp}`, {
      fontSize: "10px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5);
    allObjs.push(hpText);

    if (occupant.type === "UNIT") {
      const badgeX = x - radius * 0.85;
      const badgeY = y - radius * 0.85;
      const badgeRadius = 11;

      const rangeBadge = this.add.circle(badgeX, badgeY, badgeRadius, 0x0a0d1a, 0.95);
      rangeBadge.setStrokeStyle(2, 0xd4a24a, 1);

      const rangeText = this.add.text(badgeX, badgeY, `${occupant.range}`, {
        fontSize: "12px",
        color: "#f4c869",
        fontStyle: "bold",
        fontFamily: "'Cinzel', serif",
      }).setOrigin(0.5);

      allObjs.push(rangeBadge, rangeText);
    }

    if (animate) {
      allObjs.forEach((obj) => obj.setScale(0));
      this.tweens.add({
        targets: allObjs,
        scale: 1,
        duration: 300,
        ease: "Back.easeOut",
      });
    }

    const delay = Phaser.Math.Between(0, 800);
    const pulseMax = isKing ? 0.35 : 0.28;
    const pulseMin = isKing ? 0.18 : 0.15;

    this.tweens.add({
      targets: glow,
      alpha: { from: pulseMin, to: pulseMax },
      duration: isKing ? 1600 : 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: delay,
    });

    this.tweens.add({
      targets: circle,
      scale: { from: 1, to: isKing ? 1.04 : 1.02 },
      duration: isKing ? 1800 : 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: delay,
    });

    this.tweens.add({
      targets: inner,
      alpha: { from: 0.1, to: 0.2 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: delay,
    });

    allObjs.forEach((obj) => this.boardContainer.add(obj));
  }

  onTileClick(row, col) {
    if (gameState.isAITurn || gameState.isGameOver || gameState.isAnimating) return;
    if (window.onBoardTileClick) window.onBoardTileClick(row, col);
  }

  refresh() {
    this.renderBoard();
  }

  showFloatingText(row, col, text, color) {
    const TILE = this.TILE;
    const GAP = this.GAP;
    const x = col * (TILE + GAP) + TILE / 2;
    const y = row * (TILE + GAP) + TILE / 2;

    const txt = this.add.text(x, y, text, {
      fontFamily: "'Cinzel', serif",
      fontSize: "22px",
      color: color,
      fontStyle: "900",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: txt,
      scale: 1.3,
      duration: 150,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: txt,
          y: y - 45,
          alpha: 0,
          scale: 1,
          duration: 700,
          onComplete: () => txt.destroy(),
        });
      },
    });
  }

  animateSpawn(row, col) {
    const TILE = this.TILE;
    const GAP = this.GAP;
    const x = col * (TILE + GAP) + TILE / 2;
    const y = row * (TILE + GAP) + TILE / 2;

    const nearby = this.boardContainer.list.filter((obj) => {
      if (obj.x === undefined || obj.y === undefined) return false;
      return Math.abs(obj.x - x) < 40 && Math.abs(obj.y - y) < 45;
    });

    nearby.forEach((obj) => {
      obj.setScale(0.3);
      this.tweens.add({
        targets: obj,
        scale: 1,
        duration: 300,
        ease: "Back.easeOut",
      });
    });
  }
}