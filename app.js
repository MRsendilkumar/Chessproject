const PIECE_IMAGES = {
  P: "assets/white_pawn.png",
  N: "assets/white_knight.png",
  B: "assets/white_bishop.png",
  R: "assets/white_rook.png",
  Q: "assets/white_queen.png",
  K: "assets/white_king.png",
  p: "assets/black_pawn.png",
  n: "assets/black_knight.png",
  b: "assets/black_bishop.png",
  r: "assets/black_rook.png",
  q: "assets/black_queen.png",
  k: "assets/black_king.png",
};

const VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const FILES = "abcdefgh";
const EMPTY_CASTLING = "-";
const STORAGE_KEY = "chess-ai-trainer-stats-v1";
const THEMES = {
  classic: "Classic",
  ocean: "Ocean",
  graphite: "Graphite",
  tournament: "Tournament",
};

const PUZZLES = [
  {
    name: "Back Rank Punisher",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    theme: "White to move",
    difficulty: "Easy",
    tag: "Back Rank",
    description: "Find the forcing rook move.",
  },
  {
    name: "Queen Takes the Corner",
    fen: "6k1/5ppp/8/8/8/8/5PPP/6KQ w - - 0 1",
    theme: "White to move",
    difficulty: "Easy",
    tag: "Mate Threat",
    description: "The king is boxed in. Win immediately.",
  },
  {
    name: "Knight Fork",
    fen: "4k3/8/8/3n4/8/8/4K3/7R b - - 0 1",
    theme: "Black to move",
    difficulty: "Medium",
    tag: "Fork",
    description: "Use a knight fork to win material.",
  },
  {
    name: "Loose Queen",
    fen: "4k3/8/8/8/8/3b4/4K3/3Q4 b - - 0 1",
    theme: "Black to move",
    difficulty: "Easy",
    tag: "Capture",
    description: "The bishop has a clean tactical shot.",
  },
  {
    name: "Promotion Race",
    fen: "6k1/P7/8/8/8/8/8/6K1 w - - 0 1",
    theme: "White to move",
    difficulty: "Medium",
    tag: "Promotion",
    description: "Choose the move that changes the game.",
  },
  {
    name: "Rook Behind the King",
    fen: "4k3/8/8/8/8/8/4K3/7r b - - 0 1",
    theme: "Black to move",
    difficulty: "Medium",
    tag: "Check",
    description: "Find the checking move that keeps control.",
  },
];

const PST = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 5, 5, 0, -20, -40, -30, 5, 10, 15, 15, 10, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 10, 15, 15, 10, 0, -30, -40, -20, 0, 0, 0, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 5, 0, 0, 0, 0, 5, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 5, 10, 10, 5, 0, 0, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 5, 10, 10, 10, 10, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 5, 0, 0, 0, 0, -10, -10, 5, 5, 5, 5, 5, 0, -10, 0, 0, 5, 5, 5, 5, 0, -5, -5, 0, 5, 5, 5, 5, 0, -5, -10, 0, 5, 5, 5, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [20, 30, 10, 0, 0, 10, 30, 20, 20, 20, 0, 0, 0, 0, 20, 20, -10, -20, -20, -20, -20, -20, -20, -10, -20, -30, -30, -40, -40, -30, -30, -20, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30],
};

const state = {
  game: null,
  puzzleIndex: 0,
  selected: null,
  legalTargets: [],
  bestMove: null,
  solved: 0,
  flipped: false,
  lastMove: null,
  attempts: [],
  depth: 3,
  locked: false,
  revealSolution: false,
  streak: 0,
  bestStreak: 0,
  sessionSolved: 0,
  completedCount: 0,
  totalTime: 0,
  puzzleStart: 0,
  elapsed: 0,
  timerId: null,
  finalShown: false,
  missed: [],
  reviewMode: false,
  reviewList: [],
  theme: "classic",
  lifetime: {
    solved: 0,
    attempted: 0,
    bestStreak: 0,
    fastest: null,
  },
};

const els = {
  board: document.querySelector("#board"),
  score: document.querySelector("#scoreValue"),
  title: document.querySelector("#puzzleTitle"),
  meta: document.querySelector("#puzzleMeta"),
  message: document.querySelector("#message"),
  newPuzzle: document.querySelector("#newPuzzleBtn"),
  hint: document.querySelector("#hintBtn"),
  flip: document.querySelector("#flipBtn"),
  depth: document.querySelector("#depthSlider"),
  depthLabel: document.querySelector("#depthLabel"),
  bestMove: document.querySelector("#bestMoveLabel"),
  attempts: document.querySelector("#attempts"),
};

const sounds = {
  move: createSound("assets/move.wav"),
  capture: createSound("assets/capture.wav"),
};

function createSound(src) {
  const audio = new Audio(src);
  audio.volume = 0.35;
  return audio;
}

function playSound(name) {
  const sound = sounds[name];
  if (!sound) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function injectTrainingUi() {
  const status = document.createElement("div");
  status.className = "training-stats";
  status.innerHTML = `
    <div><span>Progress</span><strong id="progressValue">1 / ${PUZZLES.length}</strong></div>
    <div><span>Time</span><strong id="timerValue">0:00</strong></div>
    <div><span>Streak</span><strong id="streakValue">0</strong></div>
    <div><span>Best</span><strong id="bestStreakValue">0</strong></div>
    <div><span>Lifetime</span><strong id="lifetimeValue">0</strong></div>
    <div><span>Fastest</span><strong id="fastestValue">--</strong></div>
  `;

  const tagRow = document.createElement("div");
  tagRow.className = "tag-row";
  tagRow.innerHTML = `
    <span id="difficultyTag" class="tag">Easy</span>
    <span id="themeTag" class="tag">Tactic</span>
  `;

  const solutionBtn = document.createElement("button");
  solutionBtn.id = "solutionBtn";
  solutionBtn.type = "button";
  solutionBtn.textContent = "Show Solution";

  const tools = document.createElement("div");
  tools.className = "tool-panel";
  tools.innerHTML = `
    <label class="field">
      <span>Board theme</span>
      <select id="themeSelect">
        ${Object.entries(THEMES).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}
      </select>
    </label>
    <div class="mini-actions">
      <button id="prevBtn" type="button">Previous</button>
      <button id="skipBtn" type="button">Skip</button>
      <button id="copyFenBtn" type="button">Copy FEN</button>
      <button id="reviewBtn" type="button">Review Missed</button>
      <button id="resetStatsBtn" type="button">Reset Stats</button>
    </div>
    <details class="help-box">
      <summary>How to use</summary>
      <p>Select a piece, choose a legal square, and try to match the engine's best move. Use Hint or Show Solution if you get stuck.</p>
      <p>Shortcuts: N new, P previous, F flip, H hint, S solution, C copy FEN, Esc clear.</p>
    </details>
  `;

  const sidePanel = document.querySelector(".side-panel");
  const statusBlock = document.querySelector(".status-block");
  const controls = document.querySelector(".controls");
  statusBlock.after(tagRow);
  tagRow.after(status);
  status.after(tools);
  controls.append(solutionBtn);

  const modal = document.createElement("div");
  modal.id = "resultsModal";
  modal.className = "results-modal hidden";
  modal.innerHTML = `
    <div class="results-card">
      <p class="eyebrow">Training Complete</p>
      <h2>Final Results</h2>
      <div class="results-grid">
        <div><span>Solved</span><strong id="finalSolved">0</strong></div>
        <div><span>Best streak</span><strong id="finalBestStreak">0</strong></div>
        <div><span>Avg. time</span><strong id="finalAverageTime">0s</strong></div>
        <div><span>Missed</span><strong id="finalMissed">0</strong></div>
      </div>
      <button id="restartBtn" type="button">Restart Training</button>
    </div>
  `;
  document.body.append(modal);

  els.progress = document.querySelector("#progressValue");
  els.timer = document.querySelector("#timerValue");
  els.streak = document.querySelector("#streakValue");
  els.bestStreak = document.querySelector("#bestStreakValue");
  els.lifetime = document.querySelector("#lifetimeValue");
  els.fastest = document.querySelector("#fastestValue");
  els.difficulty = document.querySelector("#difficultyTag");
  els.theme = document.querySelector("#themeTag");
  els.themeSelect = document.querySelector("#themeSelect");
  els.prev = document.querySelector("#prevBtn");
  els.skip = document.querySelector("#skipBtn");
  els.copyFen = document.querySelector("#copyFenBtn");
  els.review = document.querySelector("#reviewBtn");
  els.resetStats = document.querySelector("#resetStatsBtn");
  els.solution = document.querySelector("#solutionBtn");
  els.results = document.querySelector("#resultsModal");
  els.finalSolved = document.querySelector("#finalSolved");
  els.finalBestStreak = document.querySelector("#finalBestStreak");
  els.finalAverageTime = document.querySelector("#finalAverageTime");
  els.finalMissed = document.querySelector("#finalMissed");
  els.restart = document.querySelector("#restartBtn");

  els.solution.addEventListener("click", revealSolution);
  els.restart.addEventListener("click", restartTraining);
  els.themeSelect.addEventListener("change", () => setTheme(els.themeSelect.value));
  els.prev.addEventListener("click", () => loadPuzzle(state.puzzleIndex - 1));
  els.skip.addEventListener("click", skipPuzzle);
  els.copyFen.addEventListener("click", copyCurrentFen);
  els.review.addEventListener("click", startReviewMode);
  els.resetStats.addEventListener("click", resetLifetimeStats);
}

function startTimer() {
  window.clearInterval(state.timerId);
  state.puzzleStart = Date.now();
  state.elapsed = 0;
  updateTimer();
  state.timerId = window.setInterval(updateTimer, 1000);
}

function stopTimer() {
  if (!state.timerId) return;
  window.clearInterval(state.timerId);
  state.timerId = null;
  state.totalTime += state.elapsed;
}

function updateTimer() {
  state.elapsed = Math.floor((Date.now() - state.puzzleStart) / 1000);
  if (els.timer) els.timer.textContent = formatTime(state.elapsed);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function updateTrainingStats() {
  if (!els.progress) return;
  const total = state.reviewMode ? state.reviewList.length : PUZZLES.length;
  els.progress.textContent = `${state.puzzleIndex + 1} / ${total}`;
  els.streak.textContent = state.streak;
  els.bestStreak.textContent = state.bestStreak;
  els.lifetime.textContent = state.lifetime.solved;
  els.fastest.textContent = state.lifetime.fastest === null ? "--" : `${state.lifetime.fastest}s`;
}

function loadStoredStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;
    state.lifetime = { ...state.lifetime, ...(saved.lifetime || {}) };
    state.theme = saved.theme || state.theme;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveStoredStats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    lifetime: state.lifetime,
    theme: state.theme,
  }));
}

function setTheme(theme) {
  state.theme = THEMES[theme] ? theme : "classic";
  document.body.dataset.theme = state.theme;
  if (els.themeSelect) els.themeSelect.value = state.theme;
  saveStoredStats();
}

function currentPuzzleSet() {
  return state.reviewMode ? state.reviewList : PUZZLES;
}

function parseFen(fen) {
  const [placement, turn, castling = EMPTY_CASTLING, ep = "-", halfmove = "0", fullmove = "1"] = fen.split(" ");
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  placement.split("/").forEach((rank, row) => {
    let col = 0;
    for (const char of rank) {
      if (/\d/.test(char)) {
        col += Number(char);
      } else {
        board[row][col] = char;
        col += 1;
      }
    }
  });
  return { board, turn, castling, ep, halfmove: Number(halfmove), fullmove: Number(fullmove) };
}

function cloneGame(game) {
  return {
    board: game.board.map((row) => row.slice()),
    turn: game.turn,
    castling: game.castling,
    ep: game.ep,
    halfmove: game.halfmove,
    fullmove: game.fullmove,
  };
}

function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function colorOf(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? "w" : "b";
}

function opponent(color) {
  return color === "w" ? "b" : "w";
}

function squareName(row, col) {
  return `${FILES[col]}${8 - row}`;
}

function parseSquare(square) {
  return { row: 8 - Number(square[1]), col: FILES.indexOf(square[0]) };
}

function moveToSanish(move) {
  const piece = state.game.board[move.from.row][move.from.col];
  const pieceName = piece.toLowerCase() === "p" ? "" : piece.toUpperCase();
  const capture = move.captured ? "x" : "";
  const promo = move.promotion ? `=${move.promotion.toUpperCase()}` : "";
  return `${pieceName}${squareName(move.from.row, move.from.col)}${capture}${squareName(move.to.row, move.to.col)}${promo}`;
}

function sameMove(a, b) {
  return a && b && a.from.row === b.from.row && a.from.col === b.from.col && a.to.row === b.to.row && a.to.col === b.to.col && (a.promotion || "") === (b.promotion || "");
}

function addMove(game, moves, from, to, options = {}) {
  if (!inBounds(to.row, to.col)) return;
  const piece = game.board[from.row][from.col];
  const target = game.board[to.row][to.col];
  if (target && colorOf(target) === colorOf(piece)) return;
  moves.push({ from, to, captured: target, ...options });
}

function pseudoMovesFor(game, row, col) {
  const piece = game.board[row][col];
  if (!piece) return [];
  const color = colorOf(piece);
  const type = piece.toLowerCase();
  const moves = [];
  const from = { row, col };

  if (type === "p") {
    const dir = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;
    const promoteRow = color === "w" ? 0 : 7;
    const one = { row: row + dir, col };
    if (inBounds(one.row, one.col) && !game.board[one.row][one.col]) {
      addMove(game, moves, from, one, one.row === promoteRow ? { promotion: color === "w" ? "Q" : "q" } : {});
      const two = { row: row + dir * 2, col };
      if (row === startRow && !game.board[two.row][two.col]) {
        addMove(game, moves, from, two, { doublePawn: true });
      }
    }
    for (const dc of [-1, 1]) {
      const to = { row: row + dir, col: col + dc };
      if (!inBounds(to.row, to.col)) continue;
      const target = game.board[to.row][to.col];
      if (target && colorOf(target) !== color) {
        addMove(game, moves, from, to, to.row === promoteRow ? { promotion: color === "w" ? "Q" : "q" } : {});
      }
      if (game.ep !== "-" && squareName(to.row, to.col) === game.ep) {
        moves.push({ from, to, captured: color === "w" ? "p" : "P", enPassant: true });
      }
    }
  }

  if (type === "n") {
    for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
      addMove(game, moves, from, { row: row + dr, col: col + dc });
    }
  }

  if (["b", "r", "q"].includes(type)) {
    const dirs = [];
    if (["b", "q"].includes(type)) dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    if (["r", "q"].includes(type)) dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    for (const [dr, dc] of dirs) {
      let to = { row: row + dr, col: col + dc };
      while (inBounds(to.row, to.col)) {
        const target = game.board[to.row][to.col];
        if (!target) {
          addMove(game, moves, from, to);
        } else {
          if (colorOf(target) !== color) addMove(game, moves, from, to);
          break;
        }
        to = { row: to.row + dr, col: to.col + dc };
      }
    }
  }

  if (type === "k") {
    for (const dr of [-1, 0, 1]) {
      for (const dc of [-1, 0, 1]) {
        if (dr || dc) addMove(game, moves, from, { row: row + dr, col: col + dc });
      }
    }
    addCastlingMoves(game, moves, row, col, color);
  }

  return moves;
}

function addCastlingMoves(game, moves, row, col, color) {
  const homeRow = color === "w" ? 7 : 0;
  if (row !== homeRow || col !== 4 || game.castling === EMPTY_CASTLING) return;
  const kingSide = color === "w" ? "K" : "k";
  const queenSide = color === "w" ? "Q" : "q";
  if (!game.castling.includes(kingSide) && !game.castling.includes(queenSide)) return;
  if (isInCheck(game, color)) return;

  if (game.castling.includes(kingSide) && !game.board[homeRow][5] && !game.board[homeRow][6]) {
    if (!isSquareAttacked(game, homeRow, 5, opponent(color)) && !isSquareAttacked(game, homeRow, 6, opponent(color))) {
      moves.push({ from: { row, col }, to: { row: homeRow, col: 6 }, castle: "king" });
    }
  }

  if (game.castling.includes(queenSide) && !game.board[homeRow][3] && !game.board[homeRow][2] && !game.board[homeRow][1]) {
    if (!isSquareAttacked(game, homeRow, 3, opponent(color)) && !isSquareAttacked(game, homeRow, 2, opponent(color))) {
      moves.push({ from: { row, col }, to: { row: homeRow, col: 2 }, castle: "queen" });
    }
  }
}

function isSquareAttacked(game, row, col, byColor) {
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const piece = game.board[r][c];
      if (!piece || colorOf(piece) !== byColor) continue;
      const type = piece.toLowerCase();
      if (type === "p") {
        const dir = byColor === "w" ? -1 : 1;
        if (r + dir === row && Math.abs(c - col) === 1) return true;
        continue;
      }
      if (pseudoMovesForAttack(game, r, c).some((move) => move.to.row === row && move.to.col === col)) return true;
    }
  }
  return false;
}

function pseudoMovesForAttack(game, row, col) {
  const copy = { ...game, castling: EMPTY_CASTLING };
  return pseudoMovesFor(copy, row, col).filter((move) => !move.castle);
}

function findKing(game, color) {
  const king = color === "w" ? "K" : "k";
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if (game.board[row][col] === king) return { row, col };
    }
  }
  return null;
}

function isInCheck(game, color) {
  const king = findKing(game, color);
  if (!king) return true;
  return isSquareAttacked(game, king.row, king.col, opponent(color));
}

function legalMoves(game, color = game.turn) {
  const moves = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = game.board[row][col];
      if (!piece || colorOf(piece) !== color) continue;
      for (const move of pseudoMovesFor(game, row, col)) {
        const next = makeMove(game, move);
        if (!isInCheck(next, color)) moves.push(move);
      }
    }
  }
  return moves;
}

function makeMove(game, move) {
  const next = cloneGame(game);
  const piece = next.board[move.from.row][move.from.col];
  next.board[move.from.row][move.from.col] = null;
  next.board[move.to.row][move.to.col] = move.promotion || piece;

  if (move.enPassant) {
    next.board[move.from.row][move.to.col] = null;
  }

  if (move.castle === "king") {
    next.board[move.to.row][5] = next.board[move.to.row][7];
    next.board[move.to.row][7] = null;
  }

  if (move.castle === "queen") {
    next.board[move.to.row][3] = next.board[move.to.row][0];
    next.board[move.to.row][0] = null;
  }

  next.ep = "-";
  if (move.doublePawn) {
    next.ep = squareName((move.from.row + move.to.row) / 2, move.from.col);
  }

  next.castling = updateCastling(next.castling, piece, move);
  next.turn = opponent(game.turn);
  if (next.turn === "w") next.fullmove += 1;
  return next;
}

function updateCastling(castling, piece, move) {
  let rights = castling === EMPTY_CASTLING ? "" : castling;
  const remove = (chars) => {
    for (const char of chars) rights = rights.replace(char, "");
  };
  if (piece === "K") remove("KQ");
  if (piece === "k") remove("kq");
  if (piece === "R" && move.from.row === 7 && move.from.col === 0) remove("Q");
  if (piece === "R" && move.from.row === 7 && move.from.col === 7) remove("K");
  if (piece === "r" && move.from.row === 0 && move.from.col === 0) remove("q");
  if (piece === "r" && move.from.row === 0 && move.from.col === 7) remove("k");
  if (move.to.row === 7 && move.to.col === 0) remove("Q");
  if (move.to.row === 7 && move.to.col === 7) remove("K");
  if (move.to.row === 0 && move.to.col === 0) remove("q");
  if (move.to.row === 0 && move.to.col === 7) remove("k");
  return rights || EMPTY_CASTLING;
}

function evaluate(game) {
  const legal = legalMoves(game, game.turn);
  if (legal.length === 0) {
    if (isInCheck(game, game.turn)) return game.turn === "w" ? -999999 : 999999;
    return 0;
  }

  let score = 0;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = game.board[row][col];
      if (!piece) continue;
      const color = colorOf(piece);
      const type = piece.toLowerCase();
      const index = color === "w" ? row * 8 + col : (7 - row) * 8 + col;
      const pieceScore = VALUES[type] + PST[type][index];
      score += color === "w" ? pieceScore : -pieceScore;
    }
  }
  return score;
}

function search(game, depth, alpha, beta) {
  if (depth === 0) return { score: evaluate(game), move: null };
  const moves = orderMoves(game, legalMoves(game));
  if (moves.length === 0) return { score: evaluate(game), move: null };

  let bestMove = moves[0];
  if (game.turn === "w") {
    let bestScore = -Infinity;
    for (const move of moves) {
      const result = search(makeMove(game, move), depth - 1, alpha, beta).score;
      if (result > bestScore) {
        bestScore = result;
        bestMove = move;
      }
      alpha = Math.max(alpha, result);
      if (beta <= alpha) break;
    }
    return { score: bestScore, move: bestMove };
  }

  let bestScore = Infinity;
  for (const move of moves) {
    const result = search(makeMove(game, move), depth - 1, alpha, beta).score;
    if (result < bestScore) {
      bestScore = result;
      bestMove = move;
    }
    beta = Math.min(beta, result);
    if (beta <= alpha) break;
  }
  return { score: bestScore, move: bestMove };
}

function orderMoves(game, moves) {
  return moves.slice().sort((a, b) => moveScore(game, b) - moveScore(game, a));
}

function moveScore(game, move) {
  const moving = game.board[move.from.row][move.from.col];
  let score = 0;
  if (move.captured) score += VALUES[move.captured.toLowerCase()] - VALUES[moving.toLowerCase()] / 10;
  if (move.promotion) score += VALUES.q;
  if (move.castle) score += 35;
  return score;
}

function computeBestMove() {
  const result = search(state.game, state.depth, -Infinity, Infinity);
  state.bestMove = result.move;
  els.bestMove.textContent = state.bestMove ? `${squareName(state.bestMove.from.row, state.bestMove.from.col)} to ${squareName(state.bestMove.to.row, state.bestMove.to.col)}` : "none";
}

function loadPuzzle(index = state.puzzleIndex) {
  const puzzleSet = currentPuzzleSet();
  if (!puzzleSet.length) {
    setMessage("No missed puzzles to review yet.", "");
    state.reviewMode = false;
    return;
  }
  state.puzzleIndex = (index + puzzleSet.length) % puzzleSet.length;
  const puzzle = puzzleSet[state.puzzleIndex];
  state.game = parseFen(puzzle.fen);
  state.selected = null;
  state.legalTargets = [];
  state.lastMove = null;
  state.attempts = [];
  state.locked = false;
  state.revealSolution = false;
  els.title.textContent = puzzle.name;
  els.meta.textContent = `${state.reviewMode ? "Review mode. " : ""}${puzzle.theme}. ${puzzle.description}`;
  if (els.difficulty) els.difficulty.textContent = puzzle.difficulty;
  if (els.theme) els.theme.textContent = puzzle.tag;
  if (els.solution) els.solution.disabled = false;
  setMessage("Find the best move in this position.", "");
  renderAttempts();
  computeBestMove();
  startTimer();
  updateTrainingStats();
  render();
}

function setMessage(text, type) {
  els.message.textContent = text;
  els.message.className = `message ${type || ""}`;
}

function boardCoordsForIndex(index) {
  const visualRow = Math.floor(index / 8);
  const visualCol = index % 8;
  return state.flipped
    ? { row: 7 - visualRow, col: 7 - visualCol }
    : { row: visualRow, col: visualCol };
}

function render() {
  els.board.innerHTML = "";
  els.score.textContent = state.solved;
  for (let i = 0; i < 64; i += 1) {
    const { row, col } = boardCoordsForIndex(i);
    const square = document.createElement("button");
    square.type = "button";
    square.className = `square ${(row + col) % 2 ? "dark" : "light"}`;
    square.dataset.row = row;
    square.dataset.col = col;
    square.setAttribute("aria-label", squareName(row, col));

    if (state.selected?.row === row && state.selected?.col === col) square.classList.add("selected");
    if (state.lastMove && ((state.lastMove.from.row === row && state.lastMove.from.col === col) || (state.lastMove.to.row === row && state.lastMove.to.col === col))) {
      square.classList.add("last-move");
    }
    if (state.revealSolution && state.bestMove?.from.row === row && state.bestMove?.from.col === col) {
      square.classList.add("solution-from");
    }
    if (state.revealSolution && state.bestMove?.to.row === row && state.bestMove?.to.col === col) {
      square.classList.add("solution-to");
    }
    const legal = state.legalTargets.find((move) => move.to.row === row && move.to.col === col);
    if (legal) square.classList.add(legal.captured ? "capture" : "legal");

    const piece = state.game.board[row][col];
    if (piece) {
      const img = document.createElement("img");
      img.className = "piece";
      img.src = PIECE_IMAGES[piece];
      img.alt = `${colorOf(piece) === "w" ? "White" : "Black"} ${pieceName(piece)}`;
      square.append(img);
    }

    if ((state.flipped ? row === 0 : row === 7) || (state.flipped ? col === 7 : col === 0)) {
      const coord = document.createElement("span");
      coord.className = "coord";
      coord.textContent = coordinateLabel(row, col);
      square.append(coord);
    }

    square.addEventListener("click", () => handleSquareClick(row, col));
    els.board.append(square);
  }
}

function pieceName(piece) {
  return { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" }[piece.toLowerCase()];
}

function coordinateLabel(row, col) {
  const labels = [];
  if (state.flipped ? row === 0 : row === 7) labels.push(FILES[col]);
  if (state.flipped ? col === 7 : col === 0) labels.push(String(8 - row));
  return labels.join("");
}

function handleSquareClick(row, col) {
  if (state.locked || state.finalShown) return;
  const piece = state.game.board[row][col];
  if (state.selected) {
    const chosen = state.legalTargets.find((move) => move.to.row === row && move.to.col === col);
    if (chosen) {
      submitMove(chosen);
      return;
    }
  }

  if (piece && colorOf(piece) === state.game.turn) {
    state.selected = { row, col };
    state.legalTargets = legalMoves(state.game).filter((move) => move.from.row === row && move.from.col === col);
  } else {
    state.selected = null;
    state.legalTargets = [];
  }
  render();
}

function submitMove(move) {
  state.attempts.unshift(moveToSanish(move));
  renderAttempts();
  state.selected = null;
  state.legalTargets = [];
  const movedPiece = state.game.board[move.from.row][move.from.col];
  const isCapture = Boolean(move.captured);

  if (sameMove(move, state.bestMove)) {
    state.game = makeMove(state.game, move);
    state.lastMove = move;
    state.solved += 1;
    state.sessionSolved += 1;
    state.completedCount += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.lifetime.solved += 1;
    state.lifetime.attempted += 1;
    state.lifetime.bestStreak = Math.max(state.lifetime.bestStreak, state.bestStreak);
    state.lifetime.fastest = state.lifetime.fastest === null ? state.elapsed : Math.min(state.lifetime.fastest, state.elapsed);
    saveStoredStats();
    state.locked = true;
    stopTimer();
    updateTrainingStats();
    playSound(isCapture ? "capture" : "move");
    setMessage(`Correct: ${moveToSanish(move)}. Solved in ${formatTime(state.elapsed)}.`, "good");
    els.bestMove.textContent = moveToSanish(move);
    if (els.solution) els.solution.disabled = true;
    render();
    window.setTimeout(() => {
      if (state.completedCount >= currentPuzzleSet().length) {
        showResults();
      } else {
        loadPuzzle(state.puzzleIndex + 1);
      }
    }, 1200);
    return;
  }

  const best = state.bestMove ? moveToSanish(state.bestMove) : "no move";
  state.streak = 0;
  state.completedCount += 1;
  state.lifetime.attempted += 1;
  if (!state.missed.some((puzzle) => puzzle.name === currentPuzzleSet()[state.puzzleIndex].name)) {
    state.missed.push(currentPuzzleSet()[state.puzzleIndex]);
  }
  saveStoredStats();
  state.locked = true;
  state.revealSolution = true;
  stopTimer();
  updateTrainingStats();
  playSound(isCapture ? "capture" : "move");
  setMessage(`Not the best move. Engine preferred ${best}. Look for checks, captures, or threats.`, "bad");
  render();
  if (state.completedCount >= currentPuzzleSet().length) {
    window.setTimeout(showResults, 1200);
  }
}

function renderAttempts() {
  els.attempts.innerHTML = "";
  for (const attempt of state.attempts.slice(0, 8)) {
    const li = document.createElement("li");
    li.textContent = attempt;
    els.attempts.append(li);
  }
}

els.newPuzzle.addEventListener("click", () => loadPuzzle(state.puzzleIndex + 1));
els.flip.addEventListener("click", () => {
  state.flipped = !state.flipped;
  render();
});
els.hint.addEventListener("click", () => {
  if (!state.bestMove) return;
  const from = squareName(state.bestMove.from.row, state.bestMove.from.col);
  setMessage(`Hint: start with the piece on ${from}.`, "");
});
els.depth.addEventListener("input", () => {
  state.depth = Number(els.depth.value);
  els.depthLabel.textContent = state.depth;
  computeBestMove();
});

function revealSolution() {
  if (!state.bestMove) computeBestMove();
  state.revealSolution = true;
  const from = squareName(state.bestMove.from.row, state.bestMove.from.col);
  const to = squareName(state.bestMove.to.row, state.bestMove.to.col);
  els.bestMove.textContent = `${from} to ${to}`;
  setMessage(`Solution: move ${from} to ${to}.`, "");
  render();
}

function skipPuzzle() {
  if (!state.locked) {
    state.completedCount += 1;
    state.streak = 0;
    if (!state.missed.some((puzzle) => puzzle.name === currentPuzzleSet()[state.puzzleIndex].name)) {
      state.missed.push(currentPuzzleSet()[state.puzzleIndex]);
    }
    stopTimer();
  }
  if (state.completedCount >= currentPuzzleSet().length) showResults();
  else loadPuzzle(state.puzzleIndex + 1);
}

async function copyCurrentFen() {
  const fen = currentPuzzleSet()[state.puzzleIndex].fen;
  try {
    await navigator.clipboard.writeText(fen);
    setMessage("FEN copied to clipboard.", "good");
  } catch {
    setMessage(`FEN: ${fen}`, "");
  }
}

function startReviewMode() {
  if (!state.missed.length) {
    setMessage("No missed puzzles yet. Miss one first, then review it here.", "");
    return;
  }
  state.reviewMode = true;
  state.reviewList = state.missed.slice();
  state.completedCount = 0;
  state.sessionSolved = 0;
  state.totalTime = 0;
  state.finalShown = false;
  els.results.classList.add("hidden");
  loadPuzzle(0);
}

function resetLifetimeStats() {
  state.lifetime = { solved: 0, attempted: 0, bestStreak: 0, fastest: null };
  saveStoredStats();
  updateTrainingStats();
  setMessage("Lifetime stats reset.", "");
}

function showResults() {
  state.finalShown = true;
  stopTimer();
  const average = state.sessionSolved ? Math.round(state.totalTime / state.sessionSolved) : 0;
  els.finalSolved.textContent = `${state.sessionSolved} / ${currentPuzzleSet().length}`;
  els.finalBestStreak.textContent = state.bestStreak;
  els.finalAverageTime.textContent = `${average}s`;
  els.finalMissed.textContent = state.missed.length;
  els.results.classList.remove("hidden");
}

function restartTraining() {
  state.solved = 0;
  state.sessionSolved = 0;
  state.completedCount = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.totalTime = 0;
  state.finalShown = false;
  state.reviewMode = false;
  state.reviewList = [];
  els.results.classList.add("hidden");
  loadPuzzle(0);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "n" || event.key === "N") loadPuzzle(state.puzzleIndex + 1);
  if (event.key === "p" || event.key === "P") loadPuzzle(state.puzzleIndex - 1);
  if (event.key === "f" || event.key === "F") {
    state.flipped = !state.flipped;
    render();
  }
  if (event.key === "h" || event.key === "H") els.hint.click();
  if (event.key === "s" || event.key === "S") revealSolution();
  if (event.key === "c" || event.key === "C") copyCurrentFen();
  if (event.key === "Escape") {
    state.selected = null;
    state.legalTargets = [];
    render();
  }
});

loadStoredStats();
injectTrainingUi();
setTheme(state.theme);
loadPuzzle(0);
