const gameState = {
  turn: 1,
  playerAP: 3,
  enemyAP: 0,
  playerKingHP: 20,
  enemyKingHP: 20,
  maxKingHP: 20,
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
  aiBonusAP: 0,
};

function initGameState() {
  const diff = gameSettings.difficulty;
  const kingHP = diff === "easy" ? 15 : diff === "hard" ? 25 : 20;

  gameState.turn = 1;
  gameState.playerAP = 3;
  gameState.enemyAP = 0;
  gameState.playerKingHP = kingHP;
  gameState.enemyKingHP = kingHP;
  gameState.maxKingHP = kingHP;
  gameState.board = [];
  gameState.deck = [];
  gameState.hand = [];
  gameState.discard = [];
  gameState.enemyDeck = [];
  gameState.enemyHand = [];
  gameState.enemyDiscard = [];
  gameState.selectedCard = null;
  gameState.selectedUnit = null;
  gameState.isAITurn = false;
  gameState.isGameOver = false;
  gameState.isAnimating = false;
  gameState.aiBonusAP = diff === "hard" ? 2 : 0;

  // Board
  for (let row = 0; row < 5; row++) {
    const rowArr = [];
    for (let col = 0; col < 5; col++) rowArr.push(null);
    gameState.board.push(rowArr);
  }
  gameState.board[0][2] = { type: "KING", owner: "enemy", hp: kingHP, maxHp: kingHP, name: "Enemy King" };
  gameState.board[4][2] = { type: "KING", owner: "player", hp: kingHP, maxHp: kingHP, name: "Your King" };

  // Decks
  gameState.deck = [...DEFAULT_DECK];
  gameState.enemyDeck = [...DEFAULT_DECK];
  shuffleArray(gameState.deck);
  shuffleArray(gameState.enemyDeck);

  // Draw 3 awal
  for (let i = 0; i < 3; i++) drawCardFromDeck();
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function drawCardFromDeck() {
  if (gameState.deck.length === 0) {
    if (gameState.discard.length === 0) return null;
    gameState.deck = [...gameState.discard];
    gameState.discard = [];
    shuffleArray(gameState.deck);
  }
  if (gameState.hand.length >= 5) return null;
  gameState.hand.push(gameState.deck.pop());
}

function drawEnemyCardFromDeck() {
  if (gameState.enemyDeck.length === 0) {
    if (gameState.enemyDiscard.length === 0) return;
    gameState.enemyDeck = [...gameState.enemyDiscard];
    gameState.enemyDiscard = [];
    shuffleArray(gameState.enemyDeck);
  }
  if (gameState.enemyHand.length >= 5) return;
  gameState.enemyHand.push(gameState.enemyDeck.pop());
}

function distance(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

// Auto-init kalau belum ada board
if (!gameState.board || gameState.board.length === 0) {
  initGameState();
}