'use strict';

const PNG = {
  wP:'assets/white_pawn.png', wN:'assets/white_knight.png', wB:'assets/white_bishop.png',
  wR:'assets/white_rook.png', wQ:'assets/white_queen.png', wK:'assets/white_king.png',
  bP:'assets/black_pawn.png', bN:'assets/black_knight.png', bB:'assets/black_bishop.png',
  bR:'assets/black_rook.png', bQ:'assets/black_queen.png', bK:'assets/black_king.png',
};

const UNI = {
  wP:'♙', wN:'♘', wB:'♗', wR:'♖', wQ:'♕', wK:'♔',
  bP:'♟', bN:'♞', bB:'♝', bR:'♜', bQ:'♛', bK:'♚',
};

const imgOk = {};
Object.entries(PNG).forEach(([k, src]) => {
  const img = new Image();
  img.onload = () => { imgOk[k] = true; };
  img.onerror = () => { imgOk[k] = false; };
  img.src = src;
});

function makePiece(pc) {
  const isWhite = pc[0] === 'w';
  const wrap = document.createElement('div');
  wrap.className = `piece ${isWhite ? 'wp' : 'bp'}`;

  if (imgOk[pc] === false) {
    const s = document.createElement('span');
    s.className = 'pu';
    s.textContent = UNI[pc];
    wrap.appendChild(s);
    return wrap;
  }

  const img = document.createElement('img');
  img.src = PNG[pc];
  img.alt = pc;
  img.onerror = () => {
    imgOk[pc] = false;
    const s = document.createElement('span');
    s.className = 'pu';
    s.textContent = UNI[pc];
    img.replaceWith(s);
  };
  wrap.appendChild(img);
  return wrap;
}

const PV = { Q:900, R:500, B:330, N:320, P:100, K:20000 };

const PST = {
  P:[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
  N:[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,5,5,0,-20,-40,-30,5,10,15,15,10,5,-30,-30,0,15,20,20,15,0,-30,-30,5,15,20,20,15,5,-30,-30,0,10,15,15,10,0,-30,-40,-20,0,0,0,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
  B:[-20,-10,-10,-10,-10,-10,-10,-20,-10,5,0,0,0,0,5,-10,-10,10,10,10,10,10,10,-10,-10,0,10,10,10,10,0,-10,-10,5,5,10,10,5,5,-10,-10,0,5,10,10,5,0,-10,-10,0,0,0,0,0,0,-10,-20,-10,-10,-10,-10,-10,-10,-20],
  R:[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
  Q:[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,5,0,0,0,0,-10,-10,5,5,5,5,5,0,-10,0,0,5,5,5,5,0,-5,-5,0,5,5,5,5,0,-5,-10,0,5,5,5,5,0,-10,-10,0,0,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
  K:[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20],
};

function pstV(type, color, sq) {
  return (PST[type] || Array(64).fill(0))[color === 'w' ? sq : 63 - sq];
}

class Chess {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = this.startBoard();
    this.turn = 'w';
    this.cas = { wK:true, wQ:true, bK:true, bQ:true };
    this.ep = null;
    this.cap = { w:[], b:[] };
    this.log = [];
    this.over = false;
    this.winner = null;
  }

  startBoard() {
    const b = Array(64).fill(null);
    const back = ['R','N','B','Q','K','B','N','R'];
    for (let f = 0; f < 8; f++) {
      b[f] = 'b' + back[f];
      b[8 + f] = 'bP';
      b[48 + f] = 'wP';
      b[56 + f] = 'w' + back[f];
    }
    return b;
  }

  row(sq) { return Math.floor(sq / 8); }
  col(sq) { return sq % 8; }
  idx(r, c) { return r * 8 + c; }
  color(pc) { return pc ? pc[0] : null; }
  type(pc) { return pc ? pc[1] : null; }
  opp(c) { return c === 'w' ? 'b' : 'w'; }

  pseudo(sq, pc, board, ep, cas) {
    const c = this.color(pc);
    const t = this.type(pc);
    const r = this.row(sq);
    const f = this.col(sq);
    const mv = [];

    const slide = (dr, df) => {
      for (let k = 1; k < 8; k++) {
        const tr = r + k * dr;
        const tf = f + k * df;
        if (tr < 0 || tr > 7 || tf < 0 || tf > 7) break;
        const to = this.idx(tr, tf);
        if (this.color(board[to]) === c) break;
        mv.push(to);
        if (board[to]) break;
      }
    };

    const step = (dr, df) => {
      const tr = r + dr;
      const tf = f + df;
      if (tr < 0 || tr > 7 || tf < 0 || tf > 7) return;
      const to = this.idx(tr, tf);
      if (this.color(board[to]) !== c) mv.push(to);
    };

    if (t === 'P') {
      const d = c === 'w' ? -1 : 1;
      const start = c === 'w' ? 6 : 1;
      const one = this.idx(r + d, f);

      if (r + d >= 0 && r + d <= 7 && !board[one]) {
        mv.push(one);
        const two = this.idx(r + 2 * d, f);
        if (r === start && !board[two]) mv.push(two);
      }

      for (const df of [-1, 1]) {
        if (f + df < 0 || f + df > 7 || r + d < 0 || r + d > 7) continue;
        const to = this.idx(r + d, f + df);
        if (this.color(board[to]) === this.opp(c)) mv.push(to);
        if (ep !== null && to === ep) mv.push(to);
      }
    }

    if (t === 'N') {
      for (const [dr, df] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) step(dr, df);
    }

    if (t === 'B') for (const d of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(...d);
    if (t === 'R') for (const d of [[-1,0],[1,0],[0,-1],[0,1]]) slide(...d);
    if (t === 'Q') for (const d of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(...d);

    if (t === 'K') {
      for (const d of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) step(...d);

      const hr = c === 'w' ? 7 : 0;
      if (r === hr && f === 4) {
        const kingSide = c === 'w' ? 'wK' : 'bK';
        const queenSide = c === 'w' ? 'wQ' : 'bQ';

        if (
          cas[kingSide] &&
          !board[this.idx(hr,5)] &&
          !board[this.idx(hr,6)] &&
          !this.attacked(this.idx(hr,4), this.opp(c), board) &&
          !this.attacked(this.idx(hr,5), this.opp(c), board) &&
          !this.attacked(this.idx(hr,6), this.opp(c), board)
        ) mv.push(this.idx(hr,6));

        if (
          cas[queenSide] &&
          !board[this.idx(hr,3)] &&
          !board[this.idx(hr,2)] &&
          !board[this.idx(hr,1)] &&
          !this.attacked(this.idx(hr,4), this.opp(c), board) &&
          !this.attacked(this.idx(hr,3), this.opp(c), board) &&
          !this.attacked(this.idx(hr,2), this.opp(c), board)
        ) mv.push(this.idx(hr,2));
      }
    }

    return mv;
  }

  applyMove(from, to, board, ep, cas, promo = 'Q') {
    const b = [...board];
    const pc = b[from];
    const c = this.color(pc);
    const t = this.type(pc);
    let cap = b[to];
    let nEp = null;
    const nCas = { ...cas };

    if (t === 'P' && to === ep) {
      const capSq = this.idx(this.row(to) + (c === 'w' ? 1 : -1), this.col(to));
      cap = b[capSq];
      b[capSq] = null;
    }

    if (t === 'P' && Math.abs(this.row(to) - this.row(from)) === 2) {
      nEp = this.idx((this.row(from) + this.row(to)) / 2, this.col(from));
    }

    if (t === 'K') {
      if (to - from === 2) {
        b[to - 1] = b[to + 1];
        b[to + 1] = null;
      }
      if (from - to === 2) {
        b[to + 1] = b[to - 2];
        b[to - 2] = null;
      }
      nCas[c === 'w' ? 'wK' : 'bK'] = false;
      nCas[c === 'w' ? 'wQ' : 'bQ'] = false;
    }

    if (t === 'R') {
      if (from === 56) nCas.wQ = false;
      if (from === 63) nCas.wK = false;
      if (from === 0) nCas.bQ = false;
      if (from === 7) nCas.bK = false;
    }

    if (cap && this.type(cap) === 'R') {
      if (to === 56) nCas.wQ = false;
      if (to === 63) nCas.wK = false;
      if (to === 0) nCas.bQ = false;
      if (to === 7) nCas.bK = false;
    }

    b[to] = pc;
    b[from] = null;

    if (t === 'P' && (this.row(to) === 0 || this.row(to) === 7)) {
      b[to] = c + promo;
    }

    return [b, cap, nEp, nCas];
  }

  attacked(sq, byColor, board) {
    for (let s = 0; s < 64; s++) {
      if (this.color(board[s]) !== byColor) continue;
      if (this.pseudo(s, board[s], board, null, {wK:false,wQ:false,bK:false,bQ:false}).includes(sq)) return true;
    }
    return false;
  }

  inCheck(color, board) {
    const king = board.findIndex(p => p === color + 'K');
    return king === -1 || this.attacked(king, this.opp(color), board);
  }

  legalMoves(sq) {
    const pc = this.board[sq];
    if (!pc || this.color(pc) !== this.turn) return [];
    return this.pseudo(sq, pc, this.board, this.ep, this.cas).filter(to => {
      const [nb] = this.applyMove(sq, to, this.board, this.ep, this.cas);
      return !this.inCheck(this.turn, nb);
    });
  }

  allLegal(color = this.turn) {
    const moves = [];
    for (let sq = 0; sq < 64; sq++) {
      if (this.color(this.board[sq]) !== color) continue;
      for (const to of this.pseudo(sq, this.board[sq], this.board, this.ep, this.cas)) {
        const [nb] = this.applyMove(sq, to, this.board, this.ep, this.cas);
        if (!this.inCheck(color, nb)) moves.push([sq, to]);
      }
    }
    return moves;
  }

  makeMove(from, to, promo = 'Q') {
    const [nb, cap, nEp, nCas] = this.applyMove(from, to, this.board, this.ep, this.cas, promo);
    const pc = this.board[from];
    const c = this.color(pc);
    const t = this.type(pc);

    this.board = nb;
    this.ep = nEp;
    this.cas = nCas;

    if (cap) this.cap[c].push(cap);
    this.turn = this.opp(this.turn);

    const check = this.inCheck(this.turn, this.board);
    const text = sqName(from) + sqName(to) + (t === 'P' && (this.row(to) === 0 || this.row(to) === 7) ? promo : '');

    this.log.push({
      from,
      to,
      pc,
      cap,
      check,
      color: c,
      text,
      moveNum: Math.ceil(this.log.length / 2) + 1
    });

    const legal = this.allLegal(this.turn);
    if (!legal.length) {
      this.over = true;
      this.winner = check ? this.opp(this.turn) : null;
    }

    return { cap, check };
  }

  evaluate(board = this.board) {
    let score = 0;
    for (let sq = 0; sq < 64; sq++) {
      const pc = board[sq];
      if (!pc) continue;
      const c = this.color(pc);
      const t = this.type(pc);
      const val = (PV[t] || 0) + pstV(t, c, sq);
      score += c === 'w' ? val : -val;
    }
    return score;
  }

  minimax(board, depth, alpha, beta, maximizing, ep, cas) {
    if (depth === 0) return this.evaluate(board);

    const color = maximizing ? 'w' : 'b';
    const moves = [];

    for (let sq = 0; sq < 64; sq++) {
      if (this.color(board[sq]) !== color) continue;
      for (const to of this.pseudo(sq, board[sq], board, ep, cas)) {
        const [nb,, nEp, nCas] = this.applyMove(sq, to, board, ep, cas);
        if (!this.inCheck(color, nb)) moves.push([sq, to, nb, nEp, nCas]);
      }
    }

    if (!moves.length) return this.inCheck(color, board) ? (maximizing ? -99999 : 99999) : 0;

    if (maximizing) {
      let best = -Infinity;
      for (const [, , nb, nEp, nCas] of moves) {
        const s = this.minimax(nb, depth - 1, alpha, beta, false, nEp, nCas);
        best = Math.max(best, s);
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }

    let best = Infinity;
    for (const [, , nb, nEp, nCas] of moves) {
      const s = this.minimax(nb, depth - 1, alpha, beta, true, nEp, nCas);
      best = Math.min(best, s);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  bestMove(depth) {
    const color = this.turn;
    const maximizing = color === 'w';
    const moves = [];

    for (let sq = 0; sq < 64; sq++) {
      if (this.color(this.board[sq]) !== color) continue;
      for (const to of this.pseudo(sq, this.board[sq], this.board, this.ep, this.cas)) {
        const [nb,, nEp, nCas] = this.applyMove(sq, to, this.board, this.ep, this.cas);
        if (!this.inCheck(color, nb)) moves.push([sq, to, nb, nEp, nCas]);
      }
    }

    moves.sort(() => Math.random() - 0.5);

    let best = maximizing ? -Infinity : Infinity;
    let bestMove = null;

    for (const [sq, to, nb, nEp, nCas] of moves) {
      const score = this.minimax(nb, depth - 1, -Infinity, Infinity, !maximizing, nEp, nCas);
      if ((maximizing && score > best) || (!maximizing && score < best)) {
        best = score;
        bestMove = [sq, to];
      }
    }

    return { move: bestMove, score: best };
  }
}

const PUZZLES = [
  {name:'Back Rank Mate',tag:'Checkmate',rating:900,fen:'6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',solution:['d1d8'],desc:'White to move. The black king is trapped on the back rank.',explain:'Rd8# is checkmate. The rook controls the entire back rank and the black king has no escape.'},
  {name:'Knight Fork',tag:'Fork',rating:1150,fen:'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4',solution:['f3e5'],desc:'White to move. Find the knight move that attacks two pieces at once.',explain:'Ne5 attacks important targets and creates a fork.'},
  {name:'Queen Checkmate',tag:'Checkmate',rating:800,fen:'4k3/4Q3/4K3/8/8/8/8/8 w - - 0 1',solution:['e7e8'],desc:'White to move. Deliver checkmate in one.',explain:'Qe8# is checkmate. The king is completely boxed in.'},
  {name:'Promotion Race',tag:'Promotion',rating:950,fen:'8/P5k1/8/8/8/8/6K1/8 w - - 0 1',solution:['a7a8'],desc:'White to move. Promote the pawn to win.',explain:'a8=Q promotes to a queen and wins easily.'},
  {name:'Pin the Knight',tag:'Pin',rating:1050,fen:'r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',solution:['c4b5'],desc:'White to move. Pin the knight to win material.',explain:'Bb5 pins the knight to the king.'},
  {name:'Rook Skewer',tag:'Skewer',rating:1100,fen:'4k3/4r3/8/8/8/8/4R3/4K3 w - - 0 1',solution:['e2e8'],desc:'White to move. Use a skewer to win the rook.',explain:'Re8+ forces the king away, then the rook can be won.'},
  {name:'Smothered King',tag:'Checkmate',rating:1200,fen:'5rk1/5ppp/8/8/8/8/5PPP/5RK1 w - - 0 1',solution:['f1f8'],desc:'White to move. The black king is boxed in.',explain:'Rxf8# is checkmate because Black has no escape.'},
  {name:'Hanging Queen',tag:'Tactic',rating:750,fen:'rnb1kbnr/pppp1ppp/8/4p3/4P1q1/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',solution:['f3g1'],desc:'White to move. Attack the hanging queen.',explain:'Ng1 attacks the queen and wins material.'},
];

let game = new Chess();
let mode = 'pvc';
let aiDepth = 3;
let selSq = null;
let legalSqs = [];
let lastMove = null;
let flipped = false;
let aiThinking = false;
let hintSq = null;
let evalScore = 0;
let pendingTheme = 'classic';
let currentTheme = 'classic';
let puzzleIdx = 0;
let pzGame = null;
let pzSolIdx = 0;
let pzSolved = false;
let welcomeMode = 'pvc';
let evalTimer = null;

const THEMES = {
  classic:{light:'#f0d9b5',dark:'#b58863'},
  ocean:{light:'#d9edf4',dark:'#4f7cac'},
  walnut:{light:'#e8d0a8',dark:'#7a4f2e'},
  green:{light:'#eeeed2',dark:'#769656'},
};

function sqName(sq) {
  return 'abcdefgh'[sq % 8] + '87654321'[Math.floor(sq / 8)];
}

function selectMode(m) {
  welcomeMode = m;
  document.querySelectorAll('.mode-card').forEach(b => b.classList.remove('active'));
  document.getElementById('wm-' + m).classList.add('active');
}

function launchGame() {
  aiDepth = +document.getElementById('diffSelect').value || 3;
  currentTheme = document.getElementById('welcomeTheme').value || 'classic';
  document.getElementById('themeSelect').value = currentTheme;
  document.getElementById('depthSlider').value = aiDepth;
  document.getElementById('depthVal').textContent = aiDepth;
  startGame(welcomeMode);
}

function goMenu() {
  aiThinking = false;
  document.getElementById('gameShell').classList.remove('visible');
  document.getElementById('welcomeScreen').classList.remove('hidden');
}

function switchMode(m) {
  startGame(m);
}

function startGame(m) {
  mode = m;
  game = new Chess();
  selSq = null;
  legalSqs = [];
  lastMove = null;
  flipped = false;
  aiThinking = false;
  hintSq = null;
  evalScore = 0;

  document.getElementById('welcomeScreen').classList.add('hidden');
  document.getElementById('gameShell').classList.add('visible');

  ['tabPvc','tabPvp','tabPuzzle'].forEach(id => document.getElementById(id)?.classList.remove('active'));
  document.getElementById({pvc:'tabPvc',pvp:'tabPvp',puzzle:'tabPuzzle'}[m])?.classList.add('active');

  const isPuzzle = m === 'puzzle';
  document.getElementById('puzzleCard').style.display = isPuzzle ? 'block' : 'none';
  document.getElementById('statusCard').style.display = isPuzzle ? 'none' : 'block';
  document.getElementById('moveCard').style.display = isPuzzle ? 'none' : 'block';
  document.getElementById('evalCard').style.display = m === 'pvc' ? 'block' : 'none';
  document.getElementById('evalBar').style.display = m === 'pvc' ? 'flex' : 'none';
  document.getElementById('engineCard').style.display = m === 'pvc' ? 'block' : 'none';
  document.getElementById('hintBtn').disabled = m !== 'pvc';

  document.getElementById('bottomName').textContent = m === 'pvc' ? 'You (White)' : m === 'pvp' ? 'White' : 'White';
  document.getElementById('topBar').querySelector('.pname').textContent = m === 'pvc' ? 'Chess AI' : 'Black';

  buildBoard();

  if (isPuzzle) loadPuzzle(0);
  else {
    renderBoard();
    setStatus('White to move', '');
    updateMoveList();
    updatePlayerBars();
    if (m === 'pvc') scheduleEval();
  }
}

function resetGame() {
  startGame(mode);
}

function buildBoard() {
  buildCoordLabels();
  const bd = document.getElementById('board');
  bd.innerHTML = '';
  const thm = THEMES[currentTheme] || THEMES.classic;

  for (let vis = 0; vis < 64; vis++) {
    const sq = flipped ? (7 - Math.floor(vis / 8)) * 8 + (7 - vis % 8) : vis;
    const r = Math.floor(sq / 8);
    const f = sq % 8;
    const light = (r + f) % 2 === 0;

    const div = document.createElement('div');
    div.className = 'sq ' + (light ? 'light' : 'dark');
    div.style.background = light ? thm.light : thm.dark;
    div.dataset.sq = sq;
    div.addEventListener('click', () => handleClick(+div.dataset.sq));
    bd.appendChild(div);
  }
}

function buildCoordLabels() {
  const ranks = document.getElementById('rankLabels');
  const files = document.getElementById('fileLabels');
  ranks.innerHTML = '';
  files.innerHTML = '';

  const rs = flipped ? '12345678'.split('') : '87654321'.split('');
  const fs = flipped ? 'hgfedcba'.split('') : 'abcdefgh'.split('');

  rs.forEach(r => {
    const s = document.createElement('span');
    s.textContent = r;
    ranks.appendChild(s);
  });

  fs.forEach(f => {
    const s = document.createElement('span');
    s.textContent = f;
    files.appendChild(s);
  });
}

function setTheme(t) {
  currentTheme = t;
  const thm = THEMES[t] || THEMES.classic;

  document.querySelectorAll('.sq').forEach(div => {
    const sq = +div.dataset.sq;
    const r = Math.floor(sq / 8);
    const f = sq % 8;
    const light = (r + f) % 2 === 0;
    div.style.background = light ? thm.light : thm.dark;
  });
}

function renderBoard() {
  const g = mode === 'puzzle' ? (pzGame || game) : game;
  const chk = g.inCheck(g.turn, g.board);
  const thm = THEMES[currentTheme] || THEMES.classic;

  document.querySelectorAll('.sq').forEach(div => {
    const sq = +div.dataset.sq;
    const r = Math.floor(sq / 8);
    const f = sq % 8;
    const light = (r + f) % 2 === 0;

    div.style.background = light ? thm.light : thm.dark;
    div.classList.remove('sel','last-from','last-to','in-check','hint','legal-move','legal-cap');
    div.querySelectorAll('.piece').forEach(e => e.remove());

    if (selSq === sq) div.classList.add('sel');
    if (hintSq === sq) div.classList.add('hint');
    if (lastMove) {
      if (sq === lastMove.from) div.classList.add('last-from');
      if (sq === lastMove.to) div.classList.add('last-to');
    }
    if (chk && g.board[sq] === g.turn + 'K') div.classList.add('in-check');
    if (legalSqs.includes(sq)) div.classList.add(g.board[sq] ? 'legal-cap' : 'legal-move');

    const pc = g.board[sq];
    if (pc) div.appendChild(makePiece(pc));
  });

  if (mode !== 'puzzle') {
    if (!game.over) {
      const c = game.turn === 'w' ? 'White' : 'Black';
      setStatus(aiThinking ? 'AI thinking…' : `${c} to move${game.inCheck(game.turn, game.board) ? ' — CHECK' : ''}`, '');
    }
    updateMoveList();
    updatePlayerBars();
    if (mode === 'pvc') scheduleEval();
  }
}

function setStatus(t, c) {
  const el = document.getElementById('statusMsg');
  if (!el) return;
  el.textContent = t;
  el.className = 'status-msg ' + (c || '');
}

function updateMoveList() {
  const tbody = document.getElementById('moveList');
  if (!tbody) return;
  tbody.innerHTML = '';

  for (let i = 0; i < game.log.length; i += 2) {
    const tr = document.createElement('tr');
    const n = document.createElement('td');
    const w = document.createElement('td');
    const b = document.createElement('td');

    n.textContent = i / 2 + 1;
    w.className = 'wm';
    w.textContent = game.log[i].text;
    b.className = 'bm';
    b.textContent = game.log[i + 1] ? game.log[i + 1].text : '';

    tr.append(n, w, b);
    tbody.appendChild(tr);
  }
}

function updatePlayerBars() {
  const top = document.getElementById('topBar');
  const bot = document.getElementById('bottomBar');
  if (!top || !bot) return;

  top.classList.toggle('active-turn', game.turn === 'b' && !game.over);
  bot.classList.toggle('active-turn', game.turn === 'w' && !game.over);
}

function scheduleEval() {
  clearTimeout(evalTimer);
  evalTimer = setTimeout(() => {
    if (game.over) {
      renderEval(game.winner === 'w' ? 9999 : game.winner === 'b' ? -9999 : 0);
      return;
    }
    renderEval(game.minimax(game.board, 2, -Infinity, Infinity, true, game.ep, game.cas));
  }, 150);
}

function renderEval(sc) {
  const capped = Math.max(-800, Math.min(800, sc));
  const blackPct = Math.round(50 - (capped / 800) * 45);
  const bar = document.getElementById('evalBlack');

  if (bar) bar.style.height = blackPct + '%';

  const display = Math.abs(sc) >= 9000 ? (sc > 0 ? 'M' : '-M') : (sc >= 0 ? '+' : '') + (sc / 100).toFixed(1);
  document.getElementById('evalNum').textContent = display;
  document.getElementById('evalTopLabel').textContent = sc < 0 ? display : '';
  document.getElementById('evalBotLabel').textContent = sc >= 0 ? display : '';
}

function handleClick(sq) {
  if (mode === 'puzzle') {
    handlePzClick(sq);
    return;
  }

  if (game.over || aiThinking) return;
  if (mode === 'pvc' && game.turn === 'b') return;

  hintSq = null;

  if (selSq === null) {
    if (game.board[sq] && game.color(game.board[sq]) === game.turn) {
      selSq = sq;
      legalSqs = game.legalMoves(sq);
      renderBoard();
    }
    return;
  }

  if (legalSqs.includes(sq)) doMove(selSq, sq);
  else if (game.board[sq] && game.color(game.board[sq]) === game.turn) {
    selSq = sq;
    legalSqs = game.legalMoves(sq);
    renderBoard();
  } else {
    selSq = null;
    legalSqs = [];
    renderBoard();
  }
}

function doMove(from, to, promo) {
  const t = game.type(game.board[from]);
  const rank = Math.floor(to / 8);

  if (t === 'P' && (rank === 0 || rank === 7) && !promo) {
    showPromo(from, to, game.turn);
    return;
  }

  game.makeMove(from, to, promo || 'Q');
  lastMove = { from, to };
  selSq = null;
  legalSqs = [];
  hintSq = null;
  renderBoard();

  if (game.over) {
    handleGameOver();
    return;
  }

  if (mode === 'pvc' && game.turn === 'b') {
    aiThinking = true;
    renderBoard();
    setTimeout(doAI, 80);
  }
}

function doAI() {
  const { move } = game.bestMove(aiDepth);
  aiThinking = false;

  if (move) {
    game.makeMove(move[0], move[1]);
    lastMove = { from: move[0], to: move[1] };
  }

  renderBoard();
  if (game.over) handleGameOver();
}

function handleGameOver() {
  if (game.winner) setStatus(`${game.winner === 'w' ? 'White' : 'Black'} wins by checkmate!`, 'good');
  else setStatus('Stalemate — Draw', '');

  if (mode === 'pvc') setTimeout(() => showAnalysis(game.winner === 'b'), 900);
}

function showHint() {
  if (mode !== 'pvc' || game.over || aiThinking) return;
  const { move } = game.bestMove(2);
  if (!move) return;

  hintSq = move[0];
  selSq = null;
  legalSqs = [];
  renderBoard();
  setStatus('Hint: move the highlighted piece.', 'warn');

  setTimeout(() => {
    hintSq = null;
    renderBoard();
  }, 2200);
}

function flipBoard() {
  flipped = !flipped;
  buildBoard();
  renderBoard();
}

function showPromo(from, to, color) {
  const row = document.getElementById('promoRow');
  row.innerHTML = '';

  ['Q','R','B','N'].forEach(t => {
    const pc = color + t;
    const div = document.createElement('div');
    div.className = 'promo-sq';
    div.appendChild(makePiece(pc));
    div.onclick = () => {
      document.getElementById('promoOverlay').classList.remove('show');
      doMove(from, to, t);
    };
    row.appendChild(div);
  });

  document.getElementById('promoOverlay').classList.add('show');
}

function showAnalysis(humanLost) {
  const pMoves = game.log.filter(m => m.color === 'w');
  const mistakes = [];

  for (let i = 0; i < game.log.length - 1; i++) {
    const mv = game.log[i];
    const next = game.log[i + 1];
    if (mv.color !== 'w' || !next?.cap) continue;

    const val = PV[game.type(next.cap)] || 0;
    if (val >= 100) {
      mistakes.push({
        moveNum: mv.moveNum,
        move: mv.text,
        aiMove: next.text,
        val,
        sev: val >= 500 ? 'blunder' : 'mistake',
        note: `You played ${mv.text}, then the AI replied ${next.text}, winning material worth ${val} points.`
      });
    }
  }

  document.getElementById('aTitle').textContent = humanLost ? 'You Lost' : game.winner ? 'You Won!' : 'Draw';
  document.getElementById('aSub').textContent = humanLost ? 'Here is what the AI noticed in your game.' : 'Summary of your game.';
  document.getElementById('sMoves').textContent = pMoves.length;
  document.getElementById('sMistakes').textContent = mistakes.length;
  document.getElementById('sBlunders').textContent = mistakes.filter(m => m.sev === 'blunder').length;
  document.getElementById('sCaptures').textContent = pMoves.filter(m => m.cap).length;
  document.getElementById('sChecks').textContent = pMoves.filter(m => m.check).length;
  document.getElementById('sLost').textContent = game.cap.b.length;

  const ml = document.getElementById('mistakeList');
  ml.innerHTML = '';

  if (!mistakes.length) {
    ml.innerHTML = '<p style="color:var(--green);font-weight:700;font-size:0.85rem">No major mistakes detected.</p>';
  } else {
    mistakes.slice(0, 6).forEach(m => {
      const d = document.createElement('div');
      d.className = 'mistake-row ' + m.sev;
      d.innerHTML = `<div class="mr-head">Move ${m.moveNum}: <code>${m.move}</code><span class="mr-tag">${m.sev}</span></div><div class="mr-note">${m.note}</div>`;
      ml.appendChild(d);
    });
  }

  document.getElementById('coachTip').textContent =
    mistakes.length ? 'Focus on checking whether your pieces are defended before every move.' :
    'Solid game. Next, practice calculating your opponent’s best reply before moving.';

  document.getElementById('analysisOverlay').classList.add('show');
}

function closeAnalysis() {
  document.getElementById('analysisOverlay').classList.remove('show');
}

function parseFen(fen) {
  const [placement, turn, castling, ep] = fen.split(' ');
  const g = new Chess();
  g.board = Array(64).fill(null);
  g.turn = turn || 'w';
  g.cas = {
    wK: !!castling?.includes('K'),
    wQ: !!castling?.includes('Q'),
    bK: !!castling?.includes('k'),
    bQ: !!castling?.includes('q')
  };

  if (ep && ep !== '-') {
    g.ep = (8 - parseInt(ep[1], 10)) * 8 + 'abcdefgh'.indexOf(ep[0]);
  }

  placement.split('/').forEach((rank, row) => {
    let col = 0;
    for (const ch of rank) {
      if (/\d/.test(ch)) col += parseInt(ch, 10);
      else {
        g.board[row * 8 + col] = (ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase();
        col++;
      }
    }
  });

  return g;
}

function loadPuzzle(idx) {
  pzSolIdx = 0;
  pzSolved = false;
  selSq = null;
  legalSqs = [];
  hintSq = null;
  lastMove = null;
  puzzleIdx = (idx + PUZZLES.length) % PUZZLES.length;

  const pz = PUZZLES[puzzleIdx];
  pzGame = parseFen(pz.fen);

  document.getElementById('pzName').textContent = pz.name;
  document.getElementById('pzTag').textContent = pz.tag;
  document.getElementById('pzRating').textContent = '★ ' + pz.rating;
  document.getElementById('pzDesc').textContent = pz.desc;
  document.getElementById('pzNext').disabled = true;
  setPzFeedback(pz.desc, 'info');
  buildPzProgress(pz);

  flipped = pzGame.turn === 'b';
  buildBoard();
  renderBoard();
}

function buildPzProgress(pz) {
  const el = document.getElementById('pzProgress');
  el.innerHTML = '';
  pz.solution.forEach(() => {
    const d = document.createElement('div');
    d.className = 'pdot';
    el.appendChild(d);
  });
}

function handlePzClick(sq) {
  if (pzSolved) return;

  const saved = game;
  game = pzGame;

  if (selSq === null) {
    if (game.board[sq] && game.color(game.board[sq]) === game.turn) {
      selSq = sq;
      legalSqs = game.legalMoves(sq);
      renderBoard();
    }
    game = saved;
    return;
  }

  if (legalSqs.includes(sq)) {
    const from = selSq;
    const attempt = sqName(from) + sqName(sq);
    const pz = PUZZLES[puzzleIdx];
    const required = pz.solution[pzSolIdx];

    selSq = null;
    legalSqs = [];

    if (attempt === required.slice(0, 4)) {
      game.makeMove(from, sq, required.length === 5 ? required[4].toUpperCase() : 'Q');
      lastMove = { from, to: sq };
      document.querySelectorAll('#pzProgress .pdot')[pzSolIdx]?.classList.add('ok');
      pzSolIdx++;

      if (pzSolIdx >= pz.solution.length) {
        pzSolved = true;
        setPzFeedback('Correct! ' + pz.explain, 'ok');
        document.getElementById('pzNext').disabled = false;
      } else {
        setPzFeedback('Good move. Keep going.', 'ok');
      }
    } else {
      document.querySelectorAll('#pzProgress .pdot')[pzSolIdx]?.classList.add('bad');
      setPzFeedback('Not quite. Try again.', 'bad');
    }

    renderBoard();
  } else if (game.board[sq] && game.color(game.board[sq]) === game.turn) {
    selSq = sq;
    legalSqs = game.legalMoves(sq);
    renderBoard();
  } else {
    selSq = null;
    legalSqs = [];
    renderBoard();
  }

  game = saved;
}

function setPzFeedback(t, c) {
  const el = document.getElementById('pzFeedback');
  el.textContent = t;
  el.className = 'pz-feedback ' + c;
}

function nextPuzzle() { loadPuzzle(puzzleIdx + 1); }
function prevPuzzle() { loadPuzzle(puzzleIdx - 1); }
function retryPuzzle() { loadPuzzle(puzzleIdx); }

function showPuzzleSolution() {
  const pz = PUZZLES[puzzleIdx];
  const sol = pz.solution[0];
  const fromSq = (8 - parseInt(sol[1], 10)) * 8 + 'abcdefgh'.indexOf(sol[0]);
  hintSq = fromSq;
  setPzFeedback('Solution starts with the highlighted piece. ' + pz.explain, 'info');
  renderBoard();
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('gameShell').classList.contains('visible')) return;
  if (e.key === 'Escape') {
    selSq = null;
    legalSqs = [];
    hintSq = null;
    renderBoard();
  }
  if (e.key === 'f' || e.key === 'F') flipBoard();
  if (e.key === 'h' || e.key === 'H') showHint();
  if (e.key === 'r' || e.key === 'R') goMenu();
  if (e.key === 't' || e.key === 'T') {
    const keys = Object.keys(THEMES);
    const t = keys[(keys.indexOf(currentTheme) + 1) % keys.length];
    setTheme(t);
    document.getElementById('themeSelect').value = t;
  }
});
