import copy
from Piece import Pawn, Knight, Bishop, Rook, Queen, King

# ─────────────────────────────────────────────────────────────
#  PIECE-SQUARE TABLES  (white's perspective, row 0 = top)
#  Higher value = better square for that piece
# ─────────────────────────────────────────────────────────────

PAWN_TABLE = [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [ 5,  5, 10, 25, 25, 10,  5,  5],
    [ 0,  0,  0, 20, 20,  0,  0,  0],
    [ 5, -5,-10,  0,  0,-10, -5,  5],
    [ 5, 10, 10,-20,-20, 10, 10,  5],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
]

KNIGHT_TABLE = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50],
]

BISHOP_TABLE = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
]

ROOK_TABLE = [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [ 0,  0,  0,  5,  5,  0,  0,  0],
]

QUEEN_TABLE = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20],
]

KING_TABLE = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20],
]

# ─────────────────────────────────────────────────────────────
#  PIECE BASE VALUES (centipawns)
# ─────────────────────────────────────────────────────────────

PIECE_VALUES = {
    Pawn:   100,
    Knight: 320,
    Bishop: 330,
    Rook:   500,
    Queen:  900,
    King:   20000,
}


def get_positional_bonus(piece, row, col):
    """Return positional bonus from piece-square table."""
    # Black pieces use a flipped table
    r = row if piece.color == 'black' else (7 - row)

    if isinstance(piece, Pawn):
        return PAWN_TABLE[r][col]
    elif isinstance(piece, Knight):
        return KNIGHT_TABLE[r][col]
    elif isinstance(piece, Bishop):
        return BISHOP_TABLE[r][col]
    elif isinstance(piece, Rook):
        return ROOK_TABLE[r][col]
    elif isinstance(piece, Queen):
        return QUEEN_TABLE[r][col]
    elif isinstance(piece, King):
        return KING_TABLE[r][col]
    return 0


def evaluate(board):
    """
    Evaluate the board from white's perspective.
    Positive = white is better, Negative = black is better.
    """
    score = 0
    for row in range(8):
        for col in range(8):
            square = board.squares[row][col]
            if square.has_piece():
                piece = square.piece
                piece_type = type(piece)
                base_value = PIECE_VALUES.get(piece_type, 0)
                positional = get_positional_bonus(piece, row, col)
                total = base_value + positional
                if piece.color == 'white':
                    score += total
                else:
                    score -= total
    return score


def get_all_moves(board, color):
    """Return list of (piece, move, row, col) for all legal moves of given color."""
    moves = []
    for row in range(8):
        for col in range(8):
            square = board.squares[row][col]
            if square.has_piece() and square.piece.color == color:
                piece = square.piece
                board.calc_moves(piece, row, col, bool=True)
                for move in piece.moves:
                    moves.append((piece, move, row, col))
    return moves


def minimax(board, depth, alpha, beta, maximizing):
    """
    Minimax with alpha-beta pruning.
    maximizing=True means it's white's turn (trying to maximise score).
    """
    if depth == 0:
        return evaluate(board), None

    color = 'white' if maximizing else 'black'
    all_moves = get_all_moves(board, color)

    # No moves available — stalemate or checkmate
    if not all_moves:
        return evaluate(board), None

    best_move = None

    if maximizing:
        max_eval = float('-inf')
        for piece, move, row, col in all_moves:
            temp_board = copy.deepcopy(board)
            temp_piece = temp_board.squares[row][col].piece
            temp_board.move(temp_piece, move, testing=True)
            eval_score, _ = minimax(temp_board, depth - 1, alpha, beta, False)
            if eval_score > max_eval:
                max_eval = eval_score
                best_move = (piece, move)
            alpha = max(alpha, eval_score)
            if beta <= alpha:
                break
        return max_eval, best_move

    else:
        min_eval = float('inf')
        for piece, move, row, col in all_moves:
            temp_board = copy.deepcopy(board)
            temp_piece = temp_board.squares[row][col].piece
            temp_board.move(temp_piece, move, testing=True)
            eval_score, _ = minimax(temp_board, depth - 1, alpha, beta, True)
            if eval_score < min_eval:
                min_eval = eval_score
                best_move = (piece, move)
            beta = min(beta, eval_score)
            if beta <= alpha:
                break
        return min_eval, best_move


def get_best_move(board, depth=3):
    """
    Returns (piece, move) — the best move for black at the given depth.
    depth=2 is fast, depth=3 is medium, depth=4 is slow but strong.
    """
    _, best = minimax(board, depth, float('-inf'), float('inf'), False)
    return best
