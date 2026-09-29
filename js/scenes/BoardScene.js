class BoardScene extends Phaser.Scene {
  constructor() {
    super("BoardScene");
  }

  create() {
    console.log("BoardScene.create() dipanggil!");

    const canvasW = this.scale.width;
    this.GAP = 6;
    this.TILE = Math.floor((canvasW - 4 * this.GAP) / 5);

    this.boardContainer = this.add.container(0, 0);
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

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const x = col * (TILE + GAP) + TILE / 2;
        const y = row * (TILE + GAP) + TILE / 2;

        const tile = this.add.rectangle(x, y, TILE, TILE, 0x0f172a);
        tile.setStrokeStyle(1.5, 0x1e293b, 0.8);
        tile.setInteractive({ useHandCursor: true });

        const innerTile = this.add.rectangle(x, y, TILE - 8, TILE - 8, 0x000000, 0);
        innerTile.setStrokeStyle(1, 0x1e293b, 0.35);
        this.boardContainer.add(innerTile);

        tile.tileRow = row;
        tile.tileCol = col;

        tile.on("pointerover", () => {
          if (gameState.isAITurn || gameState.isGameOver || gameState.isAnimating) return;
          tile.setStrokeStyle(2.5, 0xfbbf24, 1);
          innerTile.setStrokeStyle(1, 0xfbbf24, 0.5);
        });
        tile.on("pointerout", () => {
          tile.setStrokeStyle(1.5, 0x1e293b, 0.8);
          innerTile.setStrokeStyle(1, 0x1e293b, 0.35);
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

        if (selectedIsUnit && row >= 3 && occupant === null) {
          overlay.setFillStyle(0x22c55e, 0.3);
        }

        if (selectedIsTrap && occupant === null) {
          overlay.setFillStyle(0x8b5cf6, 0.35);
        }

        if (selectedIsSpell && !selectedIsTrap && occupant) {
          const cardKey = gameState.hand[gameState.selectedCard];
          const card = CARDS[cardKey];
          if (card.targetType === "ANY_UNIT" && occupant.type !== "KING") {
            overlay.setFillStyle(0xf97316, 0.4);
          } else if (card.targetType === "ALLY_UNIT" && occupant.owner === "player" && occupant.type === "UNIT") {
            overlay.setFillStyle(0x22c55e, 0.5);
          }
        }

        if (selectedUnitPos) {
          if (selectedUnitPos.row === row && selectedUnitPos.col === col) {
            overlay.setFillStyle(0xfbbf24, 0.5);
          } else if (!occupant && dist === 1) {
            overlay.setFillStyle(0x38bdf8, 0.35);
          } else if (occupant && occupant.owner === "enemy" && dist <= attackerRange && dist > 0) {
            overlay.setFillStyle(0xef4444, 0.45);
          } else if (dist <= attackerRange && dist > 0) {
            overlay.setFillStyle(0xef4444, 0.12);
          }
        }

        // ===== TRAP — dengan pulse =====
        if (gameState.traps && gameState.traps.some((t) => t.row === row && t.col === col)) {
          const trapGlow = this.add.circle(x, y, 22, 0x8b5cf6, 0.15);
          const trapIcon = this.add.text(x, y, "🪤", {
            fontSize: "30px",
          }).setOrigin(0.5).setAlpha(0.6);

          // Trap pulse
          this.tweens.add({
            targets: trapGlow,
            alpha: { from: 0.1, to: 0.35 },
            scale: { from: 0.9, to: 1.15 },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
          this.tweens.add({
            targets: trapIcon,
            alpha: { from: 0.5, to: 0.9 },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });

          this.boardContainer.add(trapGlow);
          this.boardContainer.add(trapIcon);
        }

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
    const animTargets = [];  // objek yang bakal di-animate

    let fillColor, strokeColor, glowColor;
    if (occupant.type === "KING") {
      fillColor = occupant.owner === "player" ? 0x3b82f6 : 0xdc2626;
      strokeColor = occupant.owner === "player" ? 0x93c5fd : 0xfca5a5;
      glowColor = occupant.owner === "player" ? 0x60a5fa : 0xf87171;
    } else {
      fillColor = occupant.owner === "player" ? 0x2563eb : 0xb91c1c;
      strokeColor = occupant.owner === "player" ? 0x60a5fa : 0xef4444;
      glowColor = fillColor;
    }

    const radius = occupant.type === "KING" ? TILE * 0.36 : TILE * 0.33;
    const isKing = occupant.type === "KING";

    // ===== OUTER GLOW =====
    const glow = this.add.circle(x, y, radius + 6, glowColor, 0.2);
    allObjs.push(glow);
    animTargets.push(glow);

    // ===== SHADOW =====
    const shadow = this.add.ellipse(x, y + radius * 0.7, radius * 1.9, radius * 0.5, 0x000000, 0.35);
    allObjs.push(shadow);

    // ===== MAIN CIRCLE =====
    const circle = this.add.circle(x, y, radius, fillColor);
    circle.setStrokeStyle(3, strokeColor, 1);
    allObjs.push(circle);
    animTargets.push(circle);

    // ===== INNER HIGHLIGHT =====
    const inner = this.add.circle(x, y - radius * 0.3, radius * 0.65, 0xffffff, 0.12);
    allObjs.push(inner);
    animTargets.push(inner);

    // ===== ICON =====
    let icon = "?";
    if (occupant.type === "KING") {
      icon = "👑";
    } else {
      const nameLower = occupant.name.toLowerCase();
      if (nameLower.includes("knight")) icon = "⚔️";
      else if (nameLower.includes("archer")) icon = "🏹";
      else if (nameLower.includes("guardian")) icon = "🛡️";
      else if (nameLower.includes("wizard") || nameLower.includes("mage")) icon = "🧙";
      else if (nameLower.includes("priest") || nameLower.includes("healer")) icon = "✨";
      else icon = occupant.name[0];
    }

    const iconText = this.add.text(x, y - 2, icon, {
      fontSize: isKing ? "32px" : "28px",
    }).setOrigin(0.5);
    allObjs.push(iconText);
    animTargets.push(iconText);

    // ===== HP BAR =====
    const barW = radius * 2;
    const barH = 7;
    const barY = y + radius + 8;

    const hpBg = this.add.rectangle(x, barY, barW + 2, barH + 2, 0x000000, 0.9);
    hpBg.setStrokeStyle(1.5, 0x1e293b, 1);
    allObjs.push(hpBg);

    const hpRatio = Math.max(0, occupant.hp / occupant.maxHp);
    const hpColor = hpRatio > 0.5 ? 0x22c55e : hpRatio > 0.25 ? 0xf59e0b : 0xef4444;
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

    // ===== RANGE BADGE =====
    if (occupant.type === "UNIT") {
      const badgeX = x - radius * 0.85;
      const badgeY = y - radius * 0.85;
      const rangeBadge = this.add.circle(badgeX, badgeY, 11, 0x0f172a);
      rangeBadge.setStrokeStyle(2, 0xfbbf24, 1);
      const rangeText = this.add.text(badgeX, badgeY, `${occupant.range}`, {
        fontSize: "11px",
        color: "#fbbf24",
        fontStyle: "bold",
      }).setOrigin(0.5);
      allObjs.push(rangeBadge, rangeText);
    }

    // ===== SPAWN ANIMATION (kalau animate) =====
    if (animate) {
      allObjs.forEach((obj) => obj.setScale(0));
      this.tweens.add({
        targets: allObjs,
        scale: 1,
        duration: 300,
        ease: "Back.easeOut",
      });
    }

    // ===== IDLE PULSE ANIMATION =====
    // Delay random biar gak serempak
    const delay = Phaser.Math.Between(0, 800);

    // Glow pulse — alpha naik turun
    const pulseMax = isKing ? 0.35 : 0.28;
    const pulseMin = isKing ? 0.15 : 0.12;

    this.tweens.add({
      targets: glow,
      alpha: { from: pulseMin, to: pulseMax },
      duration: isKing ? 1400 : 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: delay,
    });

    // Circle subtle pulse — scale 1 ↔ 1.03
    this.tweens.add({
      targets: circle,
      scale: { from: 1, to: isKing ? 1.05 : 1.03 },
      duration: isKing ? 1500 : 1700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: delay,
    });

    // Icon subtle bounce — naik-turun posisi Y
    this.tweens.add({
      targets: iconText,
      y: { from: iconText.y, to: iconText.y - (isKing ? 3 : 2) },
      duration: isKing ? 1500 : 1700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: delay,
    });

    // Inner highlight pulse
    this.tweens.add({
      targets: inner,
      alpha: { from: 0.08, to: 0.18 },
      duration: 1800,
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
      fontFamily: "'Orbitron', sans-serif",
      fontSize: "22px",
      color: color,
      fontStyle: "900",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: txt,
      scale: 1.4,
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