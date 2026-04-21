from flask import Flask, jsonify, request
from flask_cors import CORS
import chess
import random

app = Flask(__name__)
CORS(app)

# ── Game state ────────────────────────────────────────
board = chess.Board()


# ── Minimax AI ────────────────────────────────────────
PIECE_VALUES = {
    chess.PAWN:   100,
    chess.KNIGHT: 320,
    chess.BISHOP: 330,
    chess.ROOK:   500,
    chess.QUEEN:  900,
    chess.KING:   20000,
}

def evaluate(b):
    if b.is_checkmate():
        return -99999 if b.turn == chess.WHITE else 99999
    if b.is_stalemate() or b.is_insufficient_material():
        return 0
    score = 0
    for piece_type, value in PIECE_VALUES.items():
        score += len(b.pieces(piece_type, chess.WHITE)) * value
        score -= len(b.pieces(piece_type, chess.BLACK)) * value
    return score

def minimax(b, depth, alpha, beta, maximizing):
    if depth == 0 or b.is_game_over():
        return evaluate(b)
    if maximizing:
        best = -float('inf')
        for move in b.legal_moves:
            b.push(move)
            best = max(best, minimax(b, depth-1, alpha, beta, False))
            b.pop()
            alpha = max(alpha, best)
            if beta <= alpha:
                break
        return best
    else:
        best = float('inf')
        for move in b.legal_moves:
            b.push(move)
            best = min(best, minimax(b, depth-1, alpha, beta, True))
            b.pop()
            beta = min(beta, best)
            if beta <= alpha:
                break
        return best

def best_move(b, depth):
    """Return the best UCI move string for the current position."""
    best_val = -float('inf') if b.turn == chess.WHITE else float('inf')
    best_mv  = None
    moves    = list(b.legal_moves)
    random.shuffle(moves)           # break ties randomly for variety

    for move in moves:
        b.push(move)
        val = minimax(b, depth-1, -float('inf'), float('inf'), b.turn == chess.WHITE)
        b.pop()
        if b.turn == chess.WHITE:
            if val > best_val:
                best_val = val
                best_mv  = move
        else:
            if val < best_val:
                best_val = val
                best_mv  = move

    return best_mv


# ── Helpers ───────────────────────────────────────────
def board_state(b):
    return {
        "fen":       b.fen(),
        "turn":      "white" if b.turn == chess.WHITE else "black",
        "checkmate": b.is_checkmate(),
        "stalemate": b.is_stalemate(),
        "check":     b.is_check(),
        "game_over": b.is_game_over(),
    }


# ── Routes ────────────────────────────────────────────

@app.route("/")
def home():
    return "Chess backend running"


# GET /board  — current board state
@app.route("/board")
def get_board():
    return jsonify(board_state(board))


# POST /new-game  — reset and return fresh state
@app.route("/new-game", methods=["POST"])
def new_game():
    global board
    board = chess.Board()
    data = board_state(board)
    data["status"] = "ok"
    return jsonify(data)


# POST /player-move  — validate & apply player's move
@app.route("/player-move", methods=["POST"])
def player_move():
    data = request.json or {}
    uci  = data.get("move", "")

    try:
        move = chess.Move.from_uci(uci)
    except Exception:
        return jsonify({"status": "error", "message": "Invalid move format"}), 400

    # Handle pawn promotion automatically (promote to queen)
    if move not in board.legal_moves:
        promo = chess.Move.from_uci(uci + "q")
        if promo in board.legal_moves:
            move = promo
        else:
            return jsonify({"status": "invalid", "message": "Illegal move"}), 400

    board.push(move)
    result = board_state(board)
    result["status"] = "ok"
    return jsonify(result)


# POST /ai-move  — let AI pick & apply its move
@app.route("/ai-move", methods=["POST"])
def ai_move():
    if board.is_game_over():
        return jsonify({"status": "no_moves"})

    data  = request.json or {}
    depth = max(1, min(int(data.get("depth", 2)), 4))   # cap at 4 for speed

    mv = best_move(board, depth)
    if mv is None:
        return jsonify({"status": "no_moves"})

    board.push(mv)
    result = board_state(board)
    result["status"]   = "ok"
    result["move_uci"] = mv.uci()
    return jsonify(result)


# POST /best-move  — return best move WITHOUT applying it (for puzzle mode)
@app.route("/best-move", methods=["POST"])
def get_best_move():
    if board.is_game_over():
        return jsonify({"status": "no_moves"})

    data  = request.json or {}
    depth = max(1, min(int(data.get("depth", 2)), 4))

    mv = best_move(board, depth)
    if mv is None:
        return jsonify({"status": "no_moves"})

    return jsonify({"status": "ok", "move_uci": mv.uci()})


# POST /reset  — alias for /new-game (backwards compat)
@app.route("/reset", methods=["POST"])
def reset():
    global board
    board = chess.Board()
    data  = board_state(board)
    data["status"] = "reset"
    return jsonify(data)


# ── Run ───────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)