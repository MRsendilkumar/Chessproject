'use strict';
// ================================================================
//  Chess AI — main.js
//  Features:
//    1. Fully playable chess (PvP + Vs AI)
//    2. Live AI evaluation bar with centipawn score
//    3. Post-game analysis (mistakes, blunders, coach tip)
//    4. Chess.com-style Puzzle mode (mid-game tactics)
//    5. Clear white vs black piece rendering
// ================================================================

// ── PIECE RENDERING ──────────────────────────────────────────────
// Tries PNG assets first; falls back to Unicode with strong visual contrast.
const PIECE_PNG = {
  wP:'assets/white_pawn.png',   wN:'assets/white_knight.png',
  wB:'assets/white_bishop.png', wR:'assets/white_rook.png',
  wQ:'assets/white_queen.png',  wK:'assets/white_king.png',
  bP:'assets/black_pawn.png',   bN:'assets/black_knight.png',
  bB:'assets/black_bishop.png', bR:'assets/black_rook.png',
  bQ:'assets/black_queen.png',  bK:'assets/black_king.png',
};
const PIECE_UNICODE = {
  wP:'♙', wN:'♘', wB:'♗', wR:'♖', wQ:'♕', wK:'♔',
  bP:'♟', bN:'♞', bB:'♝', bR:'♜', bQ:'♛', bK:'♚',
};
const imgOk = {};   // true=loaded, false=failed, undefined=pending

function preload() {
  Object.entries(PIECE_PNG).forEach(([k,src]) => {
    const i = new Image();
    i.onload  = () => { imgOk[k] = true; };
    i.onerror = () => { imgOk[k] = false; };
    i.src = src;
  });
}

function makePieceEl(pc) {
  const color = pc[0]; // 'w' or 'b'
  const wrap  = document.createElement('div');
  wrap.className = 'piece ' + (color === 'w' ? 'white-piece' : 'black-piece');

  if (imgOk[pc] === false) {
    // Confirmed failed → Unicode fallback
    const s = document.createElement('span');
    s.className   = 'piece-unicode';
    s.textContent = PIECE_UNICODE[pc];
    wrap.appendChild(s);
  } else {
    // Optimistic: try PNG, swap to Unicode on error
    const img   = document.createElement('img');
    img.src     = PIECE_PNG[pc];
    img.alt     = pc;
    img.onerror = () => {
      imgOk[pc] = false;
      const s = document.createElement('span');
      s.className   = 'piece-unicode';
      s.textContent = PIECE_UNICODE[pc];
      img.replaceWith(s);
    };
    wrap.appendChild(img);
  }
  return wrap;
}

// ── CHESS ENGINE ─────────────────────────────────────────────────
const PV = { Q:900, R:500, B:330, N:320, P:100, K:20000 };

const PST = {
  P:[ 0, 0, 0, 0, 0, 0, 0, 0,
     50,50,50,50,50,50,50,50,
     10,10,20,30,30,20,10,10,
      5, 5,10,25,25,10, 5, 5,
      0, 0, 0,20,20, 0, 0, 0,
      5,-5,-10,0,0,-10,-5, 5,
      5,10,10,-20,-20,10,10,5,
      0, 0, 0, 0, 0, 0, 0, 0],
  N:[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,5,5,0,-20,-40,-30,5,10,15,15,10,5,-30,-30,0,15,20,20,15,0,-30,-30,5,15,20,20,15,5,-30,-30,0,10,15,15,10,0,-30,-40,-20,0,0,0,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
  B:[-20,-10,-10,-10,-10,-10,-10,-20,-10,5,0,0,0,0,5,-10,-10,10,10,10,10,10,10,-10,-10,0,10,10,10,10,0,-10,-10,5,5,10,10,5,5,-10,-10,0,5,10,10,5,0,-10,-10,0,0,0,0,0,0,-10,-20,-10,-10,-10,-10,-10,-10,-20],
  R:[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
  Q:[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,5,0,0,0,0,-10,-10,5,5,5,5,5,0,-10,0,0,5,5,5,5,0,-5,-5,0,5,5,5,5,0,-5,-10,0,5,5,5,5,0,-10,-10,0,0,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
  K:[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20],
};

function pst(type, color, sq) {
  return (PST[type] || new Array(64).fill(0))[color==='w' ? sq : 63-sq];
}

class Chess {
  constructor() { this.reset(); }

  reset() {
    this.board    = this._start();
    this.turn     = 'w';
    this.cas      = {wK:true,wQ:true,bK:true,bQ:true};
    this.ep       = null;
    this.cap      = {w:[],b:[]};   // pieces captured BY that color
    this.log      = [];            // move records
    this.over     = false;
    this.winner   = null;
  }

  _start() {
    const b = Array(64).fill(null);
    const back = ['R','N','B','Q','K','B','N','R'];
    for (let f=0;f<8;f++) {
      b[f]=`b${back[f]}`; b[8+f]='bP';
      b[48+f]='wP'; b[56+f]=`w${back[f]}`;
    }
    return b;
  }

  r(sq)  { return Math.floor(sq/8); }
  f(sq)  { return sq%8; }
  i(r,f) { return r*8+f; }
  c(pc)  { return pc?pc[0]:null; }
  t(pc)  { return pc?pc[1]:null; }
  opp(c) { return c==='w'?'b':'w'; }

  pseudo(sq, pc, board, ep, cas) {
    const c=this.c(pc), tp=this.t(pc), r=this.r(sq), f=this.f(sq);
    const mv=[];

    const slide=(dr,df)=>{
      for(let k=1;k<8;k++){
        const tr=r+k*dr, tf=f+k*df;
        if(tr<0||tr>7||tf<0||tf>7) break;
        const to=this.i(tr,tf);
        if(this.c(board[to])===c) break;
        mv.push(to);
        if(board[to]) break;
      }
    };
    const step=(dr,df)=>{
      const tr=r+dr, tf=f+df;
      if(tr<0||tr>7||tf<0||tf>7) return;
      const to=this.i(tr,tf);
      if(this.c(board[to])!==c) mv.push(to);
    };

    if(tp==='P'){
      const d=c==='w'?-1:1, s=c==='w'?6:1;
      const fwd=this.i(r+d,f);
      if(!board[fwd]){
        mv.push(fwd);
        if(r===s&&!board[this.i(r+2*d,f)]) mv.push(this.i(r+2*d,f));
      }
      for(const df of[-1,1]){
        if(f+df<0||f+df>7) continue;
        const to=this.i(r+d,f+df);
        if(this.c(board[to])===this.opp(c)) mv.push(to);
        if(ep!==null&&to===ep) mv.push(to);
      }
    } else if(tp==='N'){
      for(const[dr,df] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) step(dr,df);
    } else if(tp==='B'){
      for(const[dr,df] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr,df);
    } else if(tp==='R'){
      for(const[dr,df] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,df);
    } else if(tp==='Q'){
      for(const[dr,df] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,df);
    } else if(tp==='K'){
      for(const[dr,df] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) step(dr,df);
      const hr=c==='w'?7:0;
      if(r===hr&&f===4){
        const kk=c==='w'?'wK':'bK', qq=c==='w'?'wQ':'bQ';
        if(cas[kk]&&!board[this.i(hr,5)]&&!board[this.i(hr,6)]
           &&!this.attacked(this.i(hr,4),this.opp(c),board)
           &&!this.attacked(this.i(hr,5),this.opp(c),board)
           &&!this.attacked(this.i(hr,6),this.opp(c),board)) mv.push(this.i(hr,6));
        if(cas[qq]&&!board[this.i(hr,3)]&&!board[this.i(hr,2)]&&!board[this.i(hr,1)]
           &&!this.attacked(this.i(hr,4),this.opp(c),board)
           &&!this.attacked(this.i(hr,3),this.opp(c),board)
           &&!this.attacked(this.i(hr,2),this.opp(c),board)) mv.push(this.i(hr,2));
      }
    }
    return mv;
  }

  apply(from, to, board, ep, cas, promo='Q') {
    const b=[...board], pc=b[from], c=this.c(pc), tp=this.t(pc);
    let cap=b[to], nEp=null;
    const nCas={...cas};
    // en passant capture
    if(tp==='P'&&to===ep){ const cSq=this.i(this.r(to)+(c==='w'?1:-1),this.f(to)); cap=b[cSq]; b[cSq]=null; }
    // double push
    if(tp==='P'&&Math.abs(this.r(to)-this.r(from))===2) nEp=this.i((this.r(from)+this.r(to))/2,this.f(from));
    // castling rook
    if(tp==='K'){
      if(to-from===2){ b[to-1]=b[to+1]; b[to+1]=null; }
      if(from-to===2){ b[to+1]=b[to-2]; b[to-2]=null; }
      nCas[c==='w'?'wK':'bK']=false; nCas[c==='w'?'wQ':'bQ']=false;
    }
    if(tp==='R'){
      if(from===56) nCas.wQ=false; if(from===63) nCas.wK=false;
      if(from===0)  nCas.bQ=false; if(from===7)  nCas.bK=false;
    }
    if(cap&&this.t(cap)==='R'){
      if(to===56) nCas.wQ=false; if(to===63) nCas.wK=false;
      if(to===0)  nCas.bQ=false; if(to===7)  nCas.bK=false;
    }
    b[to]=pc; b[from]=null;
    if(tp==='P'&&(this.r(to)===0||this.r(to)===7)) b[to]=c+promo;
    return [b, cap, nEp, nCas];
  }

  attacked(sq, byColor, board) {
    for(let s=0;s<64;s++){
      if(this.c(board[s])!==byColor) continue;
      if(this.pseudo(s,board[s],board,null,{wK:false,wQ:false,bK:false,bQ:false}).includes(sq)) return true;
    }
    return false;
  }

  inCheck(color, board) {
    const k=board.findIndex(p=>p===color+'K');
    return k===-1||this.attacked(k,this.opp(color),board);
  }

  legal(sq) {
    const pc=this.board[sq];
    if(!pc||this.c(pc)!==this.turn) return [];
    return this.pseudo(sq,pc,this.board,this.ep,this.cas).filter(to=>{
      const[nb]=this.apply(sq,to,this.board,this.ep,this.cas);
      return !this.inCheck(this.turn,nb);
    });
  }

  allLegal(color=this.turn) {
    const mv=[];
    for(let sq=0;sq<64;sq++){
      if(this.c(this.board[sq])!==color) continue;
      this.pseudo(sq,this.board[sq],this.board,this.ep,this.cas).forEach(to=>{
        const[nb]=this.apply(sq,to,this.board,this.ep,this.cas);
        if(!this.inCheck(color,nb)) mv.push([sq,to]);
      });
    }
    return mv;
  }

  move(from, to, promo='Q') {
    const [nb, cap, nEp, nCas] = this.apply(from,to,this.board,this.ep,this.cas,promo);
    const pc=this.board[from], c=this.c(pc), tp=this.t(pc);
    this.board=nb; this.ep=nEp; this.cas=nCas;
    if(cap) this.cap[c].push(cap);
    this.turn=this.opp(this.turn);
    const check=this.inCheck(this.turn,this.board);
    const F='abcdefgh', R='87654321';
    const suffix=tp==='P'&&(this.r(to)===0||this.r(to)===7)?promo:'';
    this.log.push({ from,to,pc,cap,check,color:c,
      text:F[this.f(from)]+R[this.r(from)]+F[this.f(to)]+R[this.r(to)]+suffix,
      moveNum: Math.ceil(this.log.length/2)+1 });
    const legal=this.allLegal(this.turn);
    if(!legal.length){ this.over=true; this.winner=check?this.opp(this.turn):null; }
    return {cap,check};
  }

  eval(board=this.board) {
    let sc=0;
    for(let sq=0;sq<64;sq++){
      const pc=board[sq]; if(!pc) continue;
      const c=this.c(pc), tp=this.t(pc);
      const v=(PV[tp]||0)+pst(tp,c,sq);
      sc+=c==='w'?v:-v;
    }
    return sc;
  }

  // Minimax with alpha-beta
  minimax(board,depth,alpha,beta,max,ep,cas) {
    const color=max?'w':'b', mv=[];
    for(let sq=0;sq<64;sq++){
      if(this.c(board[sq])!==color) continue;
      this.pseudo(sq,board[sq],board,ep,cas).forEach(to=>{
        const[nb,,nEp,nC]=this.apply(sq,to,board,ep,cas);
        if(!this.inCheck(color,nb)) mv.push([sq,to,nb,nEp,nC]);
      });
    }
    if(!mv.length) return this.inCheck(color,board)?(max?-99999:99999):0;
    if(!depth)     return this.eval(board);
    if(max){
      let best=-Infinity;
      for(const[,,nb,nEp,nC] of mv){
        const s=this.minimax(nb,depth-1,alpha,beta,false,nEp,nC);
        if(s>best) best=s; if(s>alpha) alpha=s; if(beta<=alpha) break;
      }
      return best;
    } else {
      let best=Infinity;
      for(const[,,nb,nEp,nC] of mv){
        const s=this.minimax(nb,depth-1,alpha,beta,true,nEp,nC);
        if(s<best) best=s; if(s<beta) beta=s; if(beta<=alpha) break;
      }
      return best;
    }
  }

  bestMove(depth) {
    const c=this.turn, max=c==='w';
    let best=max?-Infinity:Infinity, bm=null;
    const mv=[];
    for(let sq=0;sq<64;sq++){
      if(this.c(this.board[sq])!==c) continue;
      this.pseudo(sq,this.board[sq],this.board,this.ep,this.cas).forEach(to=>{
        const[nb,,nEp,nC]=this.apply(sq,to,this.board,this.ep,this.cas);
        if(!this.inCheck(c,nb)) mv.push([sq,to,nb,nEp,nC]);
      });
    }
    mv.sort(()=>Math.random()-0.5);
    for(const[sq,to,nb,nEp,nC] of mv){
      const s=this.minimax(nb,depth-1,-Infinity,Infinity,!max,nEp,nC);
      if((max&&s>best)||(!max&&s<best)){best=s;bm=[sq,to];}
    }
    return {move:bm, score:best};
  }

  // Quick shallow eval for the eval bar (depth 2 always, fast)
  quickEval() {
    if(this.over) return this.winner==='w'?9999:(this.winner==='b'?-9999:0);
    const r=this.minimax(this.board,2,-Infinity,Infinity,true,this.ep,this.cas);
    return r;
  }
}

// ── PUZZLES ──────────────────────────────────────────────────────
// Each puzzle starts from a mid-game FEN; player must find the best move.
const PUZZLES = [
  {
    id:'fork1', name:'Knight Fork',
    fen:'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    solution:['f3g5'],  // Ng5 attacking f7 (fork queen+rook)
    theme:'White to move', tag:'Fork', rating:1200,
    desc:'White has a powerful tactical shot. Look for a piece that attacks two targets at once.',
    explanation:'Ng5 forks the queen on d8 and attacks f7, putting Black in a difficult position.',
  },
  {
    id:'backrank1', name:'Back Rank Mate',
    fen:'6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    solution:['d1d8'],  // Rd8#
    theme:'White to move', tag:'Checkmate', rating:900,
    desc:'White can end the game in one move. The back rank is weak.',
    explanation:'Rd8 is checkmate — the king has no escape and the rook controls the entire back rank.',
  },
  {
    id:'pin1', name:'Pin & Win',
    fen:'r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6',
    solution:['c4b5'],  // Bxc6 winning material via pin
    theme:'White to move', tag:'Pin', rating:1100,
    desc:'Find the move that exploits the pin on the d-file.',
    explanation:'Bb5 pins the knight on c6 to the king, winning material.',
  },
  {
    id:'queen-sac', name:'Discovered Check',
    fen:'4k3/8/8/3B4/8/8/4K3/4R3 w - - 0 1',
    solution:['e1e8'],  // Re8#
    theme:'White to move', tag:'Checkmate', rating:800,
    desc:'White can deliver checkmate immediately.',
    explanation:'Re8 is checkmate — the bishop controls the escape squares and the rook controls e8.',
  },
  {
    id:'promo1', name:'Promote to Win',
    fen:'8/P5k1/8/8/8/8/6K1/8 w - - 0 1',
    solution:['a7a8'],  // a8=Q
    theme:'White to move', tag:'Promotion', rating:950,
    desc:'Promote the pawn. Choose the best piece.',
    explanation:'a8=Q promotes to a queen, giving enormous material advantage.',
  },
  {
    id:'skewer1', name:'Skewer the King',
    fen:'4k3/4r3/8/8/8/8/4R3/4K3 w - - 0 1',
    solution:['e2e8'],  // Re8+ skewers rook
    theme:'White to move', tag:'Skewer', rating:1050,
    desc:'Attack the king to win the rook behind it.',
    explanation:'Re8+ skewers the king, forcing it to move and allowing White to capture the rook.',
  },
  {
    id:'double-attack', name:'Double Attack',
    fen:'r3k2r/ppp1bppp/2nqbn2/3pp3/2B1P3/2NQ1N2/PPP2PPP/R1B1K2R w KQkq - 0 8',
    solution:['d3h7'],  // Qh7 threatening mate and rook
    theme:'White to move', tag:'Double Attack', rating:1300,
    desc:'White's queen can create two threats at once.',
    explanation:'Qh7 threatens both mate on g8 and attacks the rook on h8.',
  },
  {
    id:'deflection1', name:'Deflection',
    fen:'3r2k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1',
    solution:['d1d8'],  // Qxd8+ deflects rook
    theme:'White to move', tag:'Deflection', rating:1000,
    desc:'Force the defender away from a critical square.',
    explanation:'Qxd8+ deflects the rook, removing the guard from g8.',
  },
];

// ── UI STATE ──────────────────────────────────────────────────────
let game         = new Chess();
let mode         = 'pvc';      // 'pvc' | 'pvp' | 'puzzle'
let aiDepth      = 3;
let selSq        = null;
let legalSqs     = [];
let lastMove     = null;
let flipped      = false;
let aiThinking   = false;
let hintSq       = null;
let evalScore    = 0;          // centipawns, positive = white better
let currentTheme = 'classic';
let puzzleIdx    = 0;
let puzzleGame   = null;       // Chess instance for current puzzle
let puzzleSolved = false;
let puzzleMoves  = [];         // moves made in puzzle so far
let solMoveIdx   = 0;          // next required move index

const THEME_COLORS = {
  classic:    {light:'#f0d9b5', dark:'#b58863'},
  ocean:      {light:'#d9edf4', dark:'#4f7cac'},
  graphite:   {light:'#d7d9d7', dark:'#656d69'},
  walnut:     {light:'#e8d5b5', dark:'#8b6343'},
};

// Squares -> notation
function sqName(sq) {
  return 'abcdefgh'[sq%8] + '87654321'[Math.floor(sq/8)];
}
function moveText(from, to) { return sqName(from)+sqName(to); }

// ── WELCOME SCREEN ────────────────────────────────────────────────
let welcomeMode = 'pvc';

function selectWelcomeMode(m) {
  welcomeMode = m;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('wm-'+m).classList.add('active');
}

function launchGame() {
  aiDepth = parseInt(document.getElementById('diffSelect').value)||3;
  startGame(welcomeMode);
}

function goMenu() {
  aiThinking = false;
  document.getElementById('gameShell').classList.remove('visible');
  document.getElementById('welcomeScreen').classList.remove('hidden');
}

// ── GAME START ────────────────────────────────────────────────────
function startGame(m) {
  mode = m;
  game = new Chess();
  selSq=null; legalSqs=[]; lastMove=null; flipped=false; aiThinking=false; hintSq=null; evalScore=0;

  document.getElementById('welcomeScreen').classList.add('hidden');
  const shell = document.getElementById('gameShell');
  shell.classList.add('visible');

  // Show/hide sections
  document.getElementById('puzzleSection').style.display = m==='puzzle' ? 'block' : 'none';
  document.getElementById('gameSection').style.display   = m!=='puzzle' ? 'block' : 'none';
  document.getElementById('evalSection').style.display   = m==='pvc'    ? 'block' : 'none';
  document.getElementById('hintBtn').disabled = m!=='pvc';

  const modeTab = { pvc:'tabPvc', pvp:'tabPvp', puzzle:'tabPuzzle' };
  document.querySelectorAll('.mode-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(modeTab[m])?.classList.add('active');

  if(m==='puzzle') {
    loadPuzzle(0);
  } else {
    buildBoard();
    renderBoard();
    setStatus('White to move','');
    updateMoveList();
    updatePlayerBars();
    updateEval();
  }
}

function resetGame() { startGame(mode); }

function flipBoard() {
  flipped = !flipped;
  buildBoard();
  renderBoard();
}

function setTheme(t) {
  currentTheme = t;
  if(document.getElementById('themeSelect'))
    document.getElementById('themeSelect').value = t;
  renderBoard();
}

function updateDepth(v) {
  aiDepth = parseInt(v);
  document.getElementById('depthLabel').textContent = v;
}

// ── BOARD DOM ────────────────────────────────────────────────────
function buildBoard() {
  const bd = document.getElementById('board');
  bd.innerHTML = '';
  const thm = THEME_COLORS[currentTheme]||THEME_COLORS.classic;

  for(let vis=0; vis<64; vis++) {
    const sq = flipped ? (7-Math.floor(vis/8))*8+(7-vis%8) : vis;
    const r  = Math.floor(sq/8), f = sq%8;
    const lt = (r+f)%2===0;

    const div = document.createElement('div');
    div.className = 'sq '+(lt?'light':'dark');
    div.style.background = lt ? thm.light : thm.dark;
    div.dataset.sq = sq;

    // Coord labels
    const showR = flipped ? f===7 : f===0;
    const showF = flipped ? r===0 : r===7;
    if(showR){ const s=document.createElement('span'); s.className='sq-coord rank'; s.textContent='87654321'[r]; div.appendChild(s); }
    if(showF){ const s=document.createElement('span'); s.className='sq-coord file'; s.textContent='abcdefgh'[f]; div.appendChild(s); }

    div.addEventListener('click', ()=>handleClick(parseInt(div.dataset.sq)));
    bd.appendChild(div);
  }
}

function renderBoard() {
  const thm   = THEME_COLORS[currentTheme]||THEME_COLORS.classic;
  const chk   = game.inCheck(game.turn, game.board);
  const sqs   = document.getElementById('board').querySelectorAll('.sq');
  const g     = mode==='puzzle' ? puzzleGame||game : game;

  sqs.forEach(div => {
    const sq  = parseInt(div.dataset.sq);
    const r   = Math.floor(sq/8), f = sq%8;
    const lt  = (r+f)%2===0;

    div.style.background = lt ? thm.light : thm.dark;
    div.classList.remove('selected','last-from','last-to','in-check','hint-sq','legal-dot','legal-cap');
    div.querySelectorAll('.piece,.white-piece,.black-piece').forEach(e=>e.remove());

    // Highlights
    if(selSq===sq)  div.classList.add('selected');
    if(hintSq===sq) div.classList.add('hint-sq');
    if(lastMove){ if(sq===lastMove.from) div.classList.add('last-from'); if(sq===lastMove.to) div.classList.add('last-to'); }

    const theGame = mode==='puzzle'?(puzzleGame||game):game;
    if(chk && theGame.board[sq]===theGame.turn+'K') div.classList.add('in-check');
    if(legalSqs.includes(sq)) div.classList.add(theGame.board[sq]?'legal-cap':'legal-dot');

    const pc = theGame.board[sq];
    if(pc) div.appendChild(makePieceEl(pc));
  });

  // status bar only for game modes
  if(mode!=='puzzle') {
    const theGame=game;
    if(!theGame.over){
      const c = theGame.turn==='w'?'White':'Black';
      setStatus(aiThinking?'AI thinking…':`${c} to move`+(chk?' — CHECK ⚠️':''),'');
    }
    updateMoveList();
    updatePlayerBars();
    updateEval();
  }

  // move count
  document.getElementById('moveCount').textContent = mode==='puzzle'?(puzzleGame?.log.length||0):game.log.length;
}

function setStatus(txt, cls) {
  const el = document.getElementById('statusMsg');
  if(!el) return;
  el.textContent = txt;
  el.className   = 'status-msg '+(cls||'');
}

function updateMoveList() {
  const ol = document.getElementById('moveList');
  if(!ol) return;
  ol.innerHTML='';
  const log = game.log;
  for(let i=0;i<log.length;i+=2){
    const tr=document.createElement('tr');
    const td0=document.createElement('td'); td0.textContent=(i/2+1);
    const td1=document.createElement('td'); td1.className='white-move'; td1.textContent=log[i].text;
    const td2=document.createElement('td'); td2.className='black-move'; td2.textContent=log[i+1]?log[i+1].text:'';
    tr.append(td0,td1,td2);
    ol.appendChild(tr);
  }
  ol.parentElement.scrollTop=ol.scrollHeight;
}

function updatePlayerBars() {
  // White is always at bottom (or top if flipped)
  const whiteBar = document.getElementById(flipped?'topBar':'bottomBar');
  const blackBar = document.getElementById(flipped?'bottomBar':'topBar');
  if(!whiteBar||!blackBar) return;

  // Material advantage
  const wCap = game.cap.w; // white captured these (black pieces)
  const bCap = game.cap.b; // black captured these (white pieces)
  const wVal = wCap.reduce((s,p)=>s+(PV[game.t(p)]||0),0);
  const bVal = bCap.reduce((s,p)=>s+(PV[game.t(p)]||0),0);
  const wAdv = wVal-bVal, bAdv = bVal-wVal;

  const renderBar = (bar, color, captured, adv)=>{
    bar.classList.toggle('active-turn', game.turn===color&&!game.over);
    const capEl  = bar.querySelector('.captured-pieces');
    const advEl  = bar.querySelector('.material-adv');
    if(capEl){ capEl.innerHTML=''; captured.forEach(p=>{ const s=document.createElement('span'); s.textContent=PIECE_UNICODE[p]||'?'; capEl.appendChild(s); }); }
    if(advEl){ advEl.textContent = adv>0?`+${adv}`:''; }
  };
  renderBar(whiteBar,'w',bCap,wAdv);
  renderBar(blackBar,'b',wCap,bAdv);
}

// ── EVAL BAR ────────────────────────────────────────────────────
let evalTimer = null;
function updateEval() {
  if(mode!=='pvc') return;
  clearTimeout(evalTimer);
  evalTimer = setTimeout(()=>{
    if(game.over){ evalScore=game.winner==='w'?9999:(game.winner==='b'?-9999:0); renderEval(); return; }
    const res = game.minimax(game.board,2,-Infinity,Infinity,true,game.ep,game.cas);
    evalScore = typeof res==='number'?res:0;
    renderEval();
  },120);
}

function renderEval() {
  const bar   = document.getElementById('evalBarBlack');
  const score = document.getElementById('evalScore');
  const num   = document.getElementById('evalNum');
  if(!bar) return;

  const capped = Math.max(-1000, Math.min(1000, evalScore));
  // 0 → 50% for black, 1000 → 5% for black, -1000 → 95% for black
  const blackPct = Math.round(50 - (capped/1000)*45);
  bar.style.height = blackPct+'%';

  const display = Math.abs(evalScore)>=9000
    ? (evalScore>0?'M':'−M')
    : (evalScore>=0?'+':'−')+Math.abs(evalScore/100).toFixed(1);
  if(score) score.textContent=display;
  if(num)   num.textContent=display;
}

// ── CLICK HANDLER ────────────────────────────────────────────────
function handleClick(sq) {
  if(mode==='puzzle') { handlePuzzleClick(sq); return; }
  if(game.over||aiThinking) return;
  if(mode==='pvc'&&game.turn==='b') return;

  hintSq=null;
  if(selSq===null){
    if(game.board[sq]&&game.c(game.board[sq])===game.turn){
      selSq=sq; legalSqs=game.legal(sq); renderBoard();
    }
  } else {
    if(legalSqs.includes(sq)){
      doMove(selSq,sq);
    } else if(game.board[sq]&&game.c(game.board[sq])===game.turn){
      selSq=sq; legalSqs=game.legal(sq); renderBoard();
    } else {
      selSq=null; legalSqs=[]; renderBoard();
    }
  }
}

function doMove(from, to, promo) {
  const tp=game.t(game.board[from]);
  const rank=Math.floor(to/8);
  if(tp==='P'&&(rank===0||rank===7)&&!promo){ showPromo(from,to,game.turn); return; }
  game.move(from,to,promo||'Q');
  lastMove={from,to}; selSq=null; legalSqs=[]; hintSq=null;
  renderBoard();
  if(game.over){ handleGameOver(); return; }
  if(mode==='pvc'&&game.turn==='b'){
    aiThinking=true; renderBoard();
    setTimeout(doAI,80);
  }
}

function doAI() {
  const {move:mv}=game.bestMove(aiDepth);
  aiThinking=false;
  if(mv){ game.move(mv[0],mv[1]); lastMove={from:mv[0],to:mv[1]}; }
  renderBoard();
  if(game.over) handleGameOver();
}

function handleGameOver() {
  let txt,cls;
  if(game.winner){ txt=(game.winner==='w'?'White':'Black')+' wins by checkmate! 🎉'; cls='good'; }
  else { txt='Stalemate — Draw 🤝'; cls=''; }
  setStatus(txt,cls);
  if(mode==='pvc') setTimeout(()=>showAnalysis(game.winner==='b'),900);
}

// ── HINT ────────────────────────────────────────────────────────
function showHint() {
  if(mode==='pvc'&&!game.over&&!aiThinking){
    const{move:mv}=game.bestMove(2);
    if(mv){ hintSq=mv[0]; selSq=null; legalSqs=[]; renderBoard();
      setStatus('Hint: try the highlighted piece.','warn');
      setTimeout(()=>{ hintSq=null; renderBoard(); },2000); }
  }
}

// ── PROMOTION ───────────────────────────────────────────────────
function showPromo(from, to, color) {
  const pp=document.getElementById('promoPieces');
  pp.innerHTML='';
  ['Q','R','B','N'].forEach(t=>{
    const pc=color+t;
    const div=document.createElement('div');
    div.className='promo-piece';
    if(imgOk[pc]===false){
      const s=document.createElement('span'); s.className='piece-unicode'; s.textContent=PIECE_UNICODE[pc];
      div.appendChild(s);
    } else {
      const img=document.createElement('img'); img.src=PIECE_PNG[pc]; img.alt=pc;
      img.onerror=()=>{ imgOk[pc]=false; img.replaceWith(document.createTextNode(PIECE_UNICODE[pc])); };
      div.appendChild(img);
    }
    div.onclick=()=>{ document.getElementById('promoOverlay').classList.remove('show'); doMove(from,to,t); };
    pp.appendChild(div);
  });
  document.getElementById('promoOverlay').classList.add('show');
}

// ── POST-GAME ANALYSIS ───────────────────────────────────────────
function showAnalysis(humanLost) {
  const playerColor='w';
  const pMoves=game.log.filter(m=>m.color===playerColor);
  const captures=pMoves.filter(m=>m.cap);
  const checks=pMoves.filter(m=>m.check);
  const piecesLost=game.cap.b; // black captured white's pieces

  const mistakes=[];
  for(let i=0;i<game.log.length-1;i++){
    const mv=game.log[i], nxt=game.log[i+1];
    if(mv.color!==playerColor||!nxt?.cap) continue;
    const val=PV[game.t(nxt.cap)]||0;
    if(val>=100){
      mistakes.push({
        moveNum:mv.moveNum, move:mv.text,
        lost:{ P:'Pawn',N:'Knight',B:'Bishop',R:'Rook',Q:'Queen' }[game.t(nxt.cap)]||'piece',
        val, aiMove:nxt.text,
        note:`You played ${mv.text}, then the AI played ${nxt.text} and won your ${
          {P:'Pawn',N:'Knight',B:'Bishop',R:'Rook',Q:'Queen'}[game.t(nxt.cap)]
        } (${val} pts).`,
        sev: val>=500?'blunder':'mistake',
      });
    }
  }
  const blunders=mistakes.filter(m=>m.sev==='blunder').length;

  const tips=[];
  if(blunders>=2) tips.push('You had multiple blunders. Before every move ask yourself: is my piece safe there?');
  else if(blunders===1) tips.push(`The key blunder was move ${mistakes.find(m=>m.sev==='blunder')?.moveNum}. Losing a major piece let the AI take full control.`);
  if(piecesLost.length>captures.length+2) tips.push('You gave up far more material than you gained. Focus on not leaving pieces undefended.');
  if(checks.length===0) tips.push('You never put the AI in check. Try to generate threats and forcing moves to keep the pressure on.');
  if(pMoves.length<12) tips.push('The game ended early. Work on opening fundamentals: control the centre and develop pieces before attacking.');
  if(!tips.length) tips.push('Competitive game! Keep working on spotting tactics one move ahead before committing.');

  document.getElementById('aTitle').textContent   = humanLost?'You Lost':game.winner?'You Won! 🎉':'Draw 🤝';
  document.getElementById('aSub').textContent     = humanLost?'Here\'s where the AI got ahead of you.':'Good game! Here\'s your performance summary.';
  document.getElementById('sMoves').textContent   = pMoves.length;
  document.getElementById('sMistakes').textContent= mistakes.length;
  document.getElementById('sCaptures').textContent= captures.length;
  document.getElementById('sChecks').textContent  = checks.length;
  document.getElementById('sLost').textContent    = piecesLost.length;
  document.getElementById('sBlunders').textContent= blunders;

  const ml=document.getElementById('mistakeList');
  ml.innerHTML='';
  if(!mistakes.length){
    ml.innerHTML='<p style="color:var(--green);font-weight:700">No major mistakes detected — solid play!</p>';
  } else {
    mistakes.slice(0,6).forEach(m=>{
      const d=document.createElement('div');
      d.className='mistake-item '+m.sev;
      d.innerHTML=`<div class="mi-head">Move ${m.moveNum}: <code>${m.move}</code>
        <span style="font-size:0.7rem;margin-left:6px;color:${m.sev==='blunder'?'var(--red)':'var(--gold)'}">[${m.sev}]</span></div>
        <div class="mi-note">${m.note}</div>`;
      ml.appendChild(d);
    });
  }
  document.getElementById('coachTip').textContent=tips[0];
  document.getElementById('analysisOverlay').classList.add('show');
}

function closeAnalysis() { document.getElementById('analysisOverlay').classList.remove('show'); }

// ── PUZZLE MODE ──────────────────────────────────────────────────
function loadPuzzle(idx) {
  const puzzles=PUZZLES;
  puzzleIdx=(idx+puzzles.length)%puzzles.length;
  const pz=puzzles[puzzleIdx];
  puzzleGame=new Chess();
  // Parse FEN
  const[placement,turn,castling,ep]=pz.fen.split(' ');
  puzzleGame.board=Array(64).fill(null);
  puzzleGame.turn=turn||'w';
  // castling
  puzzleGame.cas={wK:castling?.includes('K'),wQ:castling?.includes('Q'),bK:castling?.includes('k'),bQ:castling?.includes('q')};
  // ep
  if(ep&&ep!=='-'){ const F='abcdefgh', c=F.indexOf(ep[0]); const r=8-parseInt(ep[1]); puzzleGame.ep=r*8+c; }
  // board
  placement.split('/').forEach((rank,row)=>{
    let col=0;
    for(const ch of rank){
      if(/\d/.test(ch)) col+=parseInt(ch);
      else { puzzleGame.board[row*8+col]=ch===ch.toUpperCase()?'w'+ch:'b'+ch.toUpperCase(); col++; }
    }
  });

  puzzleSolved=false; puzzleMoves=[]; solMoveIdx=0;
  selSq=null; legalSqs=[]; lastMove=null; hintSq=null;

  // Update puzzle card
  document.getElementById('pzName').textContent  = pz.name;
  document.getElementById('pzTag').textContent   = pz.tag;
  document.getElementById('pzRating').textContent= '⭐ '+pz.rating;
  document.getElementById('pzDesc').textContent  = pz.desc;
  document.getElementById('pzProgress').innerHTML= '';
  setPuzzleFeedback(pz.theme+' — '+pz.desc,'info');
  document.getElementById('pzNext').disabled=true;

  // Use puzzleGame for rendering
  const savedGame=game; game=puzzleGame;
  flipped=puzzleGame.turn==='b';
  buildBoard(); renderBoard();
  game=savedGame;

  updatePuzzleProgress();
}

function handlePuzzleClick(sq) {
  if(puzzleSolved) return;
  const pz=PUZZLES[puzzleIdx];
  const required=pz.solution[solMoveIdx];

  // Use puzzleGame for interaction
  const savedGame=game; game=puzzleGame;

  if(selSq===null){
    if(game.board[sq]&&game.c(game.board[sq])===game.turn){
      selSq=sq; legalSqs=game.legal(sq); renderBoard();
    }
  } else {
    if(legalSqs.includes(sq)){
      const attempt=moveText(selSq,sq);
      const from=selSq;
      selSq=null; legalSqs=[];

      if(attempt===required||(required&&attempt===required.slice(0,4))){
        // Correct move
        game.move(from,sq,(required.length===5?required[4].toUpperCase():'Q'));
        lastMove={from,to:sq};
        puzzleMoves.push({sq:sq,correct:true});
        solMoveIdx++;

        if(solMoveIdx>=pz.solution.length){
          // Puzzle solved!
          puzzleSolved=true;
          setPuzzleFeedback('✓ Correct! '+pz.explanation,'correct');
          document.getElementById('pzNext').disabled=false;
          updatePuzzleProgress('correct');
        } else {
          setPuzzleFeedback('✓ Good move! Keep going…','correct');
          updatePuzzleProgress('correct');
          // AI plays next move in the solution sequence (opponent reply)
          setTimeout(()=>{
            const aiFrom=parseInt(pz.solution[solMoveIdx].slice(0,2).replace(/[a-h]/g,c=>'abcdefgh'.indexOf(c)).replace(/[1-8]/g,n=>(8-parseInt(n)).toString()),36);
            // Actually just pick a legal move for the opponent
            const all=game.allLegal();
            if(all.length){ const m=all[Math.floor(Math.random()*all.length)]; game.move(m[0],m[1]); lastMove={from:m[0],to:m[1]}; }
            renderBoard();
          },600);
        }
      } else {
        // Wrong move
        setPuzzleFeedback('✗ Not quite — try again. '+pz.desc,'wrong');
        puzzleMoves.push({sq:sq,correct:false});
        updatePuzzleProgress('wrong');
        // Don't make the move, just re-render
      }
      renderBoard();
    } else if(game.board[sq]&&game.c(game.board[sq])===game.turn){
      selSq=sq; legalSqs=game.legal(sq); renderBoard();
    } else {
      selSq=null; legalSqs=[]; renderBoard();
    }
  }
  game=savedGame;
}

function setPuzzleFeedback(text, type) {
  const el=document.getElementById('pzFeedback');
  if(!el) return;
  el.textContent=text;
  el.className='puzzle-feedback '+type;
}

function updatePuzzleProgress(result) {
  const el=document.getElementById('pzProgress');
  if(!el) return;
  const pz=PUZZLES[puzzleIdx];
  el.innerHTML='';
  pz.solution.forEach((_,i)=>{
    const dot=document.createElement('div');
    dot.className='prog-dot'+(i<solMoveIdx?' correct':'')+(i===solMoveIdx&&result==='wrong'?' wrong':'');
    el.appendChild(dot);
  });
}

function nextPuzzle() { loadPuzzle(puzzleIdx+1); }
function prevPuzzle() { loadPuzzle(puzzleIdx-1); }
function retryPuzzle(){ loadPuzzle(puzzleIdx); }

function showPuzzleSolution() {
  const pz=PUZZLES[puzzleIdx];
  const from=pz.solution[0].slice(0,2);
  const to=pz.solution[0].slice(2,4);
  const fromSq='abcdefgh'.indexOf(from[0])+(8-parseInt(from[1]))*8;
  const toSq='abcdefgh'.indexOf(to[0])+(8-parseInt(to[1]))*8;
  hintSq=fromSq;
  setPuzzleFeedback('Solution: '+from+'→'+to+'. '+pz.explanation,'info');
  const savedGame=game; game=puzzleGame;
  renderBoard();
  game=savedGame;
}

// ── KEYBOARD ────────────────────────────────────────────────────
document.addEventListener('keydown', e=>{
  if(!document.getElementById('gameShell').classList.contains('visible')) return;
  switch(e.key){
    case 'Escape': selSq=null; legalSqs=[]; hintSq=null; renderBoard(); break;
    case 'f': case 'F': flipBoard(); break;
    case 'h': case 'H': showHint(); break;
    case 'r': case 'R': goMenu(); break;
    case 't': case 'T': {
      const keys=Object.keys(THEME_COLORS);
      setTheme(keys[(keys.indexOf(currentTheme)+1)%keys.length]);
      break;
    }
  }
});

// ── BOOT ────────────────────────────────────────────────────────
preload();
