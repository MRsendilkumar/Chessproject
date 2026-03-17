# ♟️ Chess AI

A fully playable chess game built in Python with Pygame, featuring a smart AI opponent and a clean menu to choose your game mode.

---

## 🎮 Game Modes

| Mode | Description |
|------|-------------|
| Player vs Player | Two people play on the same computer |
| Player vs AI | Play against the chess engine |

---

## 🧠 How the AI Works

The AI uses three techniques to find the best move:

- **Minimax** — Looks several moves ahead and picks the best possible outcome
- **Alpha-Beta Pruning** — Skips moves that won't affect the result, making the AI much faster
- **Piece-Square Tables** — Rewards good positioning (knights in the centre, kings staying safe, etc.)

You can adjust the difficulty in `main.py` by changing the `depth` value:

| Depth | Difficulty | Speed |
|-------|-----------|-------|
| 2 | Easy | Fast |
| 3 | Medium (default) | Normal |
| 4 | Hard | Slow |

---

## 🕹️ Controls

| Key / Action | Description |
|-------------|-------------|
| Click & Drag | Move a piece |
| `T` | Cycle through board themes |
| `R` | Reset game and return to menu |

---

## 📁 Project Structure

```
CHESS-AI/
├── src/
│   ├── main.py         # Entry point & game loop
│   ├── ai.py           # Chess engine (Minimax + Alpha-Beta)
│   ├── Menu.py         # Mode selection screen
│   ├── Game.py         # Game logic & rendering
│   ├── Board.py        # Board state & move generation
│   ├── Piece.py        # All piece classes
│   ├── Square.py       # Square class
│   ├── Move.py         # Move class
│   ├── Dragger.py      # Drag & drop handler
│   ├── Config.py       # Themes & sounds config
│   ├── Theme.py        # Theme class
│   ├── Color.py        # Color class
│   ├── Sound.py        # Sound class
│   └── const.py        # Constants (WIDTH, HEIGHT, etc.)
└── assets/
    ├── white_pawn.png
    ├── white_knight.png
    ├── white_bishop.png
    ├── white_rook.png
    ├── white_queen.png
    ├── white_king.png
    ├── black_pawn.png
    ├── black_knight.png
    ├── black_bishop.png
    ├── black_rook.png
    ├── black_queen.png
    ├── black_king.png
    ├── move.wav
    └── capture.wav
```

---

## ⚙️ Installation & Setup

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/CHESS-AI.git
cd CHESS-AI
```

**2. Install dependencies**
```bash
pip install pygame
```

**3. Add your assets**

Place all piece images and sounds inside the `assets/` folder. Images should be named like:
```
white_pawn.png   black_pawn.png
white_queen.png  black_queen.png
...and so on
```

Free piece images are available at: `github.com/lichess-org/lila`

**4. Run the game**
```bash
python src/main.py
```

---

## 🎨 Board Themes

Press `T` during a game to cycle through 4 built-in themes:

| Theme | Colors |
|-------|--------|
| Green | Classic green & cream |
| Brown | Wooden brown tones |
| Blue  | Cool blue & grey |
| Gray  | Minimal dark grey |

---

## ♟️ Features

- Full chess rules including castling, en passant, and pawn promotion
- Legal move highlighting
- Last move trace highlighting
- Drag and drop piece movement
- Capture and move sounds
- Board coordinate labels
- 4 switchable themes
- Smart AI opponent
- Player vs Player mode

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| `No module named pygame` | Run `pip install pygame` |
| `FileNotFoundError` on images | Make sure you're running from `CHESS-AI/` not `src/` |
| Blank board, no pieces | Check image filenames match exactly e.g. `white_pawn.png` |
| `No module named 'Game'` | Run `python src/main.py` not `python main.py` |
| AI takes too long | Lower `depth` to `2` in `main.py` |

---

## 🛠️ Built With

- [Python 3.12](https://www.python.org/)
- [Pygame](https://www.pygame.org/)
