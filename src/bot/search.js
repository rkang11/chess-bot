import { evaluateBoard, PIECE_VALUES } from "./evaluate.js";

function scoreMoveForOrdering(move) {
  let score = 0;

  if (move.captured) {
    score += 10 * PIECE_VALUES[move.captured] - PIECE_VALUES[move.piece];
  }

  if (move.promotion) {
    score += PIECE_VALUES[move.promotion];
  }

  if (move.san.includes("+")) {
    score += 50;
  }

  if (move.san.includes("#")) {
    score += 100000;
  }

  return score;
}

function orderMoves(moves) {
  return [...moves].sort(
    (a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a)
  );
}

function minimax(game, depth, alpha, beta, evaluateFn) {
  if (depth === 0 || game.isGameOver()) {
    return evaluateFn(game);
  }

  const moves = orderMoves(game.moves({ verbose: true }));

  if (game.turn() === "w") {
    let bestScore = -Infinity;

    for (const move of moves) {
      game.move(move);
      const score = minimax(game, depth - 1, alpha, beta, evaluateFn);
      game.undo();

      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, score);

      if (beta <= alpha) break;
    }

    return bestScore;
  } else {
    let bestScore = Infinity;

    for (const move of moves) {
      game.move(move);
      const score = minimax(game, depth - 1, alpha, beta, evaluateFn);
      game.undo();

      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, score);

      if (beta <= alpha) break;
    }

    return bestScore;
  }
}

export function getBestMove(game, depth, evaluateFn = evaluateBoard) {
  const moves = orderMoves(game.moves({ verbose: true }));

  if (moves.length === 0) return null;

  let bestMove = null;

  if (game.turn() === "w") {
    let bestScore = -Infinity;

    for (const move of moves) {
      game.move(move);
      const score = minimax(game, depth - 1, -Infinity, Infinity, evaluateFn);
      game.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  } else {
    let bestScore = Infinity;

    for (const move of moves) {
      game.move(move);
      const score = minimax(game, depth - 1, -Infinity, Infinity, evaluateFn);
      game.undo();

      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return bestMove;
}