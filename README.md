# Chess Bot

This is browser-based chess bot built with React, `chess.js`, alpha-beta search, and a custom neural-network evaluation model trained from Stockfish-labeled chess positions.

## Live Demo

The site is available at:

```text
https://rkang11.github.io/chess-bot/
```

## Project Description

This project lets a user play chess against a custom bot directly in the browser.

The chess rules, legal move generation, checkmate detection, castling, promotion, and move validation are handled by `chess.js`. The bot logic is custom-built and uses alpha-beta minimax search to choose moves.

The bot uses a trained ML evaluation model exported from Colab (found at chess-bot/training/train_eval_model_v2.ipynb). The ML evaluator predicts how favorable a board position is for White or Black. The search algorithm then uses that evaluation to choose the best move.

## Tech Stack

React, 
Vite, 
chess.js, 
react-chessboard, 
Python, 
TensorFlow/Keras, 
Stockfish, 
Google Colab, 
GitHub Pages