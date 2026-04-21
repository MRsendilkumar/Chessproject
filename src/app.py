from flask import Flask, jsonify, request
from flask_cors import CORS
import copy

from Board import Board
from Square import Square
from Move import Move
from Piece import Pawn, Knight, Bishop, Rook, Queen, King
from ai import get_best_move

app = Flask(__name__)
CORS(app, origins=["*"])

# ── GLOBAL GAME STATE ─────────────────────────────────────────
board = Board()
current_turn = 'white'


def reset_board():
    global board, current_turn
    board = Board()
    current_turn = 'white'


# ── ROUTES ────────────────────────────────────────────────────

@app.route('/new-game', methods=['POST'])
def new_game():
    reset_board()
    return jsonify({
        'status': 'ok',
        'turn': current_turn
    })


@app.route('/ai-move', methods=['POST'])
def ai_move():
    """
    Handles:
    1. Player move
    2. AI response move

    Input:
    {
        "from": [row, col],
        "to": [row, col]
    }

    Output:
    {
        player_move: {...},
        ai_move: {...}
    }
    """
    global board, current_turn

    data = request.get_json()

    fr, fc = data['from']
    tr, tc = data['to']

    piece = board.squares[fr][fc].piece

    if not piece:
        return jsonify({'status': 'error', 'message': 'No piece'}), 400

    if piece.color != current_turn:
        return jsonify({'status': 'error', 'message': 'Wrong turn'}), 400

    board.calc_moves(piece, fr, fc, bool=True)

    move = Move(Square(fr, fc), Square(tr, tc))

    if not board.valid_move(piece, move):
        return jsonify({'status': 'invalid'}), 200

    # ── APPLY PLAYER MOVE ──
    board.move(piece, move)
    board.set_true_en_passant(piece)

    player_move_data = {
        "from": [fr, fc],
        "to": [tr, tc]
    }

    current_turn = 'black'

    # ── AI MOVE ──
    result = get_best_move(board, depth=2)

    if not result:
        return jsonify({
            'status': 'no_moves',
            'player_move': player_move_data
        })

    ai_piece, ai_move = result

    # find piece position
    ai_row, ai_col = None, None
    for r in range(8):
        for c in range(8):
            if board.squares[r][c].piece is ai_piece:
                ai_row, ai_col = r, c
                break

    if ai_row is None:
        return jsonify({'status': 'error', 'message': 'AI piece not found'}), 500

    board.calc_moves(ai_piece, ai_row, ai_col, bool=True)

    board.move(ai_piece, ai_move)
    board.set_true_en_passant(ai_piece)

    current_turn = 'white'

    ai_move_data = {
        "from": [ai_move.initial.row, ai_move.initial.col],
        "to": [ai_move.final.row, ai_move.final.col]
    }

    return jsonify({
        'status': 'ok',
        'player_move': player_move_data,
        'ai_move': ai_move_data
    })


@app.route('/best-move', methods=['POST'])
def best_move():
    """
    Used for puzzle mode.
    Returns best move WITHOUT applying it.
    """
    temp_board = copy.deepcopy(board)

    result = get_best_move(temp_board, depth=2)

    if not result:
        return jsonify({'status': 'no_moves'})

    _, move = result

    return jsonify({
        'status': 'ok',
        'from': [move.initial.row, move.initial.col],
        'to': [move.final.row, move.final.col]
    })


# ── RUN ───────────────────────────────────────────────────────

if __name__ == '__main__':
    print("Chess Tutor backend running on http://localhost:5000")
    app.run(debug=True, port=5000)