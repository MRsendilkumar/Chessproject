import chess

class Board:
    def __init__(self):
        self.board = chess.Board()

    def get_fen(self):
        return self.board.fen()

    def reset(self):
        self.board.reset()

    def get_turn(self):
        return "white" if self.board.turn else "black"

    def get_legal_moves(self):
        return [move.uci() for move in self.board.legal_moves]

    def make_move(self, move_str):
        try:
            move = chess.Move.from_uci(move_str)
        except:
            return {"status": "error", "message": "Invalid format"}

        if move in self.board.legal_moves:
            self.board.push(move)
            return {
                "status": "ok",
                "fen": self.board.fen(),
                "turn": self.get_turn()
            }
        else:
            return {"status": "invalid", "message": "Illegal move"}

    def is_game_over(self):
        return self.board.is_game_over()

    def result(self):
        return self.board.result()