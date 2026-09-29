// ===== SAFETY: AUTO-RESET isAnimating kalau nyangkut =====
let _animSafetyTimer = null;
function _startAnimSafety() {
  if (_animSafetyTimer) clearTimeout(_animSafetyTimer);
  _animSafetyTimer = setTimeout(() => {
    if (gameState.isAnimating) {
      console.warn("⚠️ isAnimating nyangkut, auto-reset!");
      gameState.isAnimating = false;
      renderHandUI();
      updateHintUI();
      if (window.boardScene) window.boardScene.refresh();
    }
    if (gameState.isAITurn) {
      console.warn("⚠️ isAITurn nyangkut, auto-reset!");
      gameState.isAITurn = false;
      document.getElementById("btn-end-turn").disabled = false;
      renderHandUI();
      updateHintUI();
      if (window.boardScene) window.boardScene.refresh();
    }
  }, 6000);
}

// ===== MATCH TIMER =====
let _matchTimerInterval = null;
let _matchStartTime = null;

function _startMatchTimer() {
  if (_matchTimerInterval) clearInterval(_matchTimerInterval);
  _matchStartTime = Date.now();
  _matchTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - _matchStartTime) / 1000);
    const min = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const sec = String(elapsed % 60).padStart(2, "0");
    const el = document.getElementById("stat-timer");
    if (el) el.textContent = `${min}:${sec}`;
  }, 1000);
}

function _stopMatchTimer() {
  if (_matchTimerInterval) {
    clearInterval(_matchTimerInterval);
    _matchTimerInterval = null;
  }
}

function _updatePhaseIndicator() {
  const el = document.getElementById("stat-phase");
  if (!el) return;
  if (gameState.isGameOver) {
    el.textContent = "GAME OVER";
    el.style.color = "var(--text-dim)";
  } else if (gameState.isAITurn) {
    el.textContent = "ENEMY TURN";
    el.style.color = "var(--hp-red)";
  } else {
    el.textContent = "YOUR TURN";
    el.style.color = "var(--hp-green)";
  }
}

// ===== INIT GAME UI =====
function initGameUI() {
  initGameState();

  if (window.boardScene) {
    window.boardScene.refresh();
  } else {
    setTimeout(() => {
      if (window.boardScene) window.boardScene.refresh();
    }, 100);
  }

  updateTopBarUI();
  renderHandUI();
  updateHintUI();

  const endBtn = document.getElementById("btn-end-turn");
  endBtn.disabled = false;
  endBtn.onclick = () => onEndTurnClick();

  document.getElementById("btn-info").onclick = () => {
    document.getElementById("info-panel").classList.toggle("hidden");
    updateInfoPanelUI();
    playClickSound();
  };

  const menuBtn = document.getElementById("btn-menu");
  if (menuBtn) {
    menuBtn.onclick = () => {
      if (confirm("Kembali ke menu utama?")) {
        _stopMatchTimer();
        backToMenu();
      }
    };
  }

  _startMatchTimer();
  _updatePhaseIndicator();
}

// ===== TOP BAR =====
function updateTopBarUI() {
  document.getElementById("stat-turn").textContent = gameState.turn;
  const apEl = document.getElementById("stat-ap");
  if (apEl) apEl.textContent = gameState.playerAP;
  const pEl = document.getElementById("stat-player-hp");
  if (pEl) pEl.textContent = gameState.playerKingHP;
  const eEl = document.getElementById("stat-enemy-hp");
  if (eEl) eEl.textContent = gameState.enemyKingHP;
}

// ===== HAND =====
function renderHandUI() {
  const hand = document.getElementById("hand");
  hand.innerHTML = "";

  gameState.hand.forEach((cardKey, index) => {
    const card = CARDS[cardKey];
    const isSelected = gameState.selectedCard === index;
    const canAfford = card.cost <= gameState.playerAP;
    const isSpell = card.type === "SPELL";

    const el = document.createElement("div");
    el.className = "game-card";
    if (isSpell) el.classList.add("spell");
    if (isSelected) el.classList.add("selected");
    if (!canAfford) el.classList.add("disabled");

    const badgeText = card.effect === "TRAP" ? "🪤 TRAP" : (isSpell ? "✦ SPELL" : "⚔ UNIT");

    el.innerHTML = `
      <div class="card-badge">${badgeText}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-icon">${card.icon}</div>
      <div class="card-desc">${card.desc}</div>
      <div class="card-cost">◆ ${card.cost}</div>
    `;

    el.onclick = () => onCardClick(index);
    hand.appendChild(el);
  });
}

// ===== KLIK KARTU =====
function onCardClick(index) {
  if (gameState.isAITurn || gameState.isGameOver || gameState.isAnimating) return;
  playClickSound();

  if (gameState.selectedCard === index) {
    gameState.selectedCard = null;
  } else {
    gameState.selectedCard = index;
    gameState.selectedUnit = null;
  }

  renderHandUI();
  updateHintUI();
  if (window.boardScene) window.boardScene.refresh();
}

// ===== KLIK TILE =====
window.onBoardTileClick = function (row, col) {
  if (gameState.isAITurn || gameState.isGameOver || gameState.isAnimating) return;

  const occupant = gameState.board[row][col];

  if (gameState.selectedCard !== null) {
    handleCardPlay(row, col);
    return;
  }

  if (gameState.selectedUnit) {
    handleUnitAction(row, col);
    return;
  }

  if (occupant && occupant.owner === "player" && occupant.type === "UNIT") {
    playClickSound();
    gameState.selectedUnit = { row, col };
    renderHandUI();
    updateHintUI();
    if (window.boardScene) window.boardScene.refresh();
  }
};

// ===== HANDLE CARD PLAY =====
function handleCardPlay(row, col) {
  const cardKey = gameState.hand[gameState.selectedCard];
  const card = CARDS[cardKey];

  if (card.cost > gameState.playerAP) {
    playClickSound();
    return;
  }

  if (card.type === "UNIT") {
    if (row < 4 || gameState.board[row][col] !== null) {      playClickSound();
      return;
    }

    gameState.board[row][col] = {
      type: "UNIT",
      owner: "player",
      name: card.name,
      hp: card.hp,
      maxHp: card.hp,
      attack: card.attack,
      range: card.range,
    };

    gameState.hand.splice(gameState.selectedCard, 1);
    gameState.discard.push(cardKey);
    gameState.playerAP -= card.cost;
    gameState.selectedCard = null;

    playClickSound();

    updateTopBarUI();
    renderHandUI();
    updateHintUI();
    updateInfoPanelUI();
    if (window.boardScene) {
      window.boardScene.refresh();
      window.boardScene.animateSpawn(row, col);
    }
    return;
  }

  if (card.type === "SPELL") {
    if (card.effect === "TRAP") {
      handleTrapPlay(row, col, card, cardKey);
      return;
    }
    handleSpellPlay(row, col, card, cardKey);
    return;
  }
}

// ===== TRAP =====
function handleTrapPlay(row, col, card, cardKey) {
  if (gameState.board[row][col] !== null) { playClickSound(); return; }
  if (gameState.traps && gameState.traps.some((t) => t.row === row && t.col === col)) { playClickSound(); return; }
  if (!gameState.traps) gameState.traps = [];

  gameState.traps.push({ row, col, owner: "player", damage: card.value });
  gameState.hand.splice(gameState.selectedCard, 1);
  gameState.discard.push(cardKey);
  gameState.playerAP -= card.cost;
  gameState.selectedCard = null;

  playSpellSound();
  showSpellNotification("🪤", "TRAP SET!", "#8b5cf6");
  if (window.boardScene) window.boardScene.showFloatingText(row, col, "🪤", "#8b5cf6");

  updateTopBarUI();
  renderHandUI();
  updateHintUI();
  updateInfoPanelUI();
  if (window.boardScene) window.boardScene.refresh();
}

function checkTrapAt(row, col, mover) {
  if (!gameState.traps) return;
  const idx = gameState.traps.findIndex((t) => t.row === row && t.col === col && t.owner !== mover.owner);
  if (idx === -1) return;

  const trap = gameState.traps[idx];
  const victim = gameState.board[row][col];
  if (!victim) return;

  victim.hp -= trap.damage;
  playSpellSound();

  if (mover.owner === "enemy") showSpellNotification("🪤", "TRAP! -" + trap.damage, "#ef4444");
  else showSpellNotification("🪤", "KAMU KENA TRAP! -" + trap.damage, "#ef4444");

  if (window.boardScene) window.boardScene.showFloatingText(row, col, `-${trap.damage}`, "#ef4444");

  gameState.traps.splice(idx, 1);

  if (victim.hp <= 0 && victim.type !== "KING") {
    gameState.board[row][col] = null;
    playDeathSound();
  } else if (victim.type === "KING") {
    if (victim.owner === "player") gameState.playerKingHP = victim.hp;
    else gameState.enemyKingHP = victim.hp;
  }

  updateTopBarUI();
  checkWinLoss();
  return true;
}

// ===== SPELL =====
function handleSpellPlay(row, col, card, cardKey) {
  const target = gameState.board[row][col];
  if (!target) return;

  if (card.targetType === "ANY_UNIT" && target.type === "KING") return;
  if (card.targetType === "ALLY_UNIT" && (target.owner !== "player" || target.type !== "UNIT")) return;

  gameState.isAnimating = true;
  _startAnimSafety();
  playSpellSound();

  if (card.effect === "DAMAGE") {
    showSpellNotification("🔥", "FIREBALL!", "#f97316");
    target.hp -= card.value;
    if (window.boardScene) window.boardScene.showFloatingText(row, col, `-${card.value}`, "#f97316");
  } else if (card.effect === "HEAL") {
    showSpellNotification("💚", "HEAL!", "#22c55e");
    const healed = Math.min(card.value, target.maxHp - target.hp);
    target.hp += healed;
    if (window.boardScene) window.boardScene.showFloatingText(row, col, `+${healed}`, "#22c55e");
  } else if (card.effect === "BUFF") {
    showSpellNotification("💪", "RAGE!", "#fbbf24");
    target.attack += card.value;
    if (window.boardScene) window.boardScene.showFloatingText(row, col, `+${card.value} ATK`, "#fbbf24");
  }

  gameState.playerAP -= card.cost;
  gameState.hand.splice(gameState.selectedCard, 1);
  gameState.discard.push(cardKey);
  gameState.selectedCard = null;

  if (target.hp <= 0 && target.type !== "KING") {
    gameState.board[row][col] = null;
    playDeathSound();
  }

  setTimeout(() => {
    gameState.isAnimating = false;
    updateTopBarUI();
    renderHandUI();
    updateHintUI();
    updateInfoPanelUI();
    if (window.boardScene) window.boardScene.refresh();
    checkWinLoss();
  }, 400);
}

// ===== HANDLE UNIT ACTION =====
function handleUnitAction(row, col) {
  const { row: sr, col: sc } = gameState.selectedUnit;
  const occupant = gameState.board[row][col];
  const attacker = gameState.board[sr][sc];
  if (!attacker) return;

  if (sr === row && sc === col) {
    gameState.selectedUnit = null;
    renderHandUI();
    updateHintUI();
    if (window.boardScene) window.boardScene.refresh();
    return;
  }

  const dist = distance(sr, sc, row, col);

  if (occupant && occupant.owner === "enemy" && dist <= attacker.range && dist > 0) {
    if (gameState.playerAP < 1) return;
    executeAttack(sr, sc, row, col);
    return;
  }

  if (!occupant && dist === 1) {
    if (gameState.playerAP < 1) return;
    executeMove(sr, sc, row, col);
    return;
  }

  gameState.selectedUnit = null;
  renderHandUI();
  updateHintUI();
  if (window.boardScene) window.boardScene.refresh();
}

// ===== MOVE =====
function executeMove(fromRow, fromCol, toRow, toCol) {
  gameState.isAnimating = true;
  _startAnimSafety();

  const mover = gameState.board[fromRow][fromCol];
  gameState.board[toRow][toCol] = mover;
  gameState.board[fromRow][fromCol] = null;
  gameState.playerAP -= 1;

  playClickSound();

  updateTopBarUI();
  updateHintUI();
  if (window.boardScene) {
    window.boardScene.refresh();
    gameState.selectedUnit = { row: toRow, col: toCol };
    window.boardScene.animateSpawn(toRow, toCol);
  }

  const trapped = checkTrapAt(toRow, toCol, mover);

  setTimeout(() => {
    gameState.isAnimating = false;
    if (window.boardScene) window.boardScene.refresh();
  }, trapped ? 500 : 300);
}

// ===== ATTACK =====
function executeAttack(fromRow, fromCol, toRow, toCol) {
  gameState.isAnimating = true;
  _startAnimSafety();

  const attacker = gameState.board[fromRow][fromCol];
  const target = gameState.board[toRow][toCol];

  playAttackSound();

  target.hp -= attacker.attack;
  gameState.playerAP -= 1;

  if (window.boardScene) window.boardScene.showFloatingText(toRow, toCol, `-${attacker.attack}`, "#ef4444");

  if (target.type === "KING") {
    if (target.owner === "enemy") gameState.enemyKingHP = target.hp;
    else gameState.playerKingHP = target.hp;
  }

  const died = target.hp <= 0 && target.type !== "KING";
  if (died) {
    gameState.board[toRow][toCol] = null;
    gameState.selectedUnit = null;
    playDeathSound();
  }

  setTimeout(() => {
    gameState.isAnimating = false;
    updateTopBarUI();
    updateHintUI();
    if (window.boardScene) window.boardScene.refresh();
    checkWinLoss();
  }, 400);
}

// ===== END TURN =====
function onEndTurnClick() {
  console.log("🎯 End Turn diklik. isAITurn:", gameState.isAITurn, "isAnimating:", gameState.isAnimating);

  if (gameState.isAITurn || gameState.isGameOver || gameState.isAnimating) {
    console.warn("⛔ End Turn diblokir:", {
      isAITurn: gameState.isAITurn,
      isGameOver: gameState.isGameOver,
      isAnimating: gameState.isAnimating,
    });
    return;
  }
  playClickSound();

  gameState.selectedCard = null;
  gameState.selectedUnit = null;
  renderHandUI();
  updateHintUI();
  if (window.boardScene) window.boardScene.refresh();

  showTurnBanner("ENEMY TURN");
  playTurnSound();

  setTimeout(() => runAITurn(), 900);
}

// ===== AI =====
function runAITurn() {
  gameState.isAITurn = true;
  _updatePhaseIndicator();
  gameState.enemyAP = Math.min(gameState.turn + 3 + gameState.aiBonusAP, 12);
  drawEnemyCardFromDeck();

  document.getElementById("btn-end-turn").disabled = true;
  updateHintUI();
  updateInfoPanelUI();

  setTimeout(() => aiStep(1), 500);
}

function aiStep(stepNum) {
  if (gameState.isGameOver) { endAITurn(); return; }
  if (stepNum > 40) { endAITurn(); return; }

  const acted = aiDoAction();

  if (acted && gameState.enemyAP > 0) {
    setTimeout(() => aiStep(stepNum + 1), 600);
  } else {
    setTimeout(() => endAITurn(), 500);
  }
}

function aiDoAction() {
  const enemyUnits = getUnitsByOwner("enemy");
  const playerUnits = getUnitsByOwner("player");

  if (gameState.enemyAP >= 2) {
    for (let i = 0; i < gameState.enemyHand.length; i++) {
      const card = CARDS[gameState.enemyHand[i]];
      if (card.type === "SPELL" && card.effect === "HEAL") {
        const wounded = enemyUnits.find((u) => u.unit.hp < u.unit.maxHp * 0.5);
        if (wounded) { aiCastSpell(i, wounded.row, wounded.col, card); return true; }
      }
    }
  }

  for (const eu of enemyUnits) {
    for (const pu of playerUnits) {
      const d = distance(eu.row, eu.col, pu.row, pu.col);
      if (d <= eu.unit.range && d > 0) {
        if (gameState.enemyAP >= 1) { aiAttack(eu.row, eu.col, pu.row, pu.col); return true; }
      }
    }
    const dKing = distance(eu.row, eu.col, PLAYER_KING_ROW, KING_COL);
    if (dKing <= eu.unit.range && dKing > 0) {
      if (gameState.enemyAP >= 1) { aiAttack(eu.row, eu.col, PLAYER_KING_ROW, KING_COL); return true; }
    }
  }

  for (let i = 0; i < gameState.enemyHand.length; i++) {
    const card = CARDS[gameState.enemyHand[i]];
    if (card.type === "UNIT" && card.cost <= gameState.enemyAP) {
      const tile = findEnemySummonTile();
      if (tile) { aiSummon(i, tile.row, tile.col); return true; }
    }
  }

  for (const eu of enemyUnits) {
    if (gameState.enemyAP >= 1) {
      const move = findBestMove(eu.row, eu.col);
      if (move) { aiMove(eu.row, eu.col, move.row, move.col); return true; }
    }
  }

  return false;
}

function aiCastSpell(handIndex, row, col, card) {
  const target = gameState.board[row][col];
  if (!target) return;

  playSpellSound();

  if (card.effect === "HEAL") {
    showSpellNotification("💚", "ENEMY HEAL!", "#22c55e");
    const healed = Math.min(card.value, target.maxHp - target.hp);
    target.hp += healed;
    if (window.boardScene) window.boardScene.showFloatingText(row, col, `+${healed}`, "#22c55e");
  }

  gameState.enemyHand.splice(handIndex, 1);
  gameState.enemyDiscard.push(card.id);
  gameState.enemyAP -= card.cost;

  updateTopBarUI();
  if (window.boardScene) window.boardScene.refresh();
}

function aiSummon(handIndex, row, col) {
  const cardKey = gameState.enemyHand[handIndex];
  const card = CARDS[cardKey];

  gameState.board[row][col] = {
    type: "UNIT",
    owner: "enemy",
    name: card.name,
    hp: card.hp,
    maxHp: card.hp,
    attack: card.attack,
    range: card.range,
  };

  gameState.enemyHand.splice(handIndex, 1);
  gameState.enemyDiscard.push(cardKey);
  gameState.enemyAP -= card.cost;

  if (window.boardScene) {
    window.boardScene.refresh();
    window.boardScene.animateSpawn(row, col);
  }
}

function aiMove(fromRow, fromCol, toRow, toCol) {
  const mover = gameState.board[fromRow][fromCol];
  gameState.board[toRow][toCol] = mover;
  gameState.board[fromRow][fromCol] = null;
  gameState.enemyAP -= 1;
  if (window.boardScene) window.boardScene.refresh();

  checkTrapAt(toRow, toCol, mover);

  if (window.boardScene) window.boardScene.refresh();
}

function aiAttack(fromRow, fromCol, toRow, toCol) {
  const attacker = gameState.board[fromRow][fromCol];
  const target = gameState.board[toRow][toCol];

  playAttackSound();

  target.hp -= attacker.attack;
  gameState.enemyAP -= 1;

  if (window.boardScene) window.boardScene.showFloatingText(toRow, toCol, `-${attacker.attack}`, "#ef4444");

  if (target.type === "KING") {
    if (target.owner === "player") gameState.playerKingHP = target.hp;
    else gameState.enemyKingHP = target.hp;
  }

  if (target.hp <= 0 && target.type !== "KING") {
    gameState.board[toRow][toCol] = null;
    playDeathSound();
  }

  updateTopBarUI();
  if (window.boardScene) window.boardScene.refresh();
  checkWinLoss();
}

function endAITurn() {
  if (gameState.isGameOver) return;

  gameState.isAITurn = false;
  gameState.turn++;
  gameState.playerAP = Math.min(gameState.turn + 3, 12);
  drawCardFromDeck();

  document.getElementById("btn-end-turn").disabled = false;
  updateTopBarUI();
  renderHandUI();
  updateHintUI();
  updateInfoPanelUI();
  if (window.boardScene) window.boardScene.refresh();

  showTurnBanner("YOUR TURN");
  playTurnSound();
  _updatePhaseIndicator();
}

// ===== HELPERS =====
function getUnitsByOwner(owner) {
  const units = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const o = gameState.board[r][c];
      if (o && o.owner === owner && o.type === "UNIT") {
        units.push({ row: r, col: c, unit: o });
      }
    }
  }
  return units;
}

function findEnemySummonTile() {
  const candidates = [];
  for (let r = 0; r <= 1; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (gameState.board[r][c] === null) candidates.push({ row: r, col: c });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => Math.abs(a.col - KING_COL) - Math.abs(b.col - KING_COL));
  return candidates[0];
}

function findBestMove(fromRow, fromCol) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let best = null;
  let bestDist = distance(fromRow, fromCol, PLAYER_KING_ROW, KING_COL);

  for (const [dr, dc] of dirs) {
    const nr = fromRow + dr;
    const nc = fromCol + dc;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
    if (gameState.board[nr][nc] !== null) continue;

    const d = distance(nr, nc, PLAYER_KING_ROW, KING_COL);
    if (d < bestDist) { bestDist = d; best = { row: nr, col: nc }; }
  }
  return best;
}

// ===== HINT =====
function updateHintUI() {
  const hint = document.getElementById("game-hint");
  if (!hint) return;
  if (gameState.isAITurn) {
    hint.textContent = "⏳ Enemy is thinking...";
    hint.style.color = "var(--hp-red)";
  } else if (gameState.selectedCard !== null) {
    const card = CARDS[gameState.hand[gameState.selectedCard]];
    if (card.effect === "TRAP") hint.textContent = "🪤 Klik tile kosong buat pasang trap";
    else if (card.type === "UNIT") hint.textContent = "📍 Klik tile hijau buat summon";
    else hint.textContent = "📍 Klik target spell";
    hint.style.color = "#a878c8";
  } else if (gameState.selectedUnit) {
    const unit = gameState.board[gameState.selectedUnit.row][gameState.selectedUnit.col];
    if (unit) hint.textContent = `🔵 Gerak · 🔴 Attack (range ${unit.range})`;
    else hint.textContent = "🔵 Gerak · 🔴 Nyerang";
    hint.style.color = "var(--gold)";
  } else {
    hint.textContent = "💡 Klik kartu atau unit di board";
    hint.style.color = "var(--text-muted)";
  }
}

// ===== INFO PANEL =====
function updateInfoPanelUI() {
  const deckEl = document.getElementById("info-deck");
  if (deckEl) deckEl.textContent = gameState.deck.length;
  const handEl = document.getElementById("info-hand");
  if (handEl) handEl.textContent = `${gameState.hand.length}/5`;
  const diffEl = document.getElementById("info-diff");
  if (diffEl) {
    const diffLabels = { easy: "Easy", normal: "Normal", hard: "Hard" };
    diffEl.textContent = diffLabels[gameSettings.difficulty];
  }
}

// ===== SOUNDS =====
function playClickSound()  { AudioManager.play("click"); }
function playAttackSound() { AudioManager.play("attack"); }
function playSpellSound()  { AudioManager.play("spell"); }
function playDeathSound()  { AudioManager.play("death"); }
function playTurnSound()   { AudioManager.play("turn"); }

// ===== BANNERS =====
function showTurnBanner(text) {
  const banner = document.createElement("div");
  banner.className = "turn-banner show";
  banner.textContent = text;
  document.getElementById("game-screen").appendChild(banner);
  setTimeout(() => banner.remove(), 1600);
}

function showSpellNotification(icon, name, color) {
  const notif = document.createElement("div");
  notif.className = "spell-notif show";
  notif.style.borderColor = color;
  notif.innerHTML = `
    <div class="spell-notif-icon">${icon}</div>
    <div class="spell-notif-text" style="color:${color}">${name}</div>
  `;
  document.getElementById("game-screen").appendChild(notif);
  setTimeout(() => notif.remove(), 1600);
}

// ===== WIN / LOSS =====
function checkWinLoss() {
  if (gameState.enemyKingHP <= 0) {
    showGameOver("🎉 YOU WIN!", "King musuh berhasil lu hancurin!");
  } else if (gameState.playerKingHP <= 0) {
    showGameOver("💀 YOU LOSE", "King lu hancur. Coba lagi!");
  }
}

function showGameOver(title, message) {
  gameState.isGameOver = true;
  _stopMatchTimer();
  _updatePhaseIndicator();
  document.getElementById("btn-end-turn").disabled = true;

  const overlay = document.getElementById("overlay");
  overlay.classList.remove("hidden");
  overlay.innerHTML = `
    <div class="game-over-box">
      <div class="game-over-title">${title}</div>
      <div class="game-over-message">${message}</div>
      <div class="game-over-buttons">
        <button class="btn-restart" onclick="restartGame()">MAIN LAGI</button>
        <button class="btn-menu" onclick="backToMenu()">MENU</button>
      </div>
    </div>
  `;
}

function restartGame() {
  document.getElementById("overlay").classList.add("hidden");
  initGameUI();
}

function backToMenu() {
  document.getElementById("overlay").classList.add("hidden");
  _stopMatchTimer();
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById("menu-screen").classList.add("active");
}