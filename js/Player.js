import { boardState, updateBoard, updateCellDiv } from "./Board.js";
import {
  applyCpuCNOT,
  applyCpuSWAP,
  applyCNOT,
  applySWAP,
  applyPieceEffect
} from "./Gates.js";
import {
  highlightPlacedPiece,
  showPopupMessage,
  selectPiece,
  getFlippablePieces,
  selectGate
} from "./UI.js";
import { checkGameOver, checkSkip } from "./Game.js";
import { gameState } from "./GameMode.js";

export const PlayerState = {
  selectedPiece: "white",
  selectedGate: "X",
};

// ── 駒を置く処理 ──────────────────────────────

// export function placePiece(row, col) {
//   const gate = gameState.selectedGate;

//   if (gate === "CNOT") {
//     return applyCNOT(row, col);
//   }
//   if (gate === "SWAP") {
//     return applySWAP(row, col);
//   }

//   // 既に駒がある or 挟める駒がない場合は何もしない
//   if (boardState.board[row][col] !== null) return;
//   const flippedPieces = getFlippablePieces(row, col, boardState.currentPlayer);
//   if (flippedPieces.length === 0) return;

//   showPopupMessage(`[Last operation] ${gameState.selectedPiece}: ${gate}`);

//   // 駒を置き、使用駒数を減少
//   boardState.board[row][col] = gameState.selectedPiece;
//   boardState.pieces[gameState.selectedPiece]--;

//   // 挟んだ駒へ効果適用
//   flippedPieces.forEach(([r, c]) => applyPieceEffect(r, c, gate));

//   updateBoard();
//   checkGameOver();
//   playerChange();
//   highlightPlacedPiece(row, col);
// }

// 駒をひっくり返す処理を非同期関数として実装
async function flipPieces(flippablePieces, row, col, effect) {
  // 置いた位置からの距離でソート（チェビシェフ距離を使用）
  const piecesWithDistance = flippablePieces.map(([r, c]) => ({
    row: r,
    col: c,
    distance: Math.max(Math.abs(r - row), Math.abs(c - col))
  }));

  // 距離でグループ化
  const groupedPieces = piecesWithDistance.reduce((groups, piece) => {
    const dist = piece.distance;
    if (!groups[dist]) groups[dist] = [];
    groups[dist].push(piece);
    return groups;
  }, {});

  // 距離の小さい順に処理
  const distances = Object.keys(groupedPieces).sort((a, b) => Number(a) - Number(b));

  await new Promise(resolve => setTimeout(resolve, 100));

  // 各距離グループごとに同時に処理
  for (const distance of distances) {
    const pieces = groupedPieces[distance];
    
    // 同じ距離の駒を同時にひっくり返す
    pieces.forEach(piece => {
      applyPieceEffect(piece.row, piece.col, effect);
      updateCell(piece.row, piece.col);
    });
    // 次の距離グループの処理前に待機
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

// セルの更新処理
function updateCell(row, col) {
  const cellDiv = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (cellDiv) {
    updateCellDiv(cellDiv, boardState.board[row][col]);
  }
}

// placePiece関数を非同期関数に修正
export async function placePiece(row, col) {
  const gate = gameState.selectedGate;

  if (gate === "CNOT") {
    return applyCNOT(row, col);
  }
  if (gate === "SWAP") {
    return applySWAP(row, col);
  }

  // 既に駒がある or 挟める駒がない場合は何もしない
  if (boardState.board[row][col] !== null) return;
  const flippablePieces = getFlippablePieces(row, col, boardState.currentPlayer);
  if (flippablePieces.length === 0) return;

  showPopupMessage(`[Last operation] ${gameState.selectedPiece}: ${gate}`);

  // 駒を置き、使用駒数を減少
  boardState.board[row][col] = gameState.selectedPiece;
  boardState.pieces[gameState.selectedPiece]--;
  updateCell(row, col);

  // 順番に駒をひっくり返す
  await flipPieces(flippablePieces, row, col, gate);

  updateBoard();
  checkGameOver();
  playerChange();
  highlightPlacedPiece(row, col);
}


// ── プレイヤー交代 ──────────────────────────────

export function playerChange() {
  boardState.currentPlayer =
    boardState.currentPlayer === "black" ? "white" : "black";

  updateBoard();

  // シングルプレイヤーかつ、CPUのターンなら500ms後にCPU動作
  if (
    gameState.isSinglePlayer &&
    boardState.currentPlayer === gameState.cpuPlayer &&
    !checkGameOver() &&
    !checkSkip()
  ) {
    setTimeout(cpuMove, 500);
    return;
  }
  // 次の手番で置ける場所がない場合もスキップ処理
  checkSkip();
}

// ── CPU動作ロジック ──────────────────────────────

export function cpuMove() {
  const moves = [];

  // CPU用の Gate 発動判定処理（白／黒それぞれ共通の計算）
  const attemptCpuGate = (usedFlag, pieceKey1, pieceKey2, applyGateFunc) => {
    if (!gameState[usedFlag]) {
      const total = boardState.pieces[pieceKey1] + boardState.pieces[pieceKey2];
      // 1.5 を加えた数値を閾値とし、ランダム判定で Gate 発動
      if (Math.random() * (total + 1.5) > total) {
        applyGateFunc();
        return true;
      }
    }
    return false;
  };

  // CPUが白の場合
  if (gameState.cpuPlayer === "white") {
    if (attemptCpuGate("cnotUsedWhite", "white", "grayPlus", applyCpuCNOT)) return;
    if (attemptCpuGate("swapUsedWhite", "white", "grayPlus", applyCpuSWAP)) return;
  }
  // CPUが黒の場合
  else if (gameState.cpuPlayer === "black") {
    if (attemptCpuGate("cnotUsedBlack", "black", "grayMinus", applyCpuCNOT)) return;
    if (attemptCpuGate("swapUsedBlack", "black", "grayMinus", applyCpuSWAP)) return;
  }

  // ── CPU駒選択 ──
  const selectCpuPiece = (piece1, piece2) => {
    const total = boardState.pieces[piece1] + boardState.pieces[piece2];
    if (total > 0) {
      // 各駒の比率に応じて選択
      if (Math.random() * total < boardState.pieces[piece1]) {
        selectPiece(piece1);
      } else {
        selectPiece(piece2);
      }
    }
  };

  if (gameState.cpuPlayer === "white") {
    selectCpuPiece("white", "grayPlus");
  } else {
    selectCpuPiece("black", "grayMinus");
  }

  // ── Gate 選択（手番と選択駒に応じてランダムで変更） ──
  if (
    (gameState.selectedStep === "step2" || gameState.selectedStep === "step4") &&
    (gameState.selectedPiece === "white" || gameState.selectedPiece === "black")
  ) {
    if (Math.random() < 0.66) {
      selectGate("Y");
    }
  }
  if (
    (gameState.selectedStep === "step3" || gameState.selectedStep === "step4") &&
    (gameState.selectedPiece === "grayPlus" || gameState.selectedPiece === "grayMinus")
  ) {
    if (Math.random() < 0.5) {
      selectGate("Z"); // ※ 挟む駒の種類によって変化させる処理は今後実装予定
    }
  }

  // ── 駒を置ける場所の収集 ──
  boardState.board.forEach((rowArr, rowIndex) => {
    rowArr.forEach((cell, colIndex) => {
      if (cell === null) {
        const flips = getFlippablePieces(
          rowIndex,
          colIndex,
          boardState.currentPlayer,
          gameState.selectedPiece
        );
        if (flips.length > 0) {
          moves.push({ row: rowIndex, col: colIndex });
        }
      }
    });
  });

  // ランダムに選択した場所へ駒を置く
  if (moves.length > 0) {
    const move = moves[Math.floor(Math.random() * moves.length)];
    placePiece(move.row, move.col);
  }
}
