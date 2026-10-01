// ===== SAFETY: AUTO-RESET isAnimating =====
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

// ===== HERO EFFECTS =====
function getPlayerHeroEffect() { return gameState.playerHero; }
function getEnemyHeroEffect() { return gameState.enemyHero; }

function getHeroAPBonus(hero) {
  if (hero === "merchant") return 1;
  return 0;
}

function getHeroSpellBonus(hero) {
  if (hero === "archmage") return 1;
  return 0;
}

function getHeroAtkBonus(hero) {
  if (hero === "warlord") return 1;
  return 0;
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

// ===== HERO BADGE UI =====
function updateHeroBadge() {
  const badge = document.getElementById("hero-badge");
  if (!badge) return;
  const heroId = gameState.playerHero;
  const hero = HEROES[heroId];
  if (!hero) return;

  badge.innerHTML = `
    <span class="hero-icon">${hero.icon}</span>
    <span class="hero-name">${hero.name}</span>
  `;
  badge.title = hero.desc;
  badge.style.borderColor = hero.color;
  badge.style.color = hero.color;
}

// ===== MILESTONE BONUS =====
function checkTurnMilestone() {
  const turn = gameState.turn;

  if (turn === 10) {
    gameState.playerAP += 5;
    for (let i = 0; i < 2; i++) {
      if (gameState.deck.length === 0) {
        if (gameState.discard.length === 0) break;
        gameState.deck = [...gameState.discard];
        gameState.discard = [];
        shuffleArray(gameState.deck);
      }
      const card = gameState.deck.pop();
      if (card) gameState.hand.push(card);
    }
    while (gameState.hand.length > 4) {
      const removed = gameState.hand.shift();
      gameState.discard.push(removed);
    }
    showTurnBanner("🎁 AP SURGE!");
    showSpellNotification("🎁", "+5 AP & +2 CARDS!", "#fbbf24");
    playTurnSound();
  }

  if (turn === 20) {
    gameState.playerAP += 10;
    const playerUnits = getUnitsByOwner("player");
    for (const pu of playerUnits) {
      pu.unit.attack += 1;
      if (window.boardScene) {
        window.boardScene.showFloatingText(pu.row, pu.col, "+1 ATK", "#fbbf24");
      }
    }
    showTurnBanner("🎁 RAGE OF AGES!");
    showSpellNotification("🎁", "+10 AP & +1 ATK ALL!", "#fbbf24");
    playTurnSound();
  }

  if (turn === 30) {
    gameState.playerAP += 15;
    const playerUnits = getUnitsByOwner("player");
    for (const pu of playerUnits) {
      pu.unit.hp = pu.unit.maxHp;
      if (window.boardScene) {
        window.boardScene.showFloatingText(pu.row, pu.col, "FULL HP", "#5db85d");
      }
    }
    showTurnBanner("🎁 DIVINE BLESSING!");
    showSpellNotification("🎁", "+15 AP & FULL HEAL!", "#5db85d");
    playTurnSound();
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
  updateHeroBadge();

  // Tampilkan hero draw gacha
  showHeroDrawAnimation();

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

  // Cek auto-end setelah hero animation selesai
  setTimeout(() => {
    if (gameSettings.autoEndTurn) checkAutoEndTurn();
  }, 6000);

    // ===== DEBUG PANEL =====
function updateDebugPanel() {
  const wrapper = document.querySelector(".board-wrapper");
  const board = document.getElementById("phaser-board");
  const canvas = board ? board.querySelector("canvas") : null;

  const wr = wrapper ? wrapper.getBoundingClientRect() : null;
  const br = board ? board.getBoundingClientRect() : null;
  const cr = canvas ? canvas.getBoundingClientRect() : null;

  let lines = [];

  lines.push("📐 WINDOW");
  lines.push("  W: " + window.innerWidth + "  H: " + window.innerHeight);

  lines.push("");
  lines.push("📦 WRAPPER");
  if (wr) {
    lines.push("  W: " + Math.round(wr.width) + "  H: " + Math.round(wr.height));
    lines.push("  X: " + Math.round(wr.x) + "  Y: " + Math.round(wr.y));
  }

  lines.push("");
  lines.push("🎯 #phaser-board");
  if (br) {
    lines.push("  W: " + Math.round(br.width) + "  H: " + Math.round(br.height));
    lines.push("  X: " + Math.round(br.x) + "  Y: " + Math.round(br.y));
  }

  lines.push("");
  lines.push("🖼️ CANVAS");
  if (cr) {
    lines.push("  Display W: " + Math.round(cr.width));
    lines.push("  Display H: " + Math.round(cr.height));
  }
  if (window.boardScene) {
    lines.push("  Internal W: " + window.boardScene.scale.width);
    lines.push("  Internal H: " + window.boardScene.scale.height);
    lines.push("  TILE: " + window.boardScene.TILE);
    lines.push("  GAP: " + window.boardScene.GAP);
  }

  lines.push("");
  lines.push("🎮 STATE");
  lines.push("  Turn: " + gameState.turn);
  lines.push("  AP: " + gameState.playerAP);
  lines.push("  Hand: " + gameState.hand.length);

  lines.push("");
  lines.push("🔍 OFFSET");
  if (br && wr) {
    const top = Math.round(br.y - wr.y);
    const bottom = Math.round(wr.bottom - br.bottom);
    lines.push("  Top: " + top + "px");
    lines.push("  Bottom: " + bottom + "px");
    lines.push("  Center? " + (Math.abs(top - bottom) < 10 ? "✅" : "❌"));
  }

  const text = lines.join("\n");
  console.log(text);
  alert(text);
}
}

// ============================================================
// HERO DRAW ANIMATION — GACHA STYLE (FAST)
// ============================================================
function showHeroDrawAnimation() {
  const overlay = document.getElementById("hero-draw-overlay");
  if (!overlay) return;

  const playerHeroKey = gameState.playerHero;
  const enemyHeroKey = gameState.enemyHero;
  const playerHero = HEROES[playerHeroKey];
  const enemyHero = HEROES[enemyHeroKey];
  if (!playerHero || !enemyHero) return;

  const playerSlot = document.getElementById("hero-slot-player");
  const playerCard = document.getElementById("hero-slot-player-card");
  const enemySlot = document.getElementById("hero-slot-enemy");
  const enemyCard = document.getElementById("hero-slot-enemy-card");
  const vsEl = document.getElementById("hero-vs");
  const skipBtn = document.getElementById("hero-draw-skip");

  // Reset semua
  playerSlot.classList.remove("slide-left");
  enemySlot.classList.remove("slide-right");
  playerCard.className = "hero-slot-card";
  enemyCard.className = "hero-slot-card";
  vsEl.classList.remove("show");
  overlay.classList.remove("hidden", "closing");
  skipBtn.style.display = "block";

  // State
  let skipped = false;
  let activeRAF = null;

  const finishGacha = () => {
    if (skipped) return;
    skipped = true;

    if (activeRAF) cancelAnimationFrame(activeRAF);

    // Final state
    playerCard.className = "hero-slot-card " + playerHeroKey;
    playerCard.innerHTML = `
      <div class="hero-slot-icon">${playerHero.icon}</div>
      <div class="hero-slot-name">${playerHero.name}</div>
    `;
    enemyCard.className = "hero-slot-card " + enemyHeroKey;
    enemyCard.innerHTML = `
      <div class="hero-slot-icon">${enemyHero.icon}</div>
      <div class="hero-slot-name">${enemyHero.name}</div>
    `;
    playerSlot.classList.add("slide-left");
    enemySlot.classList.add("slide-right");
    vsEl.classList.add("show");

    setTimeout(closeGacha, 600);
  };

  const closeGacha = () => {
    skipBtn.style.display = "none";
    overlay.classList.add("closing");
    setTimeout(() => {
      overlay.classList.add("hidden");
      overlay.classList.remove("closing");
    }, 400);
  };

  skipBtn.onclick = finishGacha;

  playTurnSound();

  // ===== ROLL — pake requestAnimationFrame biar smooth, gak numpuk =====
  function rollHero(cardEl, targetHeroKey, duration, onComplete) {
    const heroKeys = Object.keys(HEROES);
    const targetHero = HEROES[targetHeroKey];

    const startTime = performance.now();
    let lastTickTime = 0;

    function animate() {
      if (skipped) return;

      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Target interval — start 60ms, end 350ms
      const targetInterval = 60 + (350 - 60) * easeProgress;

      if (elapsed - lastTickTime >= targetInterval) {
        lastTickTime = elapsed;

        if (progress >= 1) {
          // Final
          cardEl.className = "hero-slot-card " + targetHeroKey;
          cardEl.innerHTML = `
            <div class="hero-slot-icon">${targetHero.icon}</div>
            <div class="hero-slot-name">${targetHero.name}</div>
          `;
          cardEl.classList.add("flash");
          playSpellSound();
          if (onComplete) onComplete();
          return;
        }

        // Random hero
        const randomKey = heroKeys[Math.floor(Math.random() * heroKeys.length)];
        const randomHero = HEROES[randomKey];
        cardEl.className = "hero-slot-card " + randomKey;
        cardEl.innerHTML = `
          <div class="hero-slot-icon">${randomHero.icon}</div>
          <div class="hero-slot-name">${randomHero.name}</div>
        `;

        // Sound tick — 40% chance
        if (gameSettings.soundEnabled && Math.random() < 0.4) {
          try { AudioManager.play("click"); } catch (e) {}
        }
      }

      activeRAF = requestAnimationFrame(animate);
    }

    activeRAF = requestAnimationFrame(animate);
  }

  // ===== SEQUENCE — player roll LANGSUNG =====
  rollHero(playerCard, playerHeroKey, 1500, () => {
    if (skipped) return;

    // Player stop → slide kiri (200ms delay biar keliatan flash)
    setTimeout(() => {
      if (skipped) return;
      playerSlot.classList.add("slide-left");

      // Enemy roll — 200ms setelah slide
      setTimeout(() => {
        if (skipped) return;
        rollHero(enemyCard, enemyHeroKey, 1500, () => {
          if (skipped) return;

          setTimeout(() => {
            if (skipped) return;
            enemySlot.classList.add("slide-right");

            setTimeout(() => {
              if (skipped) return;
              vsEl.classList.add("show");

              setTimeout(() => {
                if (skipped) return;
                closeGacha();
              }, 1000);
            }, 200);
          }, 200);
        });
      }, 200);
    }, 200);
  });
}

// ============================================================
// AUTO END TURN SYSTEM
// ============================================================
let _autoEndTimer = null;

function checkAutoEndTurn() {
  if (_autoEndTimer) {
    clearTimeout(_autoEndTimer);
    _autoEndTimer = null;
  }

  if (!gameSettings.autoEndTurn) return;
  if (gameState.isAITurn) return;
  if (gameState.isGameOver) return;
  if (gameState.isAnimating) return;
  if (gameState.selectedCard !== null) return;
  if (gameState.selectedUnit) return;

  if (hasValidAction()) return;

  console.log("⏭️ Auto end turn triggered (no valid action)");

  _autoEndTimer = setTimeout(() => {
    if (hasValidAction()) return;
    if (gameState.isAITurn || gameState.isGameOver || gameState.isAnimating) return;
    if (gameState.selectedCard !== null || gameState.selectedUnit) return;

    showAutoEndToast();
    onEndTurnClick();
  }, 1500);
}

function hasValidAction() {
  // 1. Cek kartu affordable
  for (const cardKey of gameState.hand) {
    const card = CARDS[cardKey];
    if (!card) continue;
    if (card.cost <= gameState.playerAP) {
      if (card.type === "UNIT") {
        for (let r = 4; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (gameState.board[r][c] === null) return true;
          }
        }
      }
      if (card.type === "SPELL") {
        if (card.effect === "TRAP") {
          for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
              if (gameState.board[r][c] === null) return true;
            }
          }
        }
        if (card.effect === "ROW_DAMAGE") {
          const enemyUnits = getUnitsByOwner("enemy");
          if (enemyUnits.length > 0) return true;
        }
        if (card.effect === "DAMAGE") {
          const enemyUnits = getUnitsByOwner("enemy");
          if (enemyUnits.length > 0) return true;
        }
        if (card.effect === "HEAL" || card.effect === "BUFF") {
          const playerUnits = getUnitsByOwner("player");
          if (playerUnits.length > 0) return true;
        }
      }
    }
  }

  // 2. Cek unit player bisa gerak / nyerang
  const playerUnits = getUnitsByOwner("player");
  for (const pu of playerUnits) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dr, dc] of dirs) {
      const nr = pu.row + dr;
      const nc = pu.col + dc;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        if (gameState.board[nr][nc] === null) return true;
      }
    }

    const enemyUnits = getUnitsByOwner("enemy");
    for (const eu of enemyUnits) {
      const d = distance(pu.row, pu.col, eu.row, eu.col);
      if (d <= pu.unit.range && d > 0) return true;
    }
  }

  // 3. Cek AP cukup buat minimal 1 aksi
  if (gameState.playerAP >= 1) {
    if (playerUnits.length > 0) return true;
  }

  return false;
}

function showAutoEndToast() {
  const toast = document.createElement("div");
  toast.className = "auto-end-toast";
  toast.textContent = "⏭️ Auto End Turn";
  document.getElementById("game-screen").appendChild(toast);
  setTimeout(() => {
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 1200);
  }, 50);
}

// ============================================================
// INIT / TOP BAR / HAND
// ============================================================
function updateTopBarUI() {
  document.getElementById("stat-turn").textContent = gameState.turn;
  const apEl = document.getElementById("stat-ap");
  if (apEl) apEl.textContent = gameState.playerAP;
  const pEl = document.getElementById("stat-player-hp");
  if (pEl) pEl.textContent = gameState.playerKingHP;
  const eEl = document.getElementById("stat-enemy-hp");
  if (eEl) eEl.textContent = gameState.enemyKingHP;
}

function renderHandUI() {
  const hand = document.getElementById("hand");
  hand.innerHTML = "";

  gameState.hand.forEach((cardKey, index) => {
    const card = CARDS[cardKey];
    if (!card) return;
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

  if (_autoEndTimer) {
    clearTimeout(_autoEndTimer);
    _autoEndTimer = null;
  }
}

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

    if (_autoEndTimer) {
      clearTimeout(_autoEndTimer);
      _autoEndTimer = null;
    }
  }
};

function handleCardPlay(row, col) {
  const cardKey = gameState.hand[gameState.selectedCard];
  const card = CARDS[cardKey];
  if (!card) return;

  if (card.cost > gameState.playerAP) {
    playClickSound();
    return;
  }

  if (card.type === "UNIT") {
    if (row < 4 || gameState.board[row][col] !== null) {
      playClickSound();
      return;
    }

    const heroAtkBonus = getHeroAtkBonus(gameState.playerHero);

    gameState.board[row][col] = {
      type: "UNIT",
      owner: "player",
      name: card.name,
      hp: card.hp,
      maxHp: card.hp,
      attack: card.attack + heroAtkBonus,
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

    scheduleAutoEnd();
    return;
  }

  if (card.type === "SPELL") {
    if (card.effect === "TRAP") {
      handleTrapPlay(row, col, card, cardKey);
      return;
    }
    if (card.effect === "ROW_DAMAGE") {
      handleRowDamagePlay(row, card, cardKey);
      return;
    }
    handleSpellPlay(row, col, card, cardKey);
    return;
  }
}

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

  updateTopBarUI();
  renderHandUI();
  updateHintUI();
  updateInfoPanelUI();
  if (window.boardScene) window.boardScene.refresh();

  scheduleAutoEnd();
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

function handleRowDamagePlay(row, card, cardKey) {
  const heroBonus = getHeroSpellBonus(gameState.playerHero);
  const damage = card.value + heroBonus;

  const targets = [];
  for (let c = 0; c < BOARD_SIZE; c++) {
    const o = gameState.board[row][c];
    if (o && o.owner === "enemy" && o.type === "UNIT") {
      targets.push({ row, col: c, unit: o });
    }
  }

  if (targets.length === 0) {
    playClickSound();
    return;
  }

  gameState.isAnimating = true;
  _startAnimSafety();
  playSpellSound();

  showSpellNotification("⚡", "LIGHTNING!", "#fbbf24");

  for (const t of targets) {
    t.unit.hp -= damage;
    if (window.boardScene) {
      window.boardScene.showFloatingText(t.row, t.col, `-${damage}`, "#fbbf24");
    }
  }

  for (const t of targets) {
    if (t.unit.hp <= 0) {
      gameState.board[t.row][t.col] = null;
    }
  }

  gameState.playerAP -= card.cost;
  gameState.hand.splice(gameState.selectedCard, 1);
  gameState.discard.push(cardKey);
  gameState.selectedCard = null;

  if (targets.some((t) => t.unit.hp <= 0)) {
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
    scheduleAutoEnd();
  }, 400);
}

function handleSpellPlay(row, col, card, cardKey) {
  const target = gameState.board[row][col];
  if (!target) return;

  if (card.targetType === "ANY_UNIT" && target.type === "KING") return;
  if (card.targetType === "ALLY_UNIT" && (target.owner !== "player" || target.type !== "UNIT")) return;

  gameState.isAnimating = true;
  _startAnimSafety();
  playSpellSound();

  if (card.effect === "DAMAGE") {
    const heroBonus = getHeroSpellBonus(gameState.playerHero);
    const damage = card.value + heroBonus;
    showSpellNotification("🔥", "FIREBALL!", "#f97316");
    target.hp -= damage;
    if (window.boardScene) window.boardScene.showFloatingText(row, col, `-${damage}`, "#f97316");
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
    scheduleAutoEnd();
  }, 400);
}

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
    scheduleAutoEnd();
  }, trapped ? 500 : 300);
}

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
    scheduleAutoEnd();
  }, 400);
}

function scheduleAutoEnd() {
  if (!gameSettings.autoEndTurn) return;
  setTimeout(() => {
    checkAutoEndTurn();
  }, 800);
}

function onEndTurnClick() {
  console.log("🎯 End Turn diklik. isAITurn:", gameState.isAITurn, "isAnimating:", gameState.isAnimating);

  if (_autoEndTimer) {
    clearTimeout(_autoEndTimer);
    _autoEndTimer = null;
  }

  if (gameState.isAITurn || gameState.isGameOver || gameState.isAnimating) {
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

  const heroAPBonus = getHeroAPBonus(gameState.enemyHero);
  gameState.enemyAP = Math.min(gameState.turn + 3 + gameState.aiBonusAP + heroAPBonus, 13);
  gameState._aiHealedThisTurn = false;
  drawEnemyCardFromDeck();

  document.getElementById("btn-end-turn").disabled = true;
  updateHintUI();
  updateInfoPanelUI();

  gameState._aiLastAP = gameState.enemyAP;
  gameState._aiStuckCount = 0;

  setTimeout(() => aiStep(1), 500);
}

function aiStep(stepNum) {
  if (gameState.isGameOver) { endAITurn(); return; }

  if (stepNum > 15) {
    forceEndAITurn();
    return;
  }

  if (gameState.enemyAP === gameState._aiLastAP) {
    gameState._aiStuckCount++;
    if (gameState._aiStuckCount >= 2) {
      forceEndAITurn();
      return;
    }
  } else {
    gameState._aiStuckCount = 0;
  }
  gameState._aiLastAP = gameState.enemyAP;

  let acted = false;
  try {
    acted = aiDoAction();
  } catch (e) {
    console.error("❌ AI error:", e);
    forceEndAITurn();
    return;
  }

  if (acted && gameState.enemyAP > 0) {
    setTimeout(() => aiStep(stepNum + 1), 600);
  } else {
    setTimeout(() => endAITurn(), 500);
  }
}

function forceEndAITurn() {
  gameState.isAITurn = false;
  gameState._aiStuckCount = 0;
  gameState.turn++;

  const heroAPBonus = getHeroAPBonus(gameState.playerHero);
  gameState.playerAP = Math.min(gameState.turn + 3 + heroAPBonus, 13);

  if (typeof drawCardFromDeck === "function") drawCardFromDeck();

  document.getElementById("btn-end-turn").disabled = false;

  checkTurnMilestone();

  updateTopBarUI();
  renderHandUI();
  updateHintUI();
  updateInfoPanelUI();
  if (window.boardScene) window.boardScene.refresh();

  showTurnBanner("YOUR TURN");
  playTurnSound();
  _updatePhaseIndicator();

  scheduleAutoEnd();
}

function aiDoAction() {
  const enemyUnits = getUnitsByOwner("enemy");
  const playerUnits = getUnitsByOwner("player");
  const heroSpellBonus = getHeroSpellBonus(gameState.enemyHero);

  // 0. FIREBALL KILL
  if (gameState.enemyAP >= 3) {
    const fireballIdx = gameState.enemyHand.findIndex((k) => {
      const c = CARDS[k];
      return c && c.type === "SPELL" && c.effect === "DAMAGE";
    });
    if (fireballIdx !== -1) {
      const fireballKey = gameState.enemyHand[fireballIdx];
      const fireballCard = CARDS[fireballKey];
      if (fireballCard) {
        const totalDamage = fireballCard.value + heroSpellBonus;
        const killable = playerUnits.find((pu) => pu.unit.hp <= totalDamage);
        if (killable) {
          const success = aiCastDamageSpell(fireballIdx, killable.row, killable.col, fireballCard);
          if (success) return true;
        }
      }
    }
  }

  // 0.5. LIGHTNING
  if (gameState.enemyAP >= 4) {
    const lightningIdx = gameState.enemyHand.findIndex((k) => {
      const c = CARDS[k];
      return c && c.type === "SPELL" && c.effect === "ROW_DAMAGE";
    });
    if (lightningIdx !== -1) {
      const bestRow = findBestLightningRow();
      if (bestRow !== -1) {
        const success = aiCastRowDamage(lightningIdx, bestRow);
        if (success) return true;
      }
    }
  }

  // 1. KILL ATTACK
  for (const eu of enemyUnits) {
    for (const pu of playerUnits) {
      const d = distance(eu.row, eu.col, pu.row, pu.col);
      if (d <= eu.unit.range && d > 0) {
        if (pu.unit.hp <= eu.unit.attack) {
          if (gameState.enemyAP >= 1) {
            aiAttack(eu.row, eu.col, pu.row, pu.col);
            return true;
          }
        }
      }
    }
    const dKing = distance(eu.row, eu.col, PLAYER_KING_ROW, KING_COL);
    if (dKing <= eu.unit.range && dKing > 0) {
      if (gameState.playerKingHP <= eu.unit.attack) {
        if (gameState.enemyAP >= 1) {
          aiAttack(eu.row, eu.col, PLAYER_KING_ROW, KING_COL);
          return true;
        }
      }
    }
  }

  // 2. HEAL
  if (gameState.enemyAP >= 2 && !gameState._aiHealedThisTurn) {
    const healIdx = gameState.enemyHand.findIndex((k) => {
      const c = CARDS[k];
      return c && c.type === "SPELL" && c.effect === "HEAL";
    });
    if (healIdx !== -1) {
      const wounded = enemyUnits.find((u) => u.unit.hp < u.unit.maxHp * 0.5);
      if (wounded) {
        const success = aiCastHealSpell(healIdx, wounded.row, wounded.col);
        if (success) {
          gameState._aiHealedThisTurn = true;
          return true;
        }
      }
    }
  }

  // 3. SUMMON
  const aiUnitCount = enemyUnits.length;
  const playerUnitCount = playerUnits.length;
  const shouldSummon = aiUnitCount <= playerUnitCount || aiUnitCount < 3;

  if (shouldSummon || gameState.enemyAP >= 4) {
    const summonableCards = [];
    for (let i = 0; i < gameState.enemyHand.length; i++) {
      const cardKey = gameState.enemyHand[i];
      const card = CARDS[cardKey];
      if (card && card.type === "UNIT" && card.cost <= gameState.enemyAP) {
        summonableCards.push({ index: i, cardKey, card });
      }
    }

    if (summonableCards.length > 0) {
      const aiHasTank = enemyUnits.some((u) => u.unit.name.toLowerCase().includes("guardian"));
      const aiHasRanged = enemyUnits.some((u) => u.unit.name.toLowerCase().includes("archer"));
      const aiHasMelee = enemyUnits.some((u) => u.unit.name.toLowerCase().includes("knight"));
      const aiHasAssassin = enemyUnits.some((u) => u.unit.name.toLowerCase().includes("assassin"));

      const guardians = summonableCards.filter((s) => s.card.name.toLowerCase().includes("guardian"));
      const archers = summonableCards.filter((s) => s.card.name.toLowerCase().includes("archer"));
      const knights = summonableCards.filter((s) => s.card.name.toLowerCase().includes("knight"));
      const assassins = summonableCards.filter((s) => s.card.name.toLowerCase().includes("assassin"));

      let chosenCard = null;
      if (!aiHasTank && guardians.length > 0) chosenCard = guardians[0];
      else if (!aiHasRanged && archers.length > 0) chosenCard = archers[0];
      else if (!aiHasMelee && knights.length > 0) chosenCard = knights[0];
      else if (!aiHasAssassin && assassins.length > 0) chosenCard = assassins[0];
      else chosenCard = summonableCards[Math.floor(Math.random() * summonableCards.length)];

      const tile = findEnemySummonTile(chosenCard.card);
      if (tile) {
        const success = aiSummon(chosenCard.index, tile.row, tile.col);
        if (success) return true;
      }
    }
  }

  // 4. TRAP
  if (gameState.enemyAP >= 2) {
    const trapIdx = gameState.enemyHand.findIndex((k) => {
      const c = CARDS[k];
      return c && c.type === "SPELL" && c.effect === "TRAP";
    });
    if (trapIdx !== -1) {
      const trapTile = aiFindTrapTile();
      if (trapTile) {
        const success = aiCastTrap(trapIdx, trapTile.row, trapTile.col);
        if (success) return true;
      }
    }
  }

  // 5. RAGE
  if (gameState.enemyAP >= 2) {
    const rageIdx = gameState.enemyHand.findIndex((k) => {
      const c = CARDS[k];
      return c && c.type === "SPELL" && c.effect === "BUFF";
    });
    if (rageIdx !== -1) {
      const bestTarget = enemyUnits
        .filter((u) => u.unit.hp > u.unit.maxHp * 0.5)
        .sort((a, b) => b.row - a.row)[0];
      if (bestTarget) {
        const success = aiCastBuffSpell(rageIdx, bestTarget.row, bestTarget.col);
        if (success) return true;
      }
    }
  }

  // 6. ATTACK biasa
  for (const eu of enemyUnits) {
    for (const pu of playerUnits) {
      const d = distance(eu.row, eu.col, pu.row, pu.col);
      if (d <= eu.unit.range && d > 0) {
        if (gameState.enemyAP >= 1) {
          aiAttack(eu.row, eu.col, pu.row, pu.col);
          return true;
        }
      }
    }
    const dKing = distance(eu.row, eu.col, PLAYER_KING_ROW, KING_COL);
    if (dKing <= eu.unit.range && dKing > 0) {
      if (gameState.enemyAP >= 1) {
        aiAttack(eu.row, eu.col, PLAYER_KING_ROW, KING_COL);
        return true;
      }
    }
  }

  // 7. MOVE
  for (const eu of enemyUnits) {
    if (gameState.enemyAP >= 1) {
      const move = findBestMove(eu.row, eu.col);
      if (move) {
        aiMove(eu.row, eu.col, move.row, move.col);
        return true;
      }
    }
  }

  return false;
}

function aiCastDamageSpell(handIndex, row, col, card) {
  const target = gameState.board[row][col];
  if (!target) return false;
  if (card.cost > gameState.enemyAP) return false;

  const cardKey = gameState.enemyHand[handIndex];
  if (!cardKey) return false;

  const heroBonus = getHeroSpellBonus(gameState.enemyHero);
  const damage = card.value + heroBonus;

  playSpellSound();
  showSpellNotification("🔥", "ENEMY FIREBALL!", "#f97316");

  target.hp -= damage;
  if (window.boardScene) window.boardScene.showFloatingText(row, col, `-${damage}`, "#f97316");

  gameState.enemyHand.splice(handIndex, 1);
  gameState.enemyDiscard.push(cardKey);
  gameState.enemyAP -= card.cost;

  if (target.hp <= 0 && target.type !== "KING") {
    gameState.board[row][col] = null;
    playDeathSound();
  }

  updateTopBarUI();
  if (window.boardScene) window.boardScene.refresh();
  checkWinLoss();
  return true;
}

function aiCastRowDamage(handIndex, row) {
  const cardKey = gameState.enemyHand[handIndex];
  if (!cardKey) return false;
  const card = CARDS[cardKey];
  if (!card) return false;
  if (card.cost > gameState.enemyAP) return false;

  const heroBonus = getHeroSpellBonus(gameState.enemyHero);
  const damage = card.value + heroBonus;

  const targets = [];
  for (let c = 0; c < BOARD_SIZE; c++) {
    const o = gameState.board[row][c];
    if (o && o.owner === "player" && o.type === "UNIT") {
      targets.push({ row, col: c, unit: o });
    }
  }

  if (targets.length === 0) return false;

  playSpellSound();
  showSpellNotification("⚡", "ENEMY LIGHTNING!", "#fbbf24");

  for (const t of targets) {
    t.unit.hp -= damage;
    if (window.boardScene) {
      window.boardScene.showFloatingText(t.row, t.col, `-${damage}`, "#fbbf24");
    }
  }

  for (const t of targets) {
    if (t.unit.hp <= 0) {
      gameState.board[t.row][t.col] = null;
    }
  }

  if (targets.some((t) => t.unit.hp <= 0)) {
    playDeathSound();
  }

  gameState.enemyHand.splice(handIndex, 1);
  gameState.enemyDiscard.push(cardKey);
  gameState.enemyAP -= card.cost;

  updateTopBarUI();
  if (window.boardScene) window.boardScene.refresh();
  checkWinLoss();
  return true;
}

function findBestLightningRow() {
  const rowCounts = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    let count = 0;
    for (let c = 0; c < BOARD_SIZE; c++) {
      const o = gameState.board[r][c];
      if (o && o.owner === "player" && o.type === "UNIT") count++;
    }
    if (count >= 2) rowCounts.push({ row: r, count });
  }
  if (rowCounts.length === 0) return -1;
  rowCounts.sort((a, b) => b.count - a.count);
  return rowCounts[0].row;
}

function aiCastHealSpell(handIndex, row, col) {
  const target = gameState.board[row][col];
  if (!target) return false;

  const cardKey = gameState.enemyHand[handIndex];
  if (!cardKey) return false;
  const card = CARDS[cardKey];
  if (!card) return false;
  if (card.cost > gameState.enemyAP) return false;

  playSpellSound();
  showSpellNotification("💚", "ENEMY HEAL!", "#22c55e");

  const healed = Math.min(card.value, target.maxHp - target.hp);
  target.hp += healed;
  if (window.boardScene) window.boardScene.showFloatingText(row, col, `+${healed}`, "#22c55e");

  gameState.enemyHand.splice(handIndex, 1);
  gameState.enemyDiscard.push(cardKey);
  gameState.enemyAP -= card.cost;
  gameState._aiHealedThisTurn = true;

  updateTopBarUI();
  if (window.boardScene) window.boardScene.refresh();
  return true;
}

function aiCastBuffSpell(handIndex, row, col) {
  const target = gameState.board[row][col];
  if (!target) return false;

  const cardKey = gameState.enemyHand[handIndex];
  if (!cardKey) return false;
  const card = CARDS[cardKey];
  if (!card) return false;
  if (card.cost > gameState.enemyAP) return false;

  playSpellSound();
  showSpellNotification("💪", "ENEMY RAGE!", "#fbbf24");

  target.attack += card.value;
  if (window.boardScene) window.boardScene.showFloatingText(row, col, `+${card.value} ATK`, "#fbbf24");

  gameState.enemyHand.splice(handIndex, 1);
  gameState.enemyDiscard.push(cardKey);
  gameState.enemyAP -= card.cost;

  updateTopBarUI();
  if (window.boardScene) window.boardScene.refresh();
  return true;
}

function aiCastTrap(handIndex, row, col) {
  if (gameState.board[row][col] !== null) return false;
  if (gameState.traps && gameState.traps.some((t) => t.row === row && t.col === col)) return false;
  if (!gameState.traps) gameState.traps = [];

  const cardKey = gameState.enemyHand[handIndex];
  if (!cardKey) return false;
  const card = CARDS[cardKey];
  if (!card) return false;
  if (card.cost > gameState.enemyAP) return false;

  gameState.traps.push({ row, col, owner: "enemy", damage: card.value });

  gameState.enemyHand.splice(handIndex, 1);
  gameState.enemyDiscard.push(cardKey);
  gameState.enemyAP -= card.cost;

  playSpellSound();
  showSpellNotification("🪤", "ENEMY TRAP!", "#ef4444");
  updateTopBarUI();
  return true;
}

function aiFindTrapTile() {
  const candidates = [];
  for (let r = 2; r <= 4; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (gameState.board[r][c] === null &&
          !(gameState.traps && gameState.traps.some((t) => t.row === r && t.col === c))) {
        candidates.push({ row: r, col: c });
      }
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => Math.abs(a.col - KING_COL) - Math.abs(b.col - KING_COL));
  return candidates[0];
}

function aiSummon(handIndex, row, col) {
  const cardKey = gameState.enemyHand[handIndex];
  const card = CARDS[cardKey];

  if (!card) return false;
  if (card.cost > gameState.enemyAP) return false;
  if (gameState.board[row][col] !== null) return false;

  const heroAtkBonus = getHeroAtkBonus(gameState.enemyHero);

  gameState.board[row][col] = {
    type: "UNIT",
    owner: "enemy",
    name: card.name,
    hp: card.hp,
    maxHp: card.hp,
    attack: card.attack + heroAtkBonus,
    range: card.range,
  };

  gameState.enemyHand.splice(handIndex, 1);
  gameState.enemyDiscard.push(cardKey);
  gameState.enemyAP -= card.cost;

  console.log(`🤖 AI summon ${card.name} di [${row}, ${col}]`);

  if (window.boardScene) {
    window.boardScene.refresh();
    window.boardScene.animateSpawn(row, col);
  }
  return true;
}

function aiMove(fromRow, fromCol, toRow, toCol) {
  const mover = gameState.board[fromRow][fromCol];
  if (!mover) return false;
  gameState.board[toRow][toCol] = mover;
  gameState.board[fromRow][fromCol] = null;
  gameState.enemyAP -= 1;
  if (window.boardScene) window.boardScene.refresh();

  checkTrapAt(toRow, toCol, mover);

  if (window.boardScene) window.boardScene.refresh();
  return true;
}

function aiAttack(fromRow, fromCol, toRow, toCol) {
  const attacker = gameState.board[fromRow][fromCol];
  const target = gameState.board[toRow][toCol];
  if (!attacker || !target) return false;

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
  return true;
}

function endAITurn() {
  if (gameState.isGameOver) return;

  gameState.isAITurn = false;
  gameState.turn++;

  const heroAPBonus = getHeroAPBonus(gameState.playerHero);
  gameState.playerAP = Math.min(gameState.turn + 3 + heroAPBonus, 13);

  drawCardFromDeck();

  document.getElementById("btn-end-turn").disabled = false;

  checkTurnMilestone();

  updateTopBarUI();
  renderHandUI();
  updateHintUI();
  updateInfoPanelUI();
  if (window.boardScene) window.boardScene.refresh();

  showTurnBanner("YOUR TURN");
  playTurnSound();
  _updatePhaseIndicator();

  scheduleAutoEnd();
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

function findEnemySummonTile(card) {
  const candidates = [];
  for (let r = 0; r <= 2; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (gameState.board[r][c] === null) {
        candidates.push({ row: r, col: c });
      }
    }
  }
  if (candidates.length === 0) return null;

  const enemyUnits = getUnitsByOwner("enemy");
  const aiUnitCount = enemyUnits.length;

  if (card && card.name.toLowerCase().includes("guardian")) {
    const frontTiles = candidates.filter((t) => t.row === 2);
    if (frontTiles.length > 0) {
      frontTiles.sort((a, b) => Math.abs(a.col - KING_COL) - Math.abs(b.col - KING_COL));
      return frontTiles[0];
    }
  }

  if (card && card.name.toLowerCase().includes("archer")) {
    const backTiles = candidates.filter((t) => t.row <= 1);
    if (backTiles.length > 0) {
      backTiles.sort((a, b) => Math.abs(b.col - KING_COL) - Math.abs(a.col - KING_COL));
      return backTiles[0];
    }
  }

  if (aiUnitCount < 2) {
    candidates.sort((a, b) => Math.abs(a.col - KING_COL) - Math.abs(b.col - KING_COL));
    return candidates[0];
  }

  if (aiUnitCount >= 3) {
    const leftFlank = candidates.filter((t) => t.col <= 2);
    const rightFlank = candidates.filter((t) => t.col >= 4);
    if (leftFlank.length > 0 && rightFlank.length > 0) {
      return leftFlank.length >= rightFlank.length ? leftFlank[0] : rightFlank[0];
    }
    return candidates[0];
  }

  candidates.sort((a, b) => Math.abs(a.col - KING_COL) - Math.abs(b.col - KING_COL));
  const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
  return topCandidates[Math.floor(Math.random() * topCandidates.length)];
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

function updateHintUI() {
  const hint = document.getElementById("game-hint");
  if (!hint) return;
  if (gameState.isAITurn) {
    hint.textContent = "⏳ Enemy is thinking...";
    hint.style.color = "var(--hp-red)";
  } else if (gameState.selectedCard !== null) {
    const card = CARDS[gameState.hand[gameState.selectedCard]];
    if (card) {
      if (card.effect === "TRAP") hint.textContent = "🪤 Klik tile kosong buat pasang trap";
      else if (card.effect === "ROW_DAMAGE") hint.textContent = "⚡ Klik tile mana aja — 1 baris kena";
      else if (card.type === "UNIT") hint.textContent = "📍 Klik tile hijau buat summon";
      else hint.textContent = "📍 Klik target spell";
      hint.style.color = "#a878c8";
    }
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

function updateInfoPanelUI() {
  const deckEl = document.getElementById("info-deck");
  if (deckEl) deckEl.textContent = gameState.deck.length;
  const handEl = document.getElementById("info-hand");
  if (handEl) handEl.textContent = `${gameState.hand.length}/4`;
  const diffEl = document.getElementById("info-diff");
  if (diffEl) {
    const diffLabels = { easy: "Easy", normal: "Normal", hard: "Hard" };
    diffEl.textContent = diffLabels[gameSettings.difficulty];
  }
  const heroEl = document.getElementById("info-hero");
  if (heroEl && gameState.playerHero) {
    const hero = HEROES[gameState.playerHero];
    heroEl.textContent = `${hero.icon} ${hero.name}`;
  }
}

function playClickSound()  { AudioManager.play("click"); }
function playAttackSound() { AudioManager.play("attack"); }
function playSpellSound()  { AudioManager.play("spell"); }
function playDeathSound()  { AudioManager.play("death"); }
function playTurnSound()   { AudioManager.play("turn"); }

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

  if (gameSettings.bgmEnabled) {
    AudioManager.playBGM(gameSettings.bgmTrack);
  }
}