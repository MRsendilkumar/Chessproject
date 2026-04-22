from flask import Flask, jsonify, request
from flask_cors import CORS
import chess

app = Flask(__name__)
CORS(app)

board = chess.Board()

@app.route("/board")
def get_board():
    return jsonify(board.fen())

@app.route("/move", methods=["POST"])
def make_move():
    data = request.json
    move = chess.Move.from_uci(data["move"])

    if move in board.legal_moves:
        board.push(move)
        return jsonify({"status": "ok", "fen": board.fen()})
    else:
        return jsonify({"status": "invalid"})

@app.route("/")
def home():
    return "Backend running"

if __name__ == "__main__":
    app.run(debug=True)