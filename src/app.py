"""
Chess Tutor Backend - Flask REST API
=====================================
A Python Flask backend for the Chess Tutor web application.
Features:
- Minimax AI with alpha-beta pruning
- Material-based evaluation function
- Support for Normal and Puzzle game modes
- Configurable AI difficulty (Easy/Medium/Hard)

Author: MRsendilkumar
GitHub: https://github.com/MRsendilkumar/Chessproject
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import chess
import random
import time
from functools import wraps

app = Flask(__name__)
CORS(app)

# ── Configuration ─────────────────────────────────────────────────────────────
MAX_DEPTH = {
    'easy': 1,
    'medium': 2,
    'hard': 3
}

# Piece values for evaluation (centipawns)
PIECE_VALUES = {
    chess.PAWN: 100,
    chess.KNIGHT: 320,
    chess.BISHOP: 330,
    chess.ROOK: 500,
    chess.QUEEN: 900,
    chess.KING: 20000,
}

# Position bonus tables for better AI play
PAWN_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0,
]

KNIGHT_TABLE = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
]

# ── Game State ─────────────────────────────────────────────────────────────────
class ChessGame:
    def __init__(self):
        self.board = chess.Board()
        self.move_history = []
        self.start_time = None

    def reset(self):
        self.board = chess.Board()
        self.move_history = []
        self.start_time = time.time()

    def make_move(self, uci_move):
        move = chess.Move.from_uci(uci_move)
        if move in self.board.legal_moves:
            self.board.push(move)
            self.move_history.append(uci_move)
            return True
        return False

    def get_state(self):
        return {
            "fen": self.board.fen(),
            "turn": "white" if self.board.turn == chess.WHITE else "black",
            "checkmate": self.board.is_checkmate(),
            "stalemate": self.board.is_stalemate(),
            "check": self.board.is_check(),
            "game_over": self.board.is_game_over(),
            "insufficient_material": self.board.is_insufficient_material(),
            "can_claim_draw": self.board.can_claim_draw(),
            "move_count": len(self.move_history)
        }

# Global game instance
game = ChessGame()

# ── AI Engine ─────────────────────────────────────────────────────────────────
def evaluate(board):
    """
    Evaluate the board position.
    Returns a score in centipawns (positive = white advantage, negative = black advantage).
    """
    if board.is_checkmate():
        # Large penalty for checkmate (worse than being down material)
        return -99999 if board.turn == chess.WHITE else 99999

    if board.is_stalemate() or board.is_insufficient_material():
        return 0

    score = 0

    # Material counting
    for piece_type, value in PIECE_VALUES.items():
        white_count = len(board.pieces(piece_type, chess.WHITE))
        black_count = len(board.pieces(piece_type, chess.BLACK))
        score += white_count * value
        score -= black_count * value

    # Position bonuses
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece:
            if piece.color == chess.WHITE:
                if piece.piece_type == chess.PAWN:
                    score += PAWN_TABLE[square]
                elif piece.piece_type == chess.KNIGHT:
                    score += KNIGHT_TABLE[square]
            else:
                # Mirror for black pieces
                if piece.piece_type == chess.PAWN:
                    score -= PAWN_TABLE[chess.square_mirror(square)]
                elif piece.piece_type == chess.KNIGHT:
                    score -= KNIGHT_TABLE[chess.square_mirror(square)]

    # Mobility bonus (more moves = better position)
    if board.turn == chess.WHITE:
        score += len(list(board.legal_moves)) * 5
    else:
        score -= len(list(board.legal_moves)) * 5

    # King safety in endgame
    if board.piece_type_at(chess.E1) is None or board.piece_type_at(chess.E8) is None:
        # Endgame - favor king activity
        white_king_sq = board.king(chess.WHITE)
        black_king_sq = board.king(chess.BLACK)
        if white_king_sq:
            score += chess.square_file(white_king_sq) * 10  # Push king to center
        if black_king_sq:
            score -= chess.square_file(black_king_sq) * 10

    return score

def quiescence(board, alpha, beta, depth=4):
    """Extended search for captures to avoid horizon effect."""
    if depth == 0:
        return evaluate(board)

    stand_pat = evaluate(board)
    if stand_pat >= beta:
        return beta
    if stand_pat > alpha:
        alpha = stand_pat

    # Only search captures and checks in quiescence
    moves = list(board.legal_moves)
    moves.sort(key=lambda m: capture_score(board, m), reverse=True)

    for move in moves[:10]:  # Limit to top captures
        if board.is_capture(move) or board.gives_check(move):
            board.push(move)
            score = -quiescence(board, -beta, -alpha, depth - 1)
            board.pop()

            if score >= beta:
                return beta
            if score > alpha:
                alpha = score

    return alpha

def capture_score(board, move):
    """Score a move based on captured piece value."""
    captured = board.piece_at(move.to_square)
    if captured:
        return PIECE_VALUES[captured.piece_type]
    return 0

def minimax(board, depth, alpha, beta, maximizing, start_time, time_limit=5):
    """
    Minimax algorithm with alpha-beta pruning.

    Args:
        board: Chess board position
        depth: Remaining search depth
        alpha: Alpha value for pruning
        beta: Beta value for pruning
        maximizing: True if maximizing player (white), False if minimizing (black)
        start_time: Search start time for time management
        time_limit: Maximum search time in seconds

    Returns:
        Evaluation score for the position
    """
    # Time check - prevent long searches
    if time.time() - start_time > time_limit:
        return evaluate(board)

    # Terminal conditions
    if depth == 0:
        return quiescence(board, alpha, beta)

    if board.is_game_over():
        return evaluate(board)

    # Move ordering - try best moves first
    moves = list(board.legal_moves)
    random.shuffle(moves)

    # Sort for better pruning (captures first, then checks)
    moves.sort(key=lambda m: capture_score(board, m), reverse=True)

    if maximizing:
        best = -float('inf')
        for move in moves:
            board.push(move)
            score = minimax(board, depth - 1, alpha, beta, False, start_time, time_limit)
            board.pop()

            if score > best:
                best = score
            if best > alpha:
                alpha = best

            # Alpha-beta cutoff
            if beta <= alpha:
                break

        return best
    else:
        best = float('inf')
        for move in moves:
            board.push(move)
            score = minimax(board, depth - 1, alpha, beta, True, start_time, time_limit)
            board.pop()

            if score < best:
                best = score
            if best < beta:
                beta = best

            # Alpha-beta cutoff
            if beta <= alpha:
                break

        return best

def find_best_move(board, depth, time_limit=5):
    """
    Find the best move using minimax with alpha-beta pruning.

    Args:
        board: Chess board position
        depth: Search depth (1-4 recommended for performance)
        time_limit: Maximum search time in seconds

    Returns:
        chess.Move object representing the best move, or None if no moves available
    """
    if board.is_game_over():
        return None

    best_val = -float('inf') if board.turn == chess.WHITE else float('inf')
    best_move = None
    start_time = time.time()

    # Get legal moves and shuffle for variety
    moves = list(board.legal_moves)
    random.shuffle(moves)

    # Move ordering for better pruning
    moves.sort(key=lambda m: capture_score(board, m), reverse=True)

    for move in moves:
        board.push(move)
        val = minimax(board, depth - 1, -float('inf'), float('inf'),
                      board.turn == chess.WHITE, start_time, time_limit)
        board.pop()

        if board.turn == chess.WHITE:
            if val > best_val:
                best_val = val
                best_move = move
        else:
            if val < best_val:
                best_val = val
                best_move = move

        # Early exit if time limit exceeded
        if time.time() - start_time > time_limit * 2:
            break

    return best_move

# ── Utility Functions ──────────────────────────────────────────────────────────
def timeit(f):
    """Decorator to measure endpoint response time."""
    @wraps(f)
    def decorated(*args, **kwargs):
        start = time.time()
        result = f(*args, **kwargs)
        elapsed = time.time() - start
        if elapsed > 1.0:
            print(f"[PERF] {f.__name__}: {elapsed:.2f}s")
        return result
    return decorated

# ── API Routes ─────────────────────────────────────────────────────────────────
@app.route("/")
@timeit
def home():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "Chess Tutor API",
        "version": "1.0.0"
    })

@app.route("/board")
@timeit
def get_board():
    """Get current board state."""
    return jsonify(game.get_state())

@app.route("/new-game", methods=["POST"])
@timeit
def new_game():
    """Start a new game."""
    game.reset()
    result = game.get_state()
    result["status"] = "ok"
    result["message"] = "New game started"
    return jsonify(result)

@app.route("/player-move", methods=["POST"])
@timeit
def player_move():
    """
    Apply a player's move.

    Request body:
        {
            "move": "e2e4"  // UCI format move
        }

    Returns:
        Board state after the move
    """
    data = request.json or {}
    uci = data.get("move", "")

    # Validate move format
    if not uci or len(uci) < 4:
        return jsonify({
            "status": "error",
            "message": "Invalid move format. Expected UCI format (e.g., 'e2e4')"
        }), 400

    # Try basic move format
    try:
        move = chess.Move.from_uci(uci)
    except ValueError:
        return jsonify({
            "status": "error",
            "message": "Invalid UCI format"
        }), 400

    # Check if promotion is needed
    if move not in game.board.legal_moves:
        # Try with queen promotion
        if len(uci) == 5:
            promo_uci = uci[:4] + 'q'
            try:
                move = chess.Move.from_uci(promo_uci)
            except ValueError:
                return jsonify({
                    "status": "invalid",
                    "message": "Illegal move - cannot promote to that piece"
                }), 400
        else:
            return jsonify({
                "status": "invalid",
                "message": "Illegal move"
            }), 400

    # Make the move
    if move not in game.board.legal_moves:
        return jsonify({
            "status": "invalid",
            "message": "Illegal move"
        }), 400

    game.board.push(move)
    game.move_history.append(uci)

    result = game.get_state()
    result["status"] = "ok"
    result["message"] = "Move applied successfully"

    return jsonify(result)

@app.route("/ai-move", methods=["POST"])
@timeit
def ai_move():
    """
    Let AI make a move.

    Request body:
        {
            "depth": 2  // Search depth (1-3 recommended)
        }

    Returns:
        Board state after AI's move
    """
    if game.board.is_game_over():
        return jsonify({
            "status": "no_moves",
            "message": "Game is over"
        })

    data = request.json or {}
    depth_input = data.get("depth", 2)

    # Validate and cap depth
    try:
        depth = max(1, min(int(depth_input), 4))
    except (ValueError, TypeError):
        depth = 2

    # Get difficulty mapping
    difficulty = 'medium'
    if depth == 1:
        difficulty = 'easy'
    elif depth >= 3:
        difficulty = 'hard'

    # Calculate time limit based on depth
    time_limit = 3 if depth <= 2 else 5

    # Find best move
    mv = find_best_move(game.board, MAX_DEPTH.get(difficulty, 2), time_limit)

    if mv is None:
        return jsonify({
            "status": "no_moves",
            "message": "No legal moves available"
        })

    # Apply move
    game.board.push(mv)
    game.move_history.append(mv.uci())

    result = game.get_state()
    result["status"] = "ok"
    result["move_uci"] = mv.uci()
    result["depth_used"] = depth

    return jsonify(result)

@app.route("/best-move", methods=["POST"])
@timeit
def best_move():
    """
    Get the best move WITHOUT applying it (for puzzle mode).

    Request body:
        {
            "depth": 3  // Search depth
        }

    Returns:
        Best move UCI string
    """
    if game.board.is_game_over():
        return jsonify({
            "status": "no_moves",
            "message": "Game is over"
        })

    data = request.json or {}
    depth = max(1, min(int(data.get("depth", 2)), 4))

    # Calculate time limit
    time_limit = 3 if depth <= 2 else 6

    # Find best move
    mv = find_best_move(game.board, depth, time_limit)

    if mv is None:
        return jsonify({
            "status": "no_moves",
            "message": "No legal moves available"
        })

    return jsonify({
        "status": "ok",
        "move_uci": mv.uci(),
        "evaluation": evaluate(game.board)
    })

@app.route("/undo", methods=["POST"])
@timeit
def undo_move():
    """
    Undo the last move (player and AI pair).
    """
    if len(game.move_history) < 2:
        return jsonify({
            "status": "error",
            "message": "Not enough moves to undo"
        }), 400

    # Undo AI move
    game.board.pop()
    game.move_history.pop()

    # Undo player move
    game.board.pop()
    game.move_history.pop()

    result = game.get_state()
    result["status"] = "ok"
    result["message"] = "Move undone"

    return jsonify(result)

@app.route("/reset", methods=["POST"])
@timeit
def reset():
    """
    Reset the board (alias for /new-game).
    """
    return new_game()

@app.route("/moves", methods=["GET"])
@timeit
def get_moves():
    """
    Get legal moves for the current position.
    """
    moves = [m.uci() for m in game.board.legal_moves]
    return jsonify({
        "status": "ok",
        "moves": moves,
        "count": len(moves)
    })

@app.route("/validate", methods=["POST"])
@timeit
def validate_move():
    """
    Validate a move without applying it.

    Request body:
        {
            "move": "e2e4"
        }

    Returns:
        Whether the move is legal
    """
    data = request.json or {}
    uci = data.get("move", "")

    try:
        move = chess.Move.from_uci(uci)
    except ValueError:
        return jsonify({
            "status": "invalid",
            "valid": False,
            "reason": "Invalid UCI format"
        })

    if move in game.board.legal_moves:
        return jsonify({
            "status": "ok",
            "valid": True,
            "move": uci
        })
    else:
        return jsonify({
            "status": "ok",
            "valid": False,
            "reason": "Illegal move"
        })

# ── Error Handlers ────────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "status": "error",
        "message": "Endpoint not found"
    }), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({
        "status": "error",
        "message": "Internal server error"
    }), 500

# ── CORS Headers (already handled by flask-cors, but explicit) ────────────────
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

# ── Main ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🏰 Chess Tutor Backend Starting...")
    print(f"📊 Piece values: {PIECE_VALUES}")
    print("🌐 Endpoints:")
    print("   GET  /              - Health check")
    print("   GET  /board         - Get current board state")
    print("   POST /new-game      - Start new game")
    print("   POST /player-move   - Apply player move")
    print("   POST /ai-move       - AI makes a move")
    print("   POST /best-move     - Get best move (puzzle mode)")
    print("   POST /undo          - Undo last move")
    print("   POST /reset         - Reset game")
    print("   GET  /moves         - Get legal moves")
    print("   POST /validate      - Validate a move")
    print("\n🚀 Running on http://0.0.0.0:5000")

    app.run(debug=True, host='0.0.0.0', port=5000)