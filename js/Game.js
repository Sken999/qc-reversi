import {updateBoard, initBoard, boardState, boardSize} from "./Board.js";
import { showPopupMessage, getFlippablePieces, entanglementState } from "./UI.js";
import { gameState } from "./GameMode.js";

// ヘルパー：指定要素の表示／非表示を切り替える
function setVisibility(id, visible) {
  const el = document.getElementById(id);
  if (!el) return;
  visible ? el.classList.remove("hidden") : el.classList.add("hidden");
}

// --- ゲーム開始 --- visible=true
export function startGame() {
  document.getElementById("current-GameStep").textContent = `GameMode: ${gameState.selectedStepText}`;
  setVisibility("start-options", false);
  setVisibility("info", true);
  setVisibility("button-container", true);
  setVisibility("gate-button-container", true);
  setVisibility("game-board", true);
  setVisibility("reset-button", true);
  initBoard();
}

// --- ゲーム終了判定 ---  
export function checkGameOver() {
  // もしどちらも駒を置くことができなければ、コメント表示して測定ボタンの表示
  if (countAvailableMovesAndEmptyCells()) {
    showPopupMessage("ゲームが終了しました。測定ボタンを押してください。");
    setVisibility("reset-button", false);
    setVisibility("measure-button", true);
    document.getElementById("measure-button").addEventListener("click", finalizeGame);
    return true; // ゲーム終了
  }
  return false; // ゲーム継続
}

// 空セルのカウント、および黒/白が動けるセルのカウント
function countAvailableMovesAndEmptyCells() {
  let blackMoves = 0, whiteMoves = 0, emptyCells = 0;
  boardState.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === null) {
        emptyCells++;
        if (getFlippablePieces(rowIndex, colIndex, "black").length > 0) blackMoves++;
        if (getFlippablePieces(rowIndex, colIndex, "white").length > 0) whiteMoves++;
      }
    });
  });
  return emptyCells === 0 || (blackMoves === 0 && whiteMoves === 0);
}


// --- 観測とゲーム終了処理 ---
export function finalizeGame() {
  // エンタングルメントのペアごとに結果を決定
  const entangledResults = new Map(); // ペアの結果を保存

  entanglementState.pairs.forEach(pair => {
    const cell1 = boardState.board[pair.piece1.row][pair.piece1.col];
    const cell2 = boardState.board[pair.piece2.row][pair.piece2.col];
    
    // 最初の結果をランダムに決定
    const firstResult = Math.random() < 0.5 ? "white" : "black";
    
    // ペアの種類に応じて2つ目の結果を決定
    let secondResult;
    if (cell1 === cell2) {
      // 同じ種類のペアは同じ結果
      secondResult = firstResult;
    } else {
      // 異なる種類のペアは反対の結果
      secondResult = firstResult === "white" ? "black" : "white";
    }

    // 結果を保存
    entangledResults.set(`${pair.piece1.row},${pair.piece1.col}`, firstResult);
    entangledResults.set(`${pair.piece2.row},${pair.piece2.col}`, secondResult);
  });

  // 盤面全体の更新
  boardState.board.flat().forEach((cell, index) => {
    const row = Math.floor(index / boardSize);
    const col = index % boardSize;
    
    if (cell === "grayPlus" || cell === "grayMinus") {
      // 通常の重ね合わせ状態の駒
      boardState.board[row][col] = Math.random() < 0.5 ? "white" : "black";
    } else if (cell === "whiteBlack" || cell === "blackWhite") {
      // エンタングルした駒
      const result = entangledResults.get(`${row},${col}`);
      if (result) {
        boardState.board[row][col] = result;
      }
    }
  });
  
  setVisibility("reset-button", true);
  updateBoard();
  
  // 勝者判定
  const flatCells = boardState.board.flat();
  const whiteCount = flatCells.filter(c => c === "white").length;
  const blackCount = flatCells.filter(c => c === "black").length;
  
  if (whiteCount === blackCount) {
    showPopupMessage("引き分け！");
  } else {
    const winner = whiteCount > blackCount ? "白" : "黒";
    showPopupMessage(`勝者: ${winner}`);
  }
  setVisibility("measure-button", false);
}

// --- スキップ判定 ---
export function checkSkip() {
  let availableMoves = 0,
      emptyCells = 0;
  
  boardState.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === null) {
        emptyCells++;
        if (getFlippablePieces(rowIndex, colIndex, boardState.currentPlayer).length > 0) {
          availableMoves++;
        }
      }
    });
  });
  // 全ての盤面が埋まった場合
  if (emptyCells === 0) {
    showPopupMessage("ゲームが終了しました。測定ボタンを押して結果を確定させてください。");
    return true;
  }
  // 置ける場所がないとき
  if (availableMoves === 0) {
    // ここではスキップ時に相手の駒数を調整
    if (boardState.currentPlayer === "black") {
      boardState.pieces.white++;
    } else if (boardState.currentPlayer === "white") {
      boardState.pieces.black++;
    }
    showPopupMessage(`${boardState.currentPlayer === "black" ? "黒" : "白"}は置ける場所がありません。スキップします。`);
    // プレイヤー交代と各種表示更新
    boardState.currentPlayer = boardState.currentPlayer === "black" ? "white" : "black";
    updateBoard();
    return true;
  }
  return false;
}

