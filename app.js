/* ============================================================
   CHESS AI — main.js
   Requires: style.css  +  the HTML structure below in index.html
   Place this file in your repo root (same level as index.html).
   ============================================================

   Expected HTML skeleton (index.html):
   ─────────────────────────────────────
   <link rel="stylesheet" href="style.css">

   <!-- Welcome screen -->
   <div class="welcome-screen" id="welcomeScreen">
     <div class="welcome-card">
       <p class="eyebrow">Chess AI</p>
       <h1>Choose Your Mode</h1>
       <p class="welcome-copy">...</p>
       <div class="welcome-actions">
         <button onclick="startGame('pvc')">Player vs AI</button>
         <button onclick="startGame('pvp')">Player vs Player</button>
       </div>
       <div class="welcome-notes">
         <div><strong>AI Engine</strong><span>Minimax + alpha-beta pruning</span></div>
         <div><strong>Controls</strong><span>Click piece → click square. T = theme. F = flip.</span></div>
         <div><strong>Analysis</strong><span>After losing to the AI you get a full breakdown.</span></div>
       </div>
       <div class="diff-row">
         <label>AI Difficulty:</label>
         <select id="depthSelect">
           <option value="2">Easy</option>
           <option value="3" selected>Medium</option>
           <option value="4">Hard</option>
         </select>
       </div>
     </div>
   </div>

   <!-- Game shell -->
   <div class="game-shell" id="gameShell">
     <div class="board-panel">
       <div class="top-bar">
         <div>
           <p class="eyebrow" id="modeLabel">Player vs AI</p>
           <h2 id="turnLabel">White to move</h2>
         </div>
         <div class="score-box">
           <span class="score-num" id="moveCount">0</span>
           <span class="score-lbl">moves</span>
         </div>
       </div>
       <div class="captured-bar" id="capBlack"></div>
       <div class="board-wrap">
         <div class="board" id="board"></div>
       </div>
       <div class="captured-bar" id="capWhite" style="margin-top:6px"></div>
     </div>

     <div class="side-panel">
       <div class="panel-section">
         <div class="mode-switch">
           <button id="btnPvc" onclick="startGame('pvc')">Vs AI</button>
           <button id="btnPvp" onclick="startGame('pvp')">P vs P</button>
           <button class="gray" onclick="goMenu()">Menu</button>
         </div>
       </div>
       <div class="panel-section">
         <div class="section-label">Status</div>
         <div class="status-text" id="statusMsg">White to move</div>
       </div>
       <div class="panel-section">
         <div class="controls">
           <button class="wide blue" id="hintBtn" onclick="showHint()">💡 Hint</button>
           <button onclick="flipBoard()">↕ Flip</button>
           <button onclick="resetGame()">↺ Reset</button>
           <button class="wide gray" onclick="goMenu()">← Main Menu</button>
         </div>
       </div>
       <div class="panel-section engine-box" id="engineBox">
         <div class="engine-row">
           <span>AI Depth</span>
           <span id="depthLabel">3</span>
         </div>
         <input type="range" id="depthSlider" min="1" max="4" value="3"
                oninput="updateDepth(this.value)">
         <div class="engine-row">
           <span>Theme</span>
           <select id="themeSelect" onchange="setTheme(this.value)">
             <option value="classic">Classic</option>
             <option value="ocean">Ocean</option>
             <option value="graphite">Graphite</option>
             <option value="tournament">Tournament</option>
           </select>
         </div>
       </div>
       <div class="panel-section move-list">
         <div class="section-label">Move History</div>
         <ol id="moveList"></ol>
       </div>
     </div>
   </div>

   <!-- Promotion overlay -->
   <div class="promo-overlay" id="promoOverlay">
     <div class="promo-box">
       <h3>Promote pawn to:</h3>
       <div class="promo-pieces" id="promoPieces"></div>
     </div>
   </div>

   <!-- Post-game analysis modal -->
   <div class="analysis-overlay" id="analysisOverlay">
     <div class="analysis-card">
       <p class="eyebrow" id="analysisEyebrow">Game Over</p>
       <h2 id="analysisTitle">You Lost</h2>
       <p class="analysis-subtitle" id="analysisSubtitle"></p>
       <div class="analysis-grid">
         <div class="analysis-stat"><span>Your moves</span><strong id="statMoves">0</strong></div>
         <div class="analysis-stat"><span>Mistakes</span><strong id="statMistakes">0</strong></div>
         <div class="analysis-stat"><span>Captures</span><strong id="statCaptures">0</strong></div>
         <div class="analysis-stat"><span>Checks given</span><strong id="statChecks">0</strong></div>
         <div class="analysis-stat"><span>Pieces lost</span><strong id="statLost">0</strong></div>
         <div class="analysis-stat"><span>Blunders</span><strong id="statBlunders">0</strong></div>
       </div>
       <div class="analysis-section">
         <h3>Key mistakes</h3>
         <div id="mistakesList"></div>
       </div>
       <div class="analysis-section">
         <h3>Coach tip</h3>
         <div class="coach-tip" id="coachTip"></div>
       </div>
       <div class="analysis-actions">
         <button class="blue" onclick="closeAnalysis(); resetGame()">Play Again</button>
         <button onclick="closeAnalysis(); goMenu()">Main Menu</button>
       </div>
     </div>
   </div>

   <script src="main.js"></script>
   ─────────────────────────────────────
*/

// ═══════════════════════════════════════════════════════════════
//  PIECE ASSETS
//  Tries assets/white_pawn.png etc. first; falls back to Unicode
// ═══════════════════════════════════════════════════════════════
const PIECE_PNG = {
  wP: "assets/white_pawn.png",   wN: "assets/white_knight.png",
  wB: "assets/white_bishop.png", wR: "assets/white_rook.png",
  wQ: "assets/white_queen.png",  wK: "assets/white_king.png",
  bP: "assets/black_pawn.png",   bN: "assets/black_knight.png",
  bB: "assets/black_bishop.png", bR: "assets/black_rook.png",
  bQ: "assets/black_queen.png",  bK: "assets/black_king.png",
};
const PIECE_UNICODE = {
  wP: "♙", wN: "♘", wB: "♗", wR: "♖", wQ: "♕", wK: "♔",
  bP: "♟", bN: "♞", bB: "♝", bR: "♜", bQ: "♛", bK: "♚",
};

// Track which PNG files loaded successfully
const imgLoaded = {};

function preloadImages() {
  Object.entries(PIECE_PNG).forEach(([key, src]) => {
    const img = new Image();
    img.onload  = () => { imgLoaded[key] = true; };
    img.onerror = () => { imgLoaded[key] = false; };
    img.src = src;
  });
}

/**
 * Returns an <img> element if the PNG loaded, otherwise a <span> with Unicode.
 * Attaches an onerror handler so the img swaps to Unicode at render time too.
 */
function makePieceEl(pc) {
  if (imgLoaded[pc] === false) {
    const span = document.createElement("span");
    span.className = "piece-unicode";
    span.textContent = PIECE_UNICODE[pc];
    return span;
  }
  const img = document.createElement("img");
  img.className = "piece-img";
  img.src = PIECE_PNG[pc];
  img.alt = pc;
  img.onerror = () => {
    imgLoaded[pc] = false;
    const span = document.createElement("span");
    span.className = "piece-unicode";
    span.textContent = PIECE_UNICODE[pc];
    img.replaceWith(span);
  };
  return img;
}

// ═══════════════════════════════════════════════════════════════
//  CHESS ENGINE
// ═══════════════════════════════════════════════════════════════
const PIECE_VALUES = { Q: 900, R: 500, B: 330, N: 320, P: 100, K: 20000 };

// Piece-Square Tables (index 0 = a8, index 63 = h1, white's perspective)
const PST = {
  P: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  N: [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,5,5,0,-20,-40,-30,5,10,15,15,10,5,-30,-30,0,15,20,20,15,0,-30,-30,5,15,20,20,15,5,-30,-30,0,10,15,15,10,0,-30,-40,-20,0,0,0,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
  B: [-20,-10,-10,-10,-10,-10,-10,-20,-10,5,0,0,0,0,5,-10,-10,10,10,10,10,10,10,-10,-10,0,10,10,10,10,0,-10,-10,5,5,10,10,5,5,-10,-10,0,5,10,10,5,0,-10,-10,0,0,0,0,0,0,-10,-20,-10,-10,-10,-10,-10,-10,-20],
  R: [0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
  Q: [-20,-10,-10,-5,-5,-10,-10,-20,-10,0,5,0,0,0,0,-10,-10,5,5,5,5,5,0,-10,0,0,5,5,5,5,0,-5,-5,0,5,5,5,5,0,-5,-10,0,5,5,5,5,0,-10,-10,0,0,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
  K: [-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20],
};

function pstScore(type, color, sq) {
  const idx = color === "w" ? sq : 63 - sq;
  return (PST[type] || new Array(64).fill(0))[idx];
}

class ChessGame {
  constructor() { this.reset(); }

  reset() {
    this.board      = this._initBoard();
    this.turn       = "w";
    this.castling   = { wK: true, wQ: true, bK: true, bQ: true };
    this.enPassant  = null;
    this.captured   = { w: [], b: [] }; // captured[color] = pieces THAT color captured
    this.moveLog    = [];               // full history for analysis
    this.gameOver   = false;
    this.winner     = null;
  }

  _initBoard() {
    const b    = new Array(64).fill(null);
    const back = ["R","N","B","Q","K","B","N","R"];
    for (let f = 0; f < 8; f++) {
      b[f]    = "b" + back[f];
      b[8+f]  = "bP";
      b[48+f] = "wP";
      b[56+f] = "w" + back[f];
    }
    return b;
  }

  // ── Helpers ──
  _r(sq)     { return Math.floor(sq / 8); }
  _f(sq)     { return sq % 8; }
  _idx(r, f) { return r * 8 + f; }
  _color(pc) { return pc ? pc[0] : null; }
  _type(pc)  { return pc ? pc[1] : null; }
  _opp(c)    { return c === "w" ? "b" : "w"; }

  // ── Pseudo-legal move generation ──
  _getPseudo(sq, pc, board, ep, cas) {
    const c = this._color(pc), t = this._type(pc);
    const r = this._r(sq),     f = this._f(sq);
    const moves = [];

    const slide = (dr, df) => {
      for (let i = 1; i < 8; i++) {
        const tr = r + i*dr, tf = f + i*df;
        if (tr < 0 || tr > 7 || tf < 0 || tf > 7) break;
        const to  = this._idx(tr, tf);
        const occ = board[to];
        if (this._color(occ) === c) break;
        moves.push(to);
        if (occ) break;
      }
    };

    const step = (dr, df) => {
      const tr = r+dr, tf = f+df;
      if (tr < 0 || tr > 7 || tf < 0 || tf > 7) return;
      const to = this._idx(tr, tf);
      if (this._color(board[to]) !== c) moves.push(to);
    };

    if (t === "P") {
      const dir   = c === "w" ? -1 : 1;
      const start = c === "w" ? 6 : 1;
      const fwd   = this._idx(r + dir, f);
      if (!board[fwd]) {
        moves.push(fwd);
        if (r === start && !board[this._idx(r + 2*dir, f)])
          moves.push(this._idx(r + 2*dir, f));
      }
      for (const df of [-1, 1]) {
        if (f+df < 0 || f+df > 7) continue;
        const cap = this._idx(r+dir, f+df);
        if (this._color(board[cap]) === this._opp(c)) moves.push(cap);
        if (ep !== null && cap === ep)                 moves.push(cap);
      }

    } else if (t === "N") {
      for (const [dr,df] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])
        step(dr, df);

    } else if (t === "B") {
      for (const [dr,df] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr, df);

    } else if (t === "R") {
      for (const [dr,df] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, df);

    } else if (t === "Q") {
      for (const [dr,df] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]])
        slide(dr, df);

    } else if (t === "K") {
      for (const [dr,df] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])
        step(dr, df);
      // Castling
      if (c === "w" && r === 7) {
        if (cas.wK && !board[61] && !board[62]
            && !this.isInCheck("w", board)
            && !this._attacked(61, "b", board)
            && !this._attacked(62, "b", board)) moves.push(62);
        if (cas.wQ && !board[57] && !board[58] && !board[59]
            && !this.isInCheck("w", board)
            && !this._attacked(58, "b", board)
            && !this._attacked(59, "b", board)) moves.push(58);
      }
      if (c === "b" && r === 0) {
        if (cas.bK && !board[5] && !board[6]
            && !this.isInCheck("b", board)
            && !this._attacked(5, "w", board)
            && !this._attacked(6, "w", board))  moves.push(6);
        if (cas.bQ && !board[1] && !board[2] && !board[3]
            && !this.isInCheck("b", board)
            && !this._attacked(2, "w", board)
            && !this._attacked(3, "w", board))  moves.push(2);
      }
    }
    return moves;
  }

  // ── Apply a move, returning [newBoard, piece, capturedPiece, newEp, newCastling] ──
  _applyMove(from, to, board, ep, cas) {
    const b    = [...board];
    const pc   = b[from];
    const c    = this._color(pc), t = this._type(pc);
    let   cap  = b[to];
    let   nEp  = null;
    const nCas = { ...cas };

    // En passant capture
    if (t === "P" && to === ep) {
      const capSq = this._idx(this._r(to) + (c === "w" ? 1 : -1), this._f(to));
      cap = b[capSq];
      b[capSq] = null;
    }

    // Double pawn push → set en passant square
    if (t === "P" && Math.abs(this._r(to) - this._r(from)) === 2)
      nEp = this._idx((this._r(from) + this._r(to)) / 2, this._f(from));

    // Castling: move the rook too
    if (t === "K") {
      if (to - from ===  2) { b[to-1] = b[to+1]; b[to+1] = null; } // kingside
      if (from - to ===  2) { b[to+1] = b[to-2]; b[to-2] = null; } // queenside
      if (c === "w") { nCas.wK = false; nCas.wQ = false; }
      else           { nCas.bK = false; nCas.bQ = false; }
    }

    // Revoke castling rights on rook move / capture
    if (t === "R") {
      if (from === 63) nCas.wK = false;
      if (from === 56) nCas.wQ = false;
      if (from ===  7) nCas.bK = false;
      if (from ===  0) nCas.bQ = false;
    }
    if (cap && this._type(cap) === "R") {
      if (to === 63) nCas.wK = false;
      if (to === 56) nCas.wQ = false;
      if (to ===  7) nCas.bK = false;
      if (to ===  0) nCas.bQ = false;
    }

    b[to]   = b[from];
    b[from] = null;
    return [b, pc, cap, nEp, nCas];
  }

  // ── Check detection ──
  isInCheck(color, board) {
    const kSq = board.findIndex(p => p === color + "K");
    if (kSq === -1) return true;
    return this._attacked(kSq, this._opp(color), board);
  }

  _attacked(sq, byColor, board) {
    for (let s = 0; s < 64; s++) {
      if (this._color(board[s]) !== byColor) continue;
      const pseudo = this._getPseudo(s, board[s], board, null,
                       { wK:false, wQ:false, bK:false, bQ:false });
      if (pseudo.includes(sq)) return true;
    }
    return false;
  }

  // ── Legal moves for a square (filters out moves that leave own king in check) ──
  getLegalMoves(sq) {
    const pc = this.board[sq];
    if (!pc || this._color(pc) !== this.turn) return [];
    return this._getPseudo(sq, pc, this.board, this.enPassant, this.castling)
      .filter(to => {
        const [nb] = this._applyMove(sq, to, this.board, this.enPassant, this.castling);
        return !this.isInCheck(this.turn, nb);
      });
  }

  // ── All legal moves for a color ──
  _getAllLegal(color) {
    const moves = [];
    for (let sq = 0; sq < 64; sq++) {
      if (this._color(this.board[sq]) !== color) continue;
      this._getPseudo(sq, this.board[sq], this.board, this.enPassant, this.castling)
        .forEach(to => {
          const [nb] = this._applyMove(sq, to, this.board, this.enPassant, this.castling);
          if (!this.isInCheck(color, nb)) moves.push([sq, to]);
        });
    }
    return moves;
  }

  // ── Commit a move to game state ──
  makeMove(from, to, promoType = "Q") {
    const [nb, pc, cap, nEp, nCas] =
      this._applyMove(from, to, this.board, this.enPassant, this.castling);
    const t = this._type(pc), c = this._color(pc);

    // Promotion
    if (t === "P" && (this._r(to) === 0 || this._r(to) === 7))
      nb[to] = c + promoType;

    this.board     = nb;
    this.enPassant = nEp;
    this.castling  = nCas;

    if (cap) this.captured[c].push(cap); // the moving color captured this piece

    // Notation
    const files  = "abcdefgh", ranks = "87654321";
    const suffix = (t === "P" && (this._r(to) === 0 || this._r(to) === 7)) ? promoType : "";
    const text   = files[this._f(from)] + ranks[this._r(from)]
                 + files[this._f(to)]   + ranks[this._r(to)] + suffix;

    this.turn = this._opp(this.turn);
    const nowInCheck = this.isInCheck(this.turn, this.board);

    this.moveLog.push({
      text, color: c,
      from, to, capturedPc: cap,
      wasCheck: nowInCheck,
      moveNum: Math.ceil(this.moveLog.length / 2) + 1,
    });

    const legal = this._getAllLegal(this.turn);
    if (legal.length === 0) {
      this.gameOver = true;
      this.winner   = nowInCheck ? this._opp(this.turn) : null;
    }

    return { from, to, cap, check: nowInCheck };
  }

  // ── Static evaluation (positive = white is better) ──
  _evaluate(board) {
    let score = 0;
    for (let sq = 0; sq < 64; sq++) {
      const pc = board[sq];
      if (!pc) continue;
      const c = this._color(pc), t = this._type(pc);
      const v = (PIECE_VALUES[t] || 0) + pstScore(t, c, sq);
      score  += c === "w" ? v : -v;
    }
    return score;
  }

  // ── Minimax with alpha-beta pruning ──
  _minimax(board, depth, alpha, beta, maximizing, ep, cas) {
    const color = maximizing ? "w" : "b";
    const moves = [];

    for (let sq = 0; sq < 64; sq++) {
      if (this._color(board[sq]) !== color) continue;
      this._getPseudo(sq, board[sq], board, ep, cas).forEach(to => {
        const [nb,,, nEp, nC] = this._applyMove(sq, to, board, ep, cas);
        if (!this.isInCheck(color, nb)) moves.push([sq, to, nb, nEp, nC]);
      });
    }

    if (moves.length === 0)
      return this.isInCheck(color, board) ? (maximizing ? -20000 : 20000) : 0;
    if (depth === 0)
      return this._evaluate(board);

    if (maximizing) {
      let best = -Infinity;
      for (const [,, nb, nEp, nC] of moves) {
        const sc = this._minimax(nb, depth-1, alpha, beta, false, nEp, nC);
        if (sc > best) best = sc;
        if (sc > alpha) alpha = sc;
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const [,, nb, nEp, nC] of moves) {
        const sc = this._minimax(nb, depth-1, alpha, beta, true, nEp, nC);
        if (sc < best) best = sc;
        if (sc < beta) beta = sc;
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  // ── AI: return [fromSq, toSq] for the best move ──
  getBestMove(depth) {
    const color      = this.turn;
    const maximizing = color === "w";
    let best         = maximizing ? -Infinity : Infinity;
    let bestMove     = null;
    const moves      = [];

    for (let sq = 0; sq < 64; sq++) {
      if (this._color(this.board[sq]) !== color) continue;
      this._getPseudo(sq, this.board[sq], this.board, this.enPassant, this.castling)
        .forEach(to => {
          const [nb,,, nEp, nC] =
            this._applyMove(sq, to, this.board, this.enPassant, this.castling);
          if (!this.isInCheck(color, nb)) moves.push([sq, to, nb, nEp, nC]);
        });
    }

    moves.sort(() => Math.random() - 0.5); // shuffle for variety at equal scores

    for (const [sq, to, nb, nEp, nC] of moves) {
      const sc = this._minimax(nb, depth-1, -Infinity, Infinity, !maximizing, nEp, nC);
      if ((maximizing && sc > best) || (!maximizing && sc < best)) {
        best     = sc;
        bestMove = [sq, to];
      }
    }
    return bestMove;
  }
}

// ═══════════════════════════════════════════════════════════════
//  POST-GAME ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Walks through moveLog and identifies:
 *  - Blunders / mistakes: player moved, then AI captured something valuable next turn
 *  - Hanging pieces left undefended
 *  - Basic opening stats
 */
function buildAnalysis(game, playerColor) {
  const playerMoves = game.moveLog.filter(m => m.color === playerColor);
  const captures    = playerMoves.filter(m => m.capturedPc);
  const checksGiven = playerMoves.filter(m => m.wasCheck);
  const piecesLost  = game.captured[game._opp(playerColor)]; // what the AI captured

  const PIECE_NAME  = { P:"Pawn", N:"Knight", B:"Bishop", R:"Rook", Q:"Queen", K:"King" };
  const FILES       = "abcdefgh", RANKS = "87654321";
  const sqName      = sq => FILES[sq%8] + RANKS[Math.floor(sq/8)];

  const mistakes = [];

  // For each player move, look at the very next move (the opponent's reply)
  for (let i = 0; i < game.moveLog.length - 1; i++) {
    const mv   = game.moveLog[i];
    const next = game.moveLog[i + 1];
    if (mv.color !== playerColor) continue;
    if (!next || !next.capturedPc)  continue;

    const val      = PIECE_VALUES[next.capturedPc[1]] || 0;
    const lostName = PIECE_NAME[next.capturedPc[1]] || next.capturedPc[1];

    if (val >= 100) {
      mistakes.push({
        moveNum:  mv.moveNum,
        move:     mv.text,
        lostPc:   lostName,
        lostVal:  val,
        from:     sqName(mv.from),
        to:       sqName(mv.to),
        aiReply:  next.text,
        severity: val >= 500 ? "blunder" : "mistake",
        note: `After ${sqName(mv.from)}–${sqName(mv.to)} the AI replied ${next.text}, `
            + `winning your ${lostName} (${val} pts).`,
      });
    }
  }

  const blunders = mistakes.filter(m => m.severity === "blunder");

  // Coach tips — pick the most relevant one
  const tips = [];
  if (blunders.length >= 2)
    tips.push("Multiple blunders lost the game. Before every move ask: 'Is my piece safe there?'");
  else if (blunders.length === 1)
    tips.push(`The decisive mistake was move ${blunders[0].moveNum}. `
            + `Losing your ${blunders[0].lostPc} let the AI take control.`);
  if (piecesLost.length > captures.length + 1)
    tips.push("You lost more material than you gained. Try to trade equal pieces or avoid unnecessary exchanges.");
  if (checksGiven.length === 0)
    tips.push("You never put the AI in check. Aggressive play and forcing moves can keep the opponent under pressure.");
  if (playerMoves.length < 12)
    tips.push("The game ended quickly — focus on opening principles: control the centre, develop knights and bishops before moving the same piece twice.");
  if (tips.length === 0)
    tips.push("You played a tough game! Keep working on piece coordination and always double-check for hanging pieces before moving.");

  return {
    totalMoves: playerMoves.length,
    mistakes,
    blunders:   blunders.length,
    captures:   captures.length,
    checksGiven: checksGiven.length,
    piecesLost: piecesLost.length,
    tip: tips[0],
  };
}

function showAnalysis(humanLost) {
  const playerColor = "w"; // player is always white vs AI in this implementation
  const analysis    = buildAnalysis(game, playerColor);

  document.getElementById("analysisEyebrow").textContent  = "Game Over";
  document.getElementById("analysisTitle").textContent    =
    humanLost ? "You Lost" : game.winner === null ? "It's a Draw 🤝" : "You Won! 🎉";
  document.getElementById("analysisSubtitle").textContent =
    humanLost ? "Here's what the AI found in your game — learn from each mistake."
               : game.winner === null ? "The game ended in stalemate."
               : "Great game! Here's your performance summary.";

  document.getElementById("statMoves").textContent    = analysis.totalMoves;
  document.getElementById("statMistakes").textContent = analysis.mistakes.length;
  document.getElementById("statCaptures").textContent = analysis.captures;
  document.getElementById("statChecks").textContent   = analysis.checksGiven;
  document.getElementById("statLost").textContent     = analysis.piecesLost;
  document.getElementById("statBlunders").textContent = analysis.blunders;

  const list = document.getElementById("mistakesList");
  list.innerHTML = "";

  if (analysis.mistakes.length === 0) {
    list.innerHTML =
      '<p style="color:var(--success);font-weight:700;font-size:0.9rem">No major mistakes detected — solid game!</p>';
  } else {
    analysis.mistakes.slice(0, 6).forEach(m => {
      const div       = document.createElement("div");
      div.className   = "mistake-item";
      const badge     = m.severity === "blunder"
        ? `<span style="color:var(--danger);font-size:0.7rem;font-weight:800;text-transform:uppercase;margin-left:6px">Blunder</span>`
        : `<span style="color:#b06a00;font-size:0.7rem;font-weight:800;text-transform:uppercase;margin-left:6px">Mistake</span>`;
      div.innerHTML   =
        `<span class="move-label">Move ${m.moveNum}:</span> `
        + `<span class="move-notation">${m.move}</span>${badge}<br>`
        + `<span class="mistake-note">${m.note}</span>`;
      list.appendChild(div);
    });
  }

  document.getElementById("coachTip").textContent = analysis.tip;
  document.getElementById("analysisOverlay").classList.add("show");
}

function closeAnalysis() {
  document.getElementById("analysisOverlay").classList.remove("show");
}

// ═══════════════════════════════════════════════════════════════
//  BOARD THEME COLORS
// ═══════════════════════════════════════════════════════════════
const BOARD_THEME_COLORS = {
  classic:    { light: "#e7d7b8", dark: "#6f8a67" },
  ocean:      { light: "#d9edf4", dark: "#4f7cac" },
  graphite:   { light: "#d7d9d7", dark: "#656d69" },
  tournament: { light: "#f0d9b5", dark: "#b58863" },
};

// ═══════════════════════════════════════════════════════════════
//  UI STATE
// ═══════════════════════════════════════════════════════════════
let game         = new ChessGame();
let mode         = "pvc";
let aiDepth      = 3;
let selectedSq   = null;
let legalMoveSqs = [];
let lastMove     = null;
let flipped      = false;
let aiThinking   = false;
let hintSq       = null;
let currentTheme = "classic";

// ── Helpers ──
function sqToVis(sq) {
  if (!flipped) return sq;
  return (7 - Math.floor(sq/8)) * 8 + (7 - sq%8);
}
function visToSq(vis) {
  if (!flipped) return vis;
  return (7 - Math.floor(vis/8)) * 8 + (7 - vis%8);
}

// ── PUBLIC API CALLED FROM HTML ──

function setTheme(t) {
  currentTheme = t;
  document.body.dataset.theme = t;
  const sel = document.getElementById("themeSelect");
  if (sel) sel.value = t;
  renderBoard();
}

function updateDepth(v) {
  aiDepth = parseInt(v);
  const lbl = document.getElementById("depthLabel");
  if (lbl) lbl.textContent = v;
  // Also sync the welcome screen selector if present
  const ws = document.getElementById("depthSelect");
  if (ws) ws.value = v;
}

function goMenu() {
  document.getElementById("gameShell").classList.remove("visible");
  document.getElementById("welcomeScreen").classList.remove("hidden");
  aiThinking = false;
}

function startGame(m) {
  mode    = m;
  aiDepth = parseInt(document.getElementById("depthSelect")?.value || 3);

  const slider = document.getElementById("depthSlider");
  if (slider) { slider.value = aiDepth; }
  const lbl = document.getElementById("depthLabel");
  if (lbl) lbl.textContent = aiDepth;

  game.reset();
  selectedSq = null; legalMoveSqs = [];
  lastMove   = null; flipped      = false;
  aiThinking = false; hintSq      = null;

  document.getElementById("welcomeScreen").classList.add("hidden");
  document.getElementById("gameShell").classList.add("visible");

  const modeLabel = document.getElementById("modeLabel");
  if (modeLabel) modeLabel.textContent = m === "pvp" ? "Player vs Player" : "Player vs AI";

  const btnPvc = document.getElementById("btnPvc");
  const btnPvp = document.getElementById("btnPvp");
  if (btnPvc) btnPvc.classList.toggle("active", m === "pvc");
  if (btnPvp) btnPvp.classList.toggle("active", m === "pvp");

  const engineBox = document.getElementById("engineBox");
  if (engineBox) engineBox.style.display = m === "pvc" ? "grid" : "none";

  const hintBtn = document.getElementById("hintBtn");
  if (hintBtn) hintBtn.disabled = m !== "pvc";

  buildBoard();
  renderBoard();
  setStatus("White to move", "");
  updateMoveList();
}

function resetGame() { startGame(mode); }

function flipBoard() {
  flipped = !flipped;
  buildBoard();
  renderBoard();
}

function showHint() {
  if (mode !== "pvc" || game.gameOver || aiThinking) return;
  const mv = game.getBestMove(Math.min(aiDepth, 2));
  if (!mv) return;
  hintSq       = mv[0];
  selectedSq   = null;
  legalMoveSqs = [];
  renderBoard();
  setStatus("Hint: move the highlighted piece.", "");
  setTimeout(() => { hintSq = null; renderBoard(); }, 2200);
}

// ── BOARD DOM ──

function buildBoard() {
  const bd     = document.getElementById("board");
  bd.innerHTML = "";
  const colors = BOARD_THEME_COLORS[currentTheme];
  const FILES  = "abcdefgh", RANKS = "87654321";

  for (let vis = 0; vis < 64; vis++) {
    const sq      = visToSq(vis);
    const r       = Math.floor(sq/8), f = sq%8;
    const isLight = (r + f) % 2 === 0;

    const div               = document.createElement("div");
    div.className           = "square";
    div.style.backgroundColor = isLight ? colors.light : colors.dark;
    div.dataset.sq          = sq;
    div.dataset.light       = isLight ? "1" : "0";

    // Coordinate labels on the first rank and a-file
    const showRank = flipped ? f === 7 : f === 0;
    const showFile = flipped ? r === 0 : r === 7;
    if (showRank || showFile) {
      const coord       = document.createElement("span");
      coord.className   = "coord-label" + (isLight ? "" : " on-dark");
      coord.textContent = (showRank ? RANKS[r] : "") + (showFile ? FILES[f] : "");
      div.appendChild(coord);
    }

    div.addEventListener("click", () => handleClick(parseInt(div.dataset.sq)));
    bd.appendChild(div);
  }
}

function renderBoard() {
  const colors   = BOARD_THEME_COLORS[currentTheme];
  const inCheck  = game.isInCheck(game.turn, game.board);
  const squares  = document.getElementById("board").querySelectorAll(".square");

  squares.forEach(div => {
    const sq      = parseInt(div.dataset.sq);
    const isLight = div.dataset.light === "1";

    // Reset background
    div.style.backgroundColor = isLight ? colors.light : colors.dark;

    // Remove all state classes
    div.classList.remove("selected", "last-move", "in-check", "hint-sq", "legal-dot", "legal-cap");

    // Remove old piece elements (keep .coord-label)
    div.querySelectorAll(".piece-img, .piece-unicode").forEach(el => el.remove());

    // Apply state classes
    if (selectedSq === sq)                                    div.classList.add("selected");
    if (hintSq !== null && sq === hintSq)                     div.classList.add("hint-sq");
    if (lastMove && (sq === lastMove.from || sq === lastMove.to)) div.classList.add("last-move");
    if (inCheck && game.board[sq] === game.turn + "K")        div.classList.add("in-check");
    if (legalMoveSqs.includes(sq))
      div.classList.add(game.board[sq] ? "legal-cap" : "legal-dot");

    // Render piece
    const pc = game.board[sq];
    if (pc) div.appendChild(makePieceEl(pc));
  });

  // Move count
  const mc = document.getElementById("moveCount");
  if (mc) mc.textContent = game.moveLog.length;

  if (!game.gameOver) {
    const check = inCheck ? " — CHECK ⚠️" : "";
    setStatus(
      aiThinking ? "AI thinking…"
                 : (game.turn === "w" ? "White" : "Black") + " to move" + check,
      ""
    );
  }

  renderCaptured();
}

function renderCaptured() {
  const cb = document.getElementById("capBlack");
  const cw = document.getElementById("capWhite");
  if (!cb || !cw) return;

  cb.innerHTML = '<span style="margin-right:4px;font-size:0.72rem;font-weight:700;color:var(--muted)">Captured by Black:</span>';
  cw.innerHTML = '<span style="margin-right:4px;font-size:0.72rem;font-weight:700;color:var(--muted)">Captured by White:</span>';

  // game.captured[c] = pieces that COLOR c captured
  game.captured.w.forEach(p => {
    const s = document.createElement("span");
    s.className   = "cp";
    s.textContent = PIECE_UNICODE[p] || p;
    cw.appendChild(s);
  });
  game.captured.b.forEach(p => {
    const s = document.createElement("span");
    s.className   = "cp";
    s.textContent = PIECE_UNICODE[p] || p;
    cb.appendChild(s);
  });
}

function updateMoveList() {
  const ol = document.getElementById("moveList");
  if (!ol) return;
  ol.innerHTML = "";
  for (let i = 0; i < game.moveLog.length; i += 2) {
    const li  = document.createElement("li");
    const wm  = game.moveLog[i];
    const bm  = game.moveLog[i+1];
    li.textContent = `${Math.floor(i/2)+1}. ${wm.text}${bm ? "  " + bm.text : ""}`;
    ol.appendChild(li);
  }
  ol.parentElement.scrollTop = ol.scrollHeight;
}

function setStatus(text, cls) {
  const el = document.getElementById("statusMsg");
  if (!el) return;
  el.textContent = text;
  el.className   = "status-text " + (cls || "");
}

// ── CLICK HANDLER ──
function handleClick(sq) {
  if (game.gameOver || aiThinking)            return;
  if (mode === "pvc" && game.turn === "b")    return;

  hintSq = null; // clear any hint highlight

  if (selectedSq === null) {
    // First click: select a piece
    if (game.board[sq] && game._color(game.board[sq]) === game.turn) {
      selectedSq   = sq;
      legalMoveSqs = game.getLegalMoves(sq);
      renderBoard();
    }
  } else {
    if (legalMoveSqs.includes(sq)) {
      // Second click: make the move
      doMove(selectedSq, sq);
    } else if (game.board[sq] && game._color(game.board[sq]) === game.turn) {
      // Re-select a different piece
      selectedSq   = sq;
      legalMoveSqs = game.getLegalMoves(sq);
      renderBoard();
    } else {
      // Clicked empty/enemy without a legal move → deselect
      selectedSq   = null;
      legalMoveSqs = [];
      renderBoard();
    }
  }
}

// ── MOVE EXECUTION ──
function doMove(from, to, promoType) {
  const t      = game._type(game.board[from]);
  const toRank = Math.floor(to / 8);

  // Pawn promotion: show picker
  if (t === "P" && (toRank === 0 || toRank === 7) && !promoType) {
    showPromo(from, to, game.turn);
    return;
  }

  game.makeMove(from, to, promoType || "Q");
  lastMove     = { from, to };
  selectedSq   = null;
  legalMoveSqs = [];
  hintSq       = null;

  updateMoveList();
  renderBoard();

  if (game.gameOver) {
    handleGameOver();
    return;
  }

  if (mode === "pvc" && game.turn === "b") {
    aiThinking = true;
    setStatus("AI thinking…", "");
    setTimeout(doAI, 90);
  }
}

function doAI() {
  const mv = game.getBestMove(aiDepth);
  aiThinking = false;
  if (mv) {
    game.makeMove(mv[0], mv[1]);
    lastMove = { from: mv[0], to: mv[1] };
  }
  updateMoveList();
  renderBoard();
  if (game.gameOver) handleGameOver();
}

function handleGameOver() {
  let txt, cls;
  if (game.winner) {
    txt = (game.winner === "w" ? "White" : "Black") + " wins by checkmate! 🎉";
    cls = "good";
  } else {
    txt = "Stalemate — Draw 🤝";
    cls = "";
  }
  setStatus(txt, cls);

  // Show analysis card after a short pause (only in PvAI mode)
  if (mode === "pvc") {
    const humanLost = game.winner === "b";
    setTimeout(() => showAnalysis(humanLost), 900);
  }
}

// ── PROMOTION PICKER ──
function showPromo(from, to, color) {
  const pp       = document.getElementById("promoPieces");
  pp.innerHTML   = "";

  ["Q","R","B","N"].forEach(t => {
    const btn       = document.createElement("div");
    btn.className   = "promo-piece";
    const pc        = color + t;

    if (imgLoaded[pc] === false) {
      btn.textContent = PIECE_UNICODE[pc];
    } else {
      const img   = document.createElement("img");
      img.src     = PIECE_PNG[pc];
      img.alt     = pc;
      img.onerror = () => { imgLoaded[pc] = false; img.replaceWith(document.createTextNode(PIECE_UNICODE[pc])); };
      btn.appendChild(img);
    }

    btn.onclick = () => {
      document.getElementById("promoOverlay").classList.remove("show");
      doMove(from, to, t);
    };
    pp.appendChild(btn);
  });

  document.getElementById("promoOverlay").classList.add("show");
}

// ── KEYBOARD SHORTCUTS ──
document.addEventListener("keydown", e => {
  const gameVisible = document.getElementById("gameShell").classList.contains("visible");
  if (!gameVisible) return;

  switch (e.key.toLowerCase()) {
    case "escape":
      selectedSq   = null;
      legalMoveSqs = [];
      hintSq       = null;
      renderBoard();
      break;
    case "t":
      const keys = Object.keys(BOARD_THEME_COLORS);
      setTheme(keys[(keys.indexOf(currentTheme) + 1) % keys.length]);
      break;
    case "f": flipBoard();  break;
    case "h": showHint();   break;
    case "r": goMenu();     break;
  }
});

// ── BOOT ──
preloadImages();
// Board is built when startGame() is called from the welcome screen buttons.
