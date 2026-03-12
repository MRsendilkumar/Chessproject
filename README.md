# Chessproject
# Chess AI

A Python chess game built with Pygame.

## Requirements

- Python 3.12+
- pygame

## Installation

```bash
pip install pygame
```

## Running the Game

```bash
cd src
python main.py
```

## Controls

- **Click & Drag** — move pieces
- **T** — cycle through board themes
- **R** — reset the game

## Project Structure

```
CHESS-AI/
├── src/
│   ├── main.py        # Entry point
│   ├── Game.py        # Game logic & rendering
│   ├── Board.py       # Board state & move generation
│   ├── Piece.py       # All piece classes
│   ├── Square.py      # Square class
│   ├── Move.py        # Move class
│   ├── Dragger.py     # Drag & drop handler
│   ├── Config.py      # Themes & sounds config
│   ├── Theme.py       # Theme class
│   ├── Color.py       # Color class
│   ├── Sound.py       # Sound class
│   └── const.py       # Constants (WIDTH, HEIGHT, etc.)
└── assets/
    ├── images/
    │   ├── imgs-80px/   # Piece images (80px)
    │   └── imgs-128px/  # Piece images (128px, for dragging)
    └── sounds/
        ├── move.wav
        └── capture.wav
```

## Assets

Place piece images in `assets/images/imgs-80px/` and `assets/images/imgs-128px/`.  
Naming format: `white_pawn.png`, `black_queen.png`, etc.
