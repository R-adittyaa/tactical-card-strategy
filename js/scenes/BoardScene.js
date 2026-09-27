class BoardScene extends Phaser.Scene {
  constructor() {
    super("BoardScene");
  }

  create() {
    console.log("BoardScene.create() dipanggil!");

    this.TILE = 80;
    this.GAP = 6;
    this.BOARD_SIZE = 5 * this.TILE + 4 * this.GAP;

    this.boardContainer = this.add.container(0, 0);
    window.boardScene = this;

    if (!gameState.board || gameState.board.length === 0) {
      console.warn("gameState.board kosong, init dulu...");
      initGameState();
    }

    this.renderBoard();
  }

  // ===== RENDER BOARD =====
  renderBoard() {
    this.boardContainer.removeAll(true);

    const TILE = this.TILE;
    const GAP = this.GAP;

    // Cek mode selection
    let selectedIsUnit = false;   // kartu UNIT di hand ke-select
    let selectedIsSpell = false;  // kartu SPELL di hand ke-select
    let selectedUnitPos = null;   // unit di board ke-select {row, col}
    let attackerRange = 1;

    if (gameState.selectedCard !== null) {
      const cardKey = gameState.hand[gameState.selectedCard];
      const card = CARDS[cardKey];
      if (card) {
        if (card.type === "UNIT") selectedIsUnit = true;
        if (card.type === "SPELL") selectedIsSpell = true;
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

        // === TILE BACKGROUND ===
        const tile = this.add.rectangle(x, y, TILE, TILE, 0x0f172a);
        tile.setStrokeStyle(1, 0x1e293b);
        tile.setInteractive({ useHandCursor: true });

        tile.tileRow = row;
        tile.tileCol = col;

        tile.on("pointerover", () => {
          if (gameState.isAITurn || gameState.isGameOver || gameState.isAnimating) return;
          tile.setStrokeStyle(2, 0xfbbf24, 0.8);
        });
        tile.on("pointerout", () => tile.setStrokeStyle(1, 0x1e293b));
        tile.on("pointerdown", () => this.onTileClick(row, col));

        this.boardContainer.add(tile);

        // === HIGHLIGHT OVERLAY ===
        const overlay = this.add.rectangle(x, y, TILE, TILE, 0xffffff, 0);
        overlay.tileRow = row;
        overlay.tileCol = col;
        this.boardContainer.add(overlay);
        tile.overlay = overlay;

        const occupant = gameState.board[row][col];
        const dist = selectedUnitPos
          ? Math.abs(selectedUnitPos.row - row) + Math.abs(selectedUnitPos.col - col)
          : 99;

        // ===== MODE 1: KARTU UNIT KE-SELECT → HIGHLIGHT SUMMON AREA =====
        if (selectedIsUnit && row >= 3 && occupant === null) {
          overlay.setFillStyle(0x22c55e, 0.3);
        }

        // ===== MODE 2: KARTU SPELL KE-SELECT → HIGHLIGHT TARGET =====
        if (selectedIsSpell && occupant) {
          const cardKey = gameState.hand[gameState.selectedCard];
          const card = CARDS[cardKey];
          if (card.targetType === "ANY_UNIT" && occupant.type !== "KING") {
            overlay.setFillStyle(0xf97316, 0.4);
          } else if (card.targetType === "ALLY_UNIT" && occupant.owner === "player" && occupant.type === "UNIT") {
            overlay.setFillStyle(0x22c55e, 0.5);
          }
        }

        // ===== MODE 3: UNIT KE-SELECT =====
        if (selectedUnitPos) {
          // Highlight unit yang dipilih
          if (selectedUnitPos.row === row && selectedUnitPos.col === col) {
            overlay.setFillStyle(0xfbbf24, 0.5);
          }
          // Highlight gerak (biru) — tile kosong distance 1
          else if (!occupant && dist === 1) {
            overlay.setFillStyle(0x38bdf8, 0.35);
          }
          // Highlight attack range (merah) — enemy dalam range
          else if (occupant && occupant.owner === "enemy" && dist <= attackerRange && dist > 0) {
            overlay.setFillStyle(0xef4444, 0.45);
          }
          // Highlight range kosong (outline merah pudar) — semua tile dalam range attack
          else if (dist <= attackerRange && dist > 0) {
            overlay.setFillStyle(0xef4444, 0.12);
          }
        }

        // === RENDER OCCUPANT ===
        if (occupant) this.renderOccupant(row, col, occupant);
      }
    }
  }

  // ===== RENDER UNIT =====
  renderOccupant(row, col, occupant, animate = false) {
    const TILE = this.TILE;
    const GAP = this.GAP;
    const x = col * (TILE + GAP) + TILE / 2;
    const y = row * (TILE + GAP) + TILE / 2;

    const color = occupant.type === "KING"
      ? (occupant.owner === "player" ? 0x38bdf8 : 0xef4444)
      : (occupant.owner === "player" ? 0x38bdf8 : 0xdc2626);

    const radius = occupant.type === "KING" ? TILE * 0.35 : TILE * 0.32;

    const glow = this.add.circle(x, y, radius + 4, color, 0.2);
    const circle = this.add.circle(x, y, radius, color);
    circle.setStrokeStyle(2, 0xffffff, 0.5);

    const label = occupant.type === "KING" ? "👑" : occupant.name[0];
    const iconText = this.add.text(x, y - 4, label, {
      fontSize: occupant.type === "KING" ? "32px" : "24px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);

    const barW = radius * 2;
    const barH = 6;
    const barY = y + radius + 7;

    const hpBg = this.add.rectangle(x, barY, barW, barH, 0x000000, 0.75);

    const hpRatio = Math.max(0, occupant.hp / occupant.maxHp);
    const hpColor = hpRatio > 0.5 ? 0x22c55e : hpRatio > 0.25 ? 0xf97316 : 0xef4444;
    const hpBar = this.add.rectangle(
      x - barW / 2 + (barW * hpRatio) / 2,
      barY,
      barW * hpRatio,
      barH,
      hpColor
    );

    const hpText = this.add.text(x, barY, `${occupant.hp}`, {
      fontSize: "10px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // === RANGE BADGE (buat unit non-King) ===
    let rangeBadge = null;
    if (occupant.type === "UNIT") {
      const badgeX = x + radius * 0.9;
      const badgeY = y - radius * 0.9;
      rangeBadge = this.add.circle(badgeX, badgeY, 9, 0x0f172a);
      rangeBadge.setStrokeStyle(1.5, 0xfbbf24);
      const rangeText = this.add.text(badgeX, badgeY, `${occupant.range}`, {
        fontSize: "10px",
        color: "#fbbf24",
        fontStyle: "bold",
      }).setOrigin(0.5);
      this.boardContainer.add(rangeBadge);
      this.boardContainer.add(rangeText);
    }

    const allObjs = [glow, circle, iconText, hpBg, hpBar, hpText];

    if (animate) {
      allObjs.forEach((obj) => obj.setScale(0));
      this.tweens.add({
        targets: allObjs,
        scale: 1,
        duration: 300,
        ease: "Back.easeOut",
      });
    }

    allObjs.forEach((obj) => this.boardContainer.add(obj));
  }

  // ===== KLIK TILE =====
  onTileClick(row, col) {
    if (gameState.isAITurn || gameState.isGameOver || gameState.isAnimating) return;
    if (window.onBoardTileClick) window.onBoardTileClick(row, col);
  }

  // ===== PUBLIC =====
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