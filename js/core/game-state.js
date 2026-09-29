const gameState = {
  turn: 1,
  playerAP: 3,
  enemyAP: 0,
  playerKingHP: 25,
  enemyKingHP: 25,
  maxKingHP: 25,
  board: [],
  deck: [],
  hand: [],
  discard: [],
  enemyDeck: [],
  enemyHand: [],
  enemyDiscard: [],
  selectedCard: null,
  selectedUnit: null,
  traps: [],
  isAITurn: false,
  isGameOver: false,
  isAnimating: false,
  aiBonusAP: 0,
};

const BOARD_SIZE = 7;
const KING_COL = 3;
const PLAYER_KING_ROW = 6;
const ENEMY_KING_ROW = 0;
const HAND_MAX = 4;

function initGameState() {
  const diff = gameSettings.difficulty;
  const kingHP = diff === "easy" ? 18 : diff === "hard" ? 30 : 25;

  gameState.turn = 1;
  gameState.playerAP = 3;
  gameState.enemyAP = 0;
  gameState.playerKingHP = kingHP;
  gameState.enemyKingHP = kingHP;
  gameState.maxKingHP = kingHP;
  gameState.board = [];
  gameState.hand = [];
  gameState.discard = [];
  gameState.deck = [];
  gameState.enemyDeck = [];
  gameState.enemyHand = [];
  gameState.enemyDiscard = [];
  gameState.selectedCard = null;
  gameState.selectedUnit = null;
  gameState.traps = [];
  gameState.isAITurn = false;
  gameState.isGameOver = false;
  gameState.isAnimating = false;
  gameState.aiBonusAP = diff === "hard" ? 2 : 0;

  // Board 7x7
  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowArr = [];
    for (let col = 0; col < BOARD_SIZE; col++) rowArr.push(null);
    gameState.board.push(rowArr);
  }
  gameState.board[ENEMY_KING_ROW][KING_COL] = {
    type: "KING", owner: "enemy", hp: kingHP, maxHp: kingHP, name: "Enemy King"
  };
  gameState.board[PLAYER_KING_ROW][KING_COL] = {
    type: "KING", owner: "player", hp: kingHP, maxHp: kingHP, name: "Your King"
  };

  // Decks
  gameState.deck = [...DEFAULT_DECK];
  gameState.enemyDeck = [...DEFAULT_DECK];
  shuffleArray(gameState.deck);
  shuffleArray(gameState.enemyDeck);

  // Fill hand sampai 4 di awal
  refillHand();
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ===== REFILL: draw sampai hand penuh (HAND_MAX) =====
function refillHand() {
  while (gameState.hand.length < HAND_MAX) {
    if (gameState.deck.length === 0) {
      if (gameState.discard.length === 0) return; // gak ada kartu
      gameState.deck = [...gameState.discard];
      gameState.discard = [];
      shuffleArray(gameState.deck);
    }
    const card = gameState.deck.pop();
    if (!card) return;
    gameState.hand.push(card);
  }
}

function refillEnemyHand() {
  while (gameState.enemyHand.length < HAND_MAX) {
    if (gameState.enemyDeck.length === 0) {
      if (gameState.enemyDiscard.length === 0) return;
      gameState.enemyDeck = [...gameState.enemyDiscard];
      gameState.enemyDiscard = [];
      shuffleArray(gameState.enemyDeck);
    }
    const card = gameState.enemyDeck.pop();
    if (!card) return;
    gameState.enemyHand.push(card);
  }
}

// Alias biar gak break code lain
function drawCardFromDeck() {
  refillHand();
}

function drawEnemyCardFromDeck() {
  refillEnemyHand();
}

function distance(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

// Auto-init
if (!gameState.board || gameState.board.length === 0) {
  initGameState();
}