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
  const [modelStatus, setModelStatus] = useState("");
  const [useML, setUseML] = useState(true);

  useEffect(() => {
    async function loadModel() {
      try {
        await loadEvalModel();
        setModelReady(true);
      } catch (error) {
        console.error("Model failed to load:", error);
        setModelReady(false);
        setUseML(false);
      }
    }

    loadModel();
  }, []);

  function getStatus(currentGame) {
    if (currentGame.isCheckmate()) {
      return currentGame.turn() === "w"
        ? "Checkmate. Black wins."
        : "Checkmate. White wins.";
    }

    if (currentGame.isDraw()) {
      return "Draw.";
    }

    if (currentGame.isCheck()) {
      return currentGame.turn() === "w"
        ? "White is in check."
        : "Black is in check.";
    }

    return currentGame.turn() === "w" ? "White to move." : "Black to move.";
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

  function onDrop({ sourceSquare, targetSquare }) {
    if (!sourceSquare || !targetSquare) return false;
    if (game.isGameOver()) return false;
    if (game.turn() !== "w") return false;
    if (thinking) return false;

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
    const newGame = new Chess();
    setGame(newGame);
    setStatus("Your move. You are White.");
    setThinking(false);
  }

  return (
    <div className="app">
      <h1>My Chess Bot</h1>

      <div className="board-wrapper">
        <Chessboard
          options={{
            position: game.fen(),
            boardOrientation: "white",
            onPieceDrop: onDrop,
          }}
        />
      </div>

      <p className="status">{thinking ? "Bot is thinking..." : status}</p>
      <p className="model-status">{modelStatus}</p>

      <div className="controls">
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
          </select>
        </label>

        <button onClick={resetGame}>Reset Game</button>
      </div>
    </div>
  );
}

export default App;