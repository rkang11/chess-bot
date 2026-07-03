import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { getBestMove } from "./bot/search.js";
import { evaluateWithModel, loadEvalModel } from "./bot/neuralEvaluate.js";
import "./App.css";

function App() {
  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState("Your move. You are White.");
  const [thinking, setThinking] = useState(false);
  const [botDepth, setBotDepth] = useState(2);

  const [modelReady, setModelReady] = useState(false);
  const [modelStatus, setModelStatus] = useState("Loading ML model...");
  const [useML, setUseML] = useState(true);

  const [colorChoice, setColorChoice] = useState("white");
  const [playerColor, setPlayerColor] = useState("w");

  useEffect(() => {
    async function loadModel() {
      try {
        await loadEvalModel();
        setModelReady(true);
        setModelStatus("ML model loaded.");
      } catch (error) {
        console.error("Model failed to load:", error);
        setModelReady(false);
        setUseML(false);
        setModelStatus(`ML model failed: ${error.message}`);
      }
    }

    loadModel();
  }, []);

  function colorName(color) {
    return color === "w" ? "White" : "Black";
  }

  function getActualColor(choice) {
    if (choice === "random") {
      return Math.random() < 0.5 ? "w" : "b";
    }

    return choice === "white" ? "w" : "b";
  }

  function getStatus(currentGame, currentPlayerColor = playerColor) {
    if (currentGame.isCheckmate()) {
      const winner = currentGame.turn() === "w" ? "Black" : "White";
      return `Checkmate. ${winner} wins.`;
    }

    if (currentGame.isDraw()) {
      return "Draw.";
    }

    const turnColor = currentGame.turn();

    if (currentGame.isCheck()) {
      return `${colorName(turnColor)} is in check.`;
    }

    if (turnColor === currentPlayerColor) {
      return `Your move. You are ${colorName(currentPlayerColor)}.`;
    }

    return `Bot to move. You are ${colorName(currentPlayerColor)}.`;
  }

  function makeBotMove(currentGame) {
    if (currentGame.isGameOver()) return;

    setThinking(true);

    setTimeout(() => {
      const gameCopy = new Chess(currentGame.fen());

      const evaluator = useML && modelReady ? evaluateWithModel : undefined;
      const bestMove = getBestMove(gameCopy, botDepth, evaluator);

      if (bestMove) {
        gameCopy.move(bestMove);
        setGame(gameCopy);
        setStatus(getStatus(gameCopy));
      }

      setThinking(false);
    }, 100);
  }

  function startNewGame(choice = colorChoice) {
    const actualColor = getActualColor(choice);
    const newGame = new Chess();

    setColorChoice(choice);
    setPlayerColor(actualColor);
    setGame(newGame);
    setThinking(false);

    setStatus(`New game. You are ${colorName(actualColor)}.`);

    // If user is Black, bot plays White immediately.
    if (actualColor === "b") {
      setTimeout(() => {
        makeBotMove(newGame);
      }, 200);
    }
  }

  function onDrop({ sourceSquare, targetSquare }) {
    if (!sourceSquare || !targetSquare) return false;
    if (game.isGameOver()) return false;
    if (thinking) return false;

    // Only allow the user to move when it is their turn.
    if (game.turn() !== playerColor) return false;

    const gameCopy = new Chess(game.fen());

    let moveResult = null;

    try {
      moveResult = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
    } catch {
      return false;
    }

    if (moveResult === null) return false;

    setGame(gameCopy);
    setStatus(getStatus(gameCopy));

    if (!gameCopy.isGameOver()) {
      makeBotMove(gameCopy);
    }

    return true;
  }

  function resetGame() {
    startNewGame(colorChoice);
  }

  function handleColorChoiceChange(event) {
    startNewGame(event.target.value);
  }

  return (
    <div className="app">
      <h1>My Chess Bot</h1>

      <div className="board-wrapper">
        <Chessboard
          options={{
            position: game.fen(),
            boardOrientation: playerColor === "w" ? "white" : "black",
            onPieceDrop: onDrop,
          }}
        />
      </div>

      <p className="status">{thinking ? "Bot is thinking..." : status}</p>
      <p className="model-status">{modelStatus}</p>

      <div className="controls">
        <label>
          Play as:{" "}
          <select
            value={colorChoice}
            disabled={thinking}
            onChange={handleColorChoiceChange}
          >
            <option value="white">White</option>
            <option value="black">Black</option>
            <option value="random">Random</option>
          </select>
        </label>

        <label>
          Difficulty:{" "}
          <select
            value={botDepth}
            disabled={thinking}
            onChange={(event) => setBotDepth(Number(event.target.value))}
          >
            <option value={1}>Easy, depth 1</option>
            <option value={2}>Medium, depth 2</option>
            <option value={3}>Hard, depth 3</option>
          </select>
        </label>

        <label>
          Evaluator:{" "}
          <select
            value={useML ? "ml" : "handcrafted"}
            disabled={thinking || !modelReady}
            onChange={(event) => setUseML(event.target.value === "ml")}
          >
            <option value="ml">ML evaluator</option>
            <option value="handcrafted">Handcrafted evaluator</option>
          </select>
        </label>

        <button onClick={resetGame} disabled={thinking}>
          Reset Game
        </button>
      </div>
    </div>
  );
}

export default App;
