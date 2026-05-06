// Chess Tutor Web App - Complete Frontend
// ======================================

const API_BASE = 'https://humble-guacamoler-v6px5wqqgj9jhp6jv-5000.app.github.dev';

// Piece Unicode characters
const PIECES = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♜', 'N': '♞', 'B': '♝', 'Q': '♛', 'K': '♚', 'P': '♟'
};

// Game state
let gameState = {
    selected: null,
    validMoves: [],
    lastMove: null,
    board: null,
    turn: 'white',
    gameOver: false,
    mode: 'normal',
    depth: 2,
    moveHistory: [],
    undoStack: [],
    puzzleBestMove: null,
    puzzleAttempts: 0
};

// Timer state
let timerState = {
    whiteTime: 600, // 10 minutes in seconds
    blackTime: 600,
    interval: null,
    running: false
};

// DOM Elements
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const feedbackEl = document.getElementById('feedback');
const moveLogEl = document.getElementById('move-log');
const modeButtons = document.querySelectorAll('[data-mode]');
const depthButtons = document.querySelectorAll('[data-depth]');
const newGameBtn = document.getElementById('new-game-btn');
const skipBtn = document.getElementById('skip-btn');
const puzzleHint = document.getElementById('puzzle-hint');
const whiteTimerEl = document.getElementById('white-timer');
const blackTimerEl = document.getElementById('black-timer');

// Initialize game
async function initGame() {
    try {
        const res = await fetch(API_BASE + '/new-game', { method: 'POST' });
        const data = await res.json();
        updateBoard(data.fen);
        gameState.turn = data.turn;
        gameState.gameOver = data.game_over;
        gameState.moveHistory = [];
        gameState.undoStack = [];
        updateMoveLog();
        updateStatus();
        feedbackEl.textContent = 'Make your first move!';
    } catch (err) {
        feedbackEl.textContent = '❌ Cannot reach backend';
    }
}

// Draw board from FEN
function updateBoard(fen) {
    const rows = fen.split(' ')[0].split('/');
    boardEl.innerHTML = '';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sq = document.createElement('div');
            sq.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
            sq.dataset.row = r;
            sq.dataset.col = c;

            // Get piece for this square
            const rowData = rows[7 - r];
            let colIndex = 0;
            let piece = null;

            for (let i = 0; i < rowData.length; i++) {
                const char = rowData[i];
                if (/[1-8]/.test(char)) {
                    colIndex += parseInt(char);
                } else {
                    if (colIndex === c) {
                        piece = char;
                        break;
                    }
                    colIndex++;
                }
            }

            // Add piece element
            if (piece) {
                const pieceEl = document.createElement('span');
                pieceEl.className = 'piece ' + (piece === piece.toUpperCase() ? 'white-piece' : 'black-piece');
                pieceEl.textContent = PIECES[piece];
                sq.appendChild(pieceEl);
            }

            sq.onclick = onSquareClick;
            boardEl.appendChild(sq);
        }
    }

    // Highlight last move
    if (gameState.lastMove) {
        highlightSquare(gameState.lastMove.from, 'last-move-from');
        highlightSquare(gameState.lastMove.to, 'last-move-to');
    }

    // Highlight selected square
    if (gameState.selected) {
        highlightSquare(gameState.selected, 'selected');
        // Show valid moves
        gameState.validMoves.forEach(move => {
            highlightSquare(move, 'valid-move');
        });
    }

    // Highlight check
    if (gameState.check) {
        highlightKingSquare(gameState.turn);
    }
}

function highlightSquare(pos, className) {
    const index = (7 - pos.row) * 8 + pos.col;
    const sq = boardEl.children[index];
    if (sq) sq.classList.add(className);
}

function highlightKingSquare(turn) {
    const fen = gameState.board;
    if (!fen) return;
    const rows = fen.split(' ')[0].split('/');
    const kingChar = turn === 'white' ? 'K' : 'k';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const rowData = rows[7 - r];
            let colIndex = 0;
            for (let i = 0; i < rowData.length; i++) {
                const char = rowData[i];
                if (/[1-8]/.test(char)) {
                    colIndex += parseInt(char);
                } else {
                    if (colIndex === c && char === kingChar) {
                        const index = (7 - r) * 8 + c;
                        boardEl.children[index]?.classList.add('in-check');
                    }
                    colIndex++;
                }
            }
        }
    }
}

// Handle square click
async function onSquareClick(e) {
    if (gameState.gameOver) return;

    const row = parseInt(e.target.closest('.square').dataset.row);
    const col = parseInt(e.target.closest('.square').dataset.col);
    const pos = { row, col };

    // Get piece at position
    const piece = getPieceAt(row, col);

    if (!gameState.selected) {
        // First click - select piece
        if (piece && isOwnPiece(piece)) {
            gameState.selected = pos;
            gameState.validMoves = getValidMoves(row, col);
            updateBoard(gameState.board);
        }
    } else {
        // Second click - make move
        const from = gameState.selected;

        // Check if clicking on own piece - select it instead
        if (piece && isOwnPiece(piece)) {
            gameState.selected = pos;
            gameState.validMoves = getValidMoves(row, col);
            updateBoard(gameState.board);
            return;
        }

        // Try to make move
        if (isValidMove(from, pos)) {
            await makeMove(from, pos);
        } else {
            // Deselect
            gameState.selected = null;
            gameState.validMoves = [];
            updateBoard(gameState.board);
        }
    }
}

// Get piece at position
function getPieceAt(row, col) {
    const fen = gameState.board;
    if (!fen) return null;

    const rows = fen.split(' ')[0].split('/');
    const rowData = rows[7 - row];
    let colIndex = 0;

    for (let i = 0; i < rowData.length; i++) {
        const char = rowData[i];
        if (/[1-8]/.test(char)) {
            colIndex += parseInt(char);
        } else {
            if (colIndex === col) return char;
            colIndex++;
        }
    }
    return null;
}

function isOwnPiece(piece) {
    const isWhite = piece === piece.toUpperCase();
    return (gameState.turn === 'white' && isWhite) || (gameState.turn === 'black' && !isWhite);
}

// Convert row/col to algebraic notation
function toAlgebraic(row, col) {
    return String.fromCharCode(97 + col) + (8 - row);
}

// Convert row/col to UCI format
function toUCI(from, to) {
    return toAlgebraic(from.row, from.col) + toAlgebraic(to.row, to.col);
}

// Parse UCI to row/col
function uciToPos(uci) {
    const from = {
        col: uci.charCodeAt(0) - 97,
        row: 8 - parseInt(uci[1])
    };
    const to = {
        col: uci.charCodeAt(2) - 97,
        row: 8 - parseInt(uci[3])
    };
    return { from, to };
}

// Get valid moves for a piece (client-side validation)
function getValidMoves(row, col) {
    // For now, return all squares - server validates
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            moves.push({ row: r, col: c });
        }
    }
    return moves;
}

function isValidMove(from, to) {
    // Simplified - server does actual validation
    return from.row !== to.row || from.col !== to.col;
}

// Make move
async function makeMove(from, to) {
    const uci = toUCI(from, to);
    gameState.selected = null;
    gameState.validMoves = [];

    try {
        // Send player move
        const res = await fetch(API_BASE + '/player-move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ move: uci })
        });

        const data = await res.json();

        if (data.status === 'ok') {
            // Save for undo
            gameState.undoStack.push({
                uci: uci,
                board: gameState.board,
                turn: gameState.turn
            });

            // Update last move
            gameState.lastMove = { from, to };

            // Update board
            gameState.board = data.fen;
            gameState.turn = data.turn;
            gameState.moveHistory.push(uci);

            // Check for puzzle mode
            if (gameState.mode === 'puzzle' && gameState.puzzleBestMove) {
                if (uci === gameState.puzzleBestMove) {
                    feedbackEl.textContent = '🎉 Correct! Great move!';
                    gameState.puzzleAttempts = 0;
                    generateNewPuzzle();
                } else {
                    gameState.puzzleAttempts++;
                    if (gameState.puzzleAttempts >= 2) {
                        feedbackEl.textContent = `💡 Hint: Look for ${gameState.puzzleBestMove}`;
                    } else {
                        feedbackEl.textContent = '❌ Not the best move. Try again!';
                    }
                }
            }

            updateBoard(data.fen);
            updateMoveLog();
            updateStatus();

            // AI move in normal mode
            if (gameState.mode === 'normal' && !data.game_over && data.turn !== gameState.turn) {
                await makeAIMove();
            } else if (data.game_over) {
                handleGameOver(data);
            }

            // Restart timer on move
            restartTimer();
        } else {
            feedbackEl.textContent = 'Invalid move!';
        }
    } catch (err) {
        feedbackEl.textContent = '❌ Backend error';
    }
}

// Make AI move
async function makeAIMove() {
    statusEl.innerHTML = '●●● <span style="color: var(--accent)">AI thinking...</span>';

    try {
        const res = await fetch(API_BASE + '/ai-move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ depth: gameState.depth })
        });

        const data = await res.json();

        if (data.status === 'ok') {
            // Save for undo
            gameState.undoStack.push({
                uci: data.move_uci,
                board: gameState.board,
                turn: gameState.turn
            });

            // Update last move
            const { from, to } = uciToPos(data.move_uci);
            gameState.lastMove = { from, to };

            // Update board
            gameState.board = data.fen;
            gameState.turn = data.turn;
            gameState.moveHistory.push(data.move_uci);

            updateBoard(data.fen);
            updateMoveLog();

            if (data.game_over) {
                handleGameOver(data);
            }
        }
    } catch (err) {
        feedbackEl.textContent = '❌ AI error';
    }

    updateStatus();
    restartTimer();
}

// Handle game over
function handleGameOver(data) {
    gameState.gameOver = true;
    stopTimer();

    if (data.checkmate) {
        const winner = data.turn === 'white' ? 'Black' : 'White';
        feedbackEl.textContent = `🏆 Checkmate! ${winner} wins!`;
    } else if (data.stalemate) {
        feedbackEl.textContent = '🤝 Stalemate! Draw!';
    }

    // Show game over modal
    showGameOverModal(data);
}

function showGameOverModal(data) {
    const modal = document.getElementById('game-over-modal');
    const result = modal.querySelector('.result');

    if (data.checkmate) {
        const winner = data.turn === 'white' ? 'Black' : 'White';
        result.textContent = `Checkmate! ${winner} wins!`;
    } else if (data.stalemate) {
        result.textContent = 'Stalemate - Draw!';
    } else {
        result.textContent = 'Game Over';
    }

    modal.style.display = 'flex';
}

// Update move log
function updateMoveLog() {
    moveLogEl.innerHTML = '';

    for (let i = 0; i < gameState.moveHistory.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const whiteMove = gameState.moveHistory[i];
        const blackMove = gameState.moveHistory[i + 1];

        const moveEl = document.createElement('div');
        moveEl.className = 'move-entry';
        moveEl.innerHTML = `
            <span class="move-number">${moveNum}.</span>
            <span class="white-move">${formatMove(whiteMove)}</span>
            <span class="black-move">${blackMove ? formatMove(blackMove) : ''}</span>
        `;
        moveLogEl.appendChild(moveEl);
    }

    // Scroll to bottom
    moveLogEl.scrollTop = moveLogEl.scrollHeight;
}

function formatMove(uci) {
    const { to } = uciToPos(uci);
    return toAlgebraic(to.row, to.col);
}

// Update status
function updateStatus() {
    if (gameState.gameOver) {
        statusEl.innerHTML = '● ● ● Game Over';
        return;
    }

    const turnText = gameState.turn === 'white' ? "White's turn" : "Black's turn";
    const modeText = gameState.mode === 'puzzle' ? ' · Puzzle Mode' : '';
    statusEl.innerHTML = `● ● ● ${turnText}${modeText}`;
}

// Mode selection
modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameState.mode = btn.dataset.mode;

        if (gameState.mode === 'puzzle') {
            puzzleHint.style.display = 'block';
            generateNewPuzzle();
        } else {
            puzzleHint.style.display = 'none';
        }

        initGame();
    });
});

// Depth selection
depthButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        depthButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameState.depth = parseInt(btn.dataset.depth);
    });
});

// New game
newGameBtn.addEventListener('click', () => {
    document.getElementById('game-over-modal').style.display = 'none';
    initGame();
    startTimer();
});

// Skip puzzle
skipBtn.addEventListener('click', () => {
    generateNewPuzzle();
});

// Undo move
function undoMove() {
    if (gameState.undoStack.length < 2) return;

    // Undo both player and AI move
    gameState.undoStack.pop(); // AI move
    const playerUndo = gameState.undoStack.pop(); // Player move

    // Reset to state before player move
    initGame();
}

// Timer functions
function startTimer() {
    stopTimer();
    timerState.running = true;
    updateTimerDisplay();

    timerState.interval = setInterval(() => {
        if (timerState.running) {
            const currentTime = gameState.turn === 'white' ? timerState.whiteTime : timerState.blackTime;

            if (currentTime > 0) {
                if (gameState.turn === 'white') {
                    timerState.whiteTime--;
                } else {
                    timerState.blackTime--;
                }
                updateTimerDisplay();
            } else {
                // Time's up
                gameState.gameOver = true;
                stopTimer();
                feedbackEl.textContent = `🏆 ${gameState.turn === 'white' ? 'Black' : 'White'} wins on time!`;
            }
        }
    }, 1000);
}

function stopTimer() {
    timerState.running = false;
    if (timerState.interval) {
        clearInterval(timerState.interval);
    }
}

function restartTimer() {
    // Don't restart during AI thinking
    if (statusEl.textContent.includes('AI thinking')) return;
    timerState.running = true;
}

function updateTimerDisplay() {
    whiteTimerEl.textContent = formatTime(timerState.whiteTime);
    blackTimerEl.textContent = formatTime(timerState.blackTime);

    // Highlight active player
    if (gameState.turn === 'white') {
        whiteTimerEl.classList.add('active-timer');
        blackTimerEl.classList.remove('active-timer');
    } else {
        whiteTimerEl.classList.remove('active-timer');
        blackTimerEl.classList.add('active-timer');
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Puzzle mode
async function generateNewPuzzle() {
    try {
        const res = await fetch(API_BASE + '/best-move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ depth: gameState.depth + 1 })
        });

        const data = await res.json();

        if (data.status === 'ok') {
            gameState.puzzleBestMove = data.move_uci;
            feedbackEl.textContent = '🎯 Find the best move!';
        }
    } catch (err) {
        feedbackEl.textContent = '❌ Error generating puzzle';
    }
}

// Test backend connection
async function testBackend() {
    try {
        const res = await fetch(API_BASE + '/');
        if (!res.ok) throw 'bad';
        feedbackEl.textContent = '✅ Connected to backend';
    } catch {
        feedbackEl.textContent = '⚠️ Cannot reach backend. Check API connection.';
    }
}

// Piece animation
function animatePiece(from, to) {
    const fromIndex = (7 - from.row) * 8 + from.col;
    const toIndex = (7 - to.row) * 8 + to.col;

    const fromSquare = boardEl.children[fromIndex];
    const toSquare = boardEl.children[toIndex];

    const pieceEl = fromSquare.querySelector('.piece');
    if (!pieceEl) return;

    const fromRect = fromSquare.getBoundingClientRect();
    const toRect = toSquare.getBoundingClientRect();

    const dx = toRect.left - fromRect.left;
    const dy = toRect.top - fromRect.top;

    pieceEl.style.transition = 'transform 0.3s ease-out';
    pieceEl.style.transform = `translate(${dx}px, ${dy}px)`;

    setTimeout(() => {
        pieceEl.style.transition = '';
        pieceEl.style.transform = '';
        updateBoard(gameState.board);
    }, 300);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    testBackend();
    initGame();
    startTimer();

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'u' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            undoMove();
        }
    });
});

// Export for debugging
window.gameState = gameState;
window.undoMove = undoMove;