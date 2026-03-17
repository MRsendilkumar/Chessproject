# Chess AI

A Python chess game with an AI opponent, built with Pygame.

## Features
- Full chess rules (castling, en passant, promotion)
- Drag and drop pieces
- 4 board themes (press `T` to cycle)
- AI opponent using Minimax + Alpha-Beta Pruning + Piece-Square Tables

## Requirements
- Python 3.12+
- pygame

## Installation

```bash
pip install pygame
```

## Running

```bash
cd src
python main.py
```

## Controls

| Key | Action |
|-----|--------|
| Click & Drag | Move a piece |
| `T` | Cycle board theme |
| `R` | Reset the game |

## Project Structure

```
CHESS-AI/
├── src/
│   ├── main.py       # Entry point
│   ├── ai.py         # Chess engine (Minimax + Alpha-Beta)
│   ├── Game.py       # Game logic & rendering
│   ├── Board.py      # Board state & move generation
│   ├── Piece.py      # Piece classes
│   ├── Square.py     # Square class
│   ├── Move.py       # Move class
│   ├── Dragger.py    # Drag & drop
│   ├── Config.py     # Themes & sounds
│   ├── Theme.py      # Theme class
│   ├── Color.py      # Color class
│   ├── Sound.py      # Sound class
│   └── const.py      # Constants
└── assets/
    ├── images/
    │   ├── imgs-80px/    # e.g. white_pawn.png
    │   └── imgs-128px/   # e.g. black_queen.png
    └── sounds/
        ├── move.wav
        └── capture.wav
```

## How the AI Works

The AI uses three techniques:

1. **Minimax** — Searches all possible moves several turns ahead and picks the best outcome
2. **Alpha-Beta Pruning** — Skips branches that won't affect the result, making it much faster
3. **Piece-Square Tables** — Rewards good positioning (e.g. knights in the centre, kings staying safe)

Adjust difficulty by changing `depth` in `main.py`:
- `depth=2` — Easy (fast)
- `depth=3` — Medium (default)
- `depth=4` — Hard (slower)
