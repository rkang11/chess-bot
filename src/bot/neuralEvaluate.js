const INPUT_SIZE = 773;

const PIECE_TO_PLANE = {
  wp: 0,
  wn: 1,
  wb: 2,
  wr: 3,
  wq: 4,
  wk: 5,

  bp: 6,
  bn: 7,
  bb: 8,
  br: 9,
  bq: 10,
  bk: 11,
};

let evalModel = null;

export async function loadEvalModel() {
  if (evalModel) return evalModel;

  const modelUrl = `${import.meta.env.BASE_URL}model/eval_weights.json`;
  console.log("Loading simple model from:", modelUrl);

  const response = await fetch(modelUrl);

  if (!response.ok) {
    throw new Error(`Could not fetch model weights: ${response.status}`);
  }

  evalModel = await response.json();

  if (!evalModel.layers || evalModel.layers.length === 0) {
    throw new Error("Model weights file is invalid.");
  }

  console.log("Simple model loaded:", evalModel);
  return evalModel;
}

function squareIndex(row, col) {
  // chess.js row 0 is rank 8.
  // python-chess square 0 is a1.
  return (7 - row) * 8 + col;
}

export function encodeBoard(game) {
  const input = new Array(INPUT_SIZE).fill(0);
  const board = game.board();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (!piece) continue;

      const key = piece.color + piece.type;
      const plane = PIECE_TO_PLANE[key];
      const square = squareIndex(row, col);

      input[plane * 64 + square] = 1;
    }
  }

  const fenParts = game.fen().split(" ");
  const turn = fenParts[1];
  const castling = fenParts[2];

  input[768] = turn === "w" ? 1 : 0;
  input[769] = castling.includes("K") ? 1 : 0;
  input[770] = castling.includes("Q") ? 1 : 0;
  input[771] = castling.includes("k") ? 1 : 0;
  input[772] = castling.includes("q") ? 1 : 0;

  return input;
}

function activate(x, activation) {
  if (activation === "relu") {
    return Math.max(0, x);
  }

  if (activation === "tanh") {
    return Math.tanh(x);
  }

  if (activation === "linear") {
    return x;
  }

  return x;
}

function runDenseLayer(input, layer) {
  const weights = layer.weights;
  const bias = layer.bias;
  const outputSize = bias.length;
  const output = new Array(outputSize);

  for (let j = 0; j < outputSize; j++) {
    let sum = bias[j];

    for (let i = 0; i < input.length; i++) {
      sum += input[i] * weights[i][j];
    }

    output[j] = activate(sum, layer.activation);
  }

  return output;
}

function runModel(input) {
  if (!evalModel) {
    throw new Error("Model is not loaded yet.");
  }

  let x = input;

  for (const layer of evalModel.layers) {
    x = runDenseLayer(x, layer);
  }

  return x[0];
}

export function evaluateWithModel(game) {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? -100000 : 100000;
  }

  if (game.isDraw()) {
    return 0;
  }

  const input = encodeBoard(game);
  const prediction = runModel(input);

  return prediction * 1000;
}