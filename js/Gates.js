import {
  showPopupMessage, 
  highlightPlacedPiece, 
  highlightRedPlacedPiece, 
  addEntanglement, 
  entanglementState, 
  drawEntanglements
} from "./UI.js";
import {updateBoard, boardState, boardSize, updateCellDiv} from "./Board.js";
import {checkGameOver} from "./Game.js";
import {playerChange} from "./Player.js";
import { gameState } from "./GameMode.js";

export const gateState = {
  firstCNOTSelection: null,
  firstSWAPSelection: null
};

//H,X,Y,Zの作用を定義
export async function applyPieceEffect(row, col, effect) {
  const target = boardState.board[row][col];
  const newValue = getNewValue(target, effect);
  boardState.board[row][col] = newValue;
  
  const cellDiv = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (cellDiv) {
    await updateCellDiv(cellDiv, newValue, true); // アニメーションフラグをtrueに
  }
}

// ヘルパー関数：新しい値を取得
function getNewValue(target, effect) {
  switch (effect) {
    case "X":
      return target === "white" ? "black" : 
             target === "black" ? "white" : target;
    case "H":
      return target === "white" ? "grayPlus" :
             target === "black" ? "grayMinus" :
             target === "grayPlus" ? "white" :
             target === "grayMinus" ? "black" : target;
    case "Y":
      return target === "white" ? "black" :
             target === "black" ? "white" :
             target === "grayPlus" ? "grayMinus" :
             target === "grayMinus" ? "grayPlus" : target;
    case "Z":
      return target === "grayPlus" ? "grayMinus" :
             target === "grayMinus" ? "grayPlus" : target;
    default:
      return target;
  }
}

// CNOTゲートの実装
export function applyCNOT(row, col) {
  if (boardState.currentPlayer === "white" && gameState.cnotUsedWhite || 
      boardState.currentPlayer === "black" && gameState.cnotUsedBlack) {
    showPopupMessage("CNOTゲートは一度しか使用できません！");
    return;
  }

  const gateName = boardState.currentPlayer === "white" ? "Black CNOT" : "White CNOT";

  if (!gameState.firstCNOTSelection) {
    // 最初の選択
    const validFirstPieces = ["grayPlus", "grayMinus"];
    if (boardState.currentPlayer === "white") validFirstPieces.push("black");
    if (boardState.currentPlayer === "black") validFirstPieces.push("white");

    if (validFirstPieces.includes(boardState.board[row][col])) {
      // Grayの駒の場合、上下左右に隣接する駒があるか確認
      if ((boardState.board[row][col] === "grayPlus" || 
           boardState.board[row][col] === "grayMinus") && 
          !hasOrthogonallyAdjacentPiece(row, col)) {
        showPopupMessage("Grayの駒は上下左右に隣接する駒がある場所でのみ選択できます！");
        return;
      }

      gameState.firstCNOTSelection = { row, col, type: boardState.board[row][col] };
      if (boardState.board[row][col] === "white" || boardState.board[row][col] === "black") {
        highlightAdjacentTargets(row, col); // 隣接駒をハイライト
      } else {
        highlightAdjacentTargets(row, col, true); // 上下左右のみをハイライト
      }

      highlightPlacedPiece(row, col);
      showPopupMessage(`${gateName}: 隣接する駒を選択してください`);
    } else {
      showPopupMessage(`${gateName}: 適切な駒を選択してください！`);
    }
  } else {
    // 2つ目の選択
    const firstType = gameState.firstCNOTSelection.type;
    const secondType = boardState.board[row][col];
    const firstRow = gameState.firstCNOTSelection.row;
    const firstCol = gameState.firstCNOTSelection.col;

    if ( (firstType === "black" || firstType === "white") &&
          !isAdjacent(firstRow, firstCol, row, col)) {
      showPopupMessage(`${gateName}: 適切な駒を選択してください！`);
      return;
    } else if ((firstType === "grayPlus" || firstType === "grayMinus") &&
          (!isAdjacent(firstRow, firstCol, row, col) || !hasOrthogonallyAdjacentPiece(row, col))) {
      showPopupMessage(`${gateName}: 適切な駒を選択してください！`);
      return;
    } else {
      // CNOTの効果を適用
      applyCNOTEffect(firstRow, firstCol, row, col, firstType, secondType, 
                      boardState.currentPlayer === "white");
      if (boardState.board[row][col] === "whiteBlack" || boardState.board[row][col] === "blackWhite") {
        showPopupMessage("Entanglement!!");
        addEntanglement(firstRow, firstCol, row, col);
      } else {
        showPopupMessage(`${gateName}！`);
      }
    }
  }
}

// 上下左右の隣接判定
function isOrthogonallyAdjacent(row1, col1, row2, col2) {
  return (Math.abs(row1 - row2) === 1 && col1 === col2) || 
         (Math.abs(col1 - col2) === 1 && row1 === row2);
}

// 上下左右すべてに隣接する駒があるか確認
function hasOrthogonallyAdjacentPiece(row, col) {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 上、下、左、右
  
  // すべての方向に駒があるかチェック
  return directions.every(([dx, dy]) => {
    const newRow = row + dx;
    const newCol = col + dy;
    return newRow >= 0 && newRow < boardSize && 
           newCol >= 0 && newCol < boardSize && 
           boardState.board[newRow][newCol] !== null;
  });
}

// CNOTの効果を適用する関数
function applyCNOTEffect(row1, col1, row2, col2, firstType, secondType, isWhitePlayer) {
  const effects = isWhitePlayer ? blackCNOTEffects : whiteCNOTEffects;
  const key = `${firstType}/${secondType}`;
  const effect = effects[key];
  
  if (effect) {
    boardState.board[row1][col1] = effect.first;
    boardState.board[row2][col2] = effect.second;

  }
  if (boardState.currentPlayer === "white") gameState.cnotUsedWhite = true;
  if (boardState.currentPlayer === "black") gameState.cnotUsedBlack = true;
  updateBoard();
  checkGameOver();
  playerChange();
  highlightPlacedPiece(row1, col1);
  highlightRedPlacedPiece(row2, col2);
  gameState.firstCNOTSelection = null;
}

// Black CNOTの効果マップ
const blackCNOTEffects = {
  'black/white': { first: 'black', second: 'black' },
  'black/black': { first: 'black', second: 'white' },
  'black/grayPlus': { first: 'black', second: 'grayPlus' },
  'black/grayMinus': { first: 'black', second: 'grayMinus' },
  'grayPlus/grayPlus': { first: 'grayPlus', second: 'grayPlus' },
  'grayPlus/grayMinus': { first: 'grayMinus', second: 'grayMinus' },
  'grayMinus/grayPlus': { first: 'grayMinus', second: 'grayPlus' },
  'grayMinus/grayMinus': { first: 'grayPlus', second: 'grayMinus' },
  'grayPlus/white': { first: 'whiteBlack', second: 'whiteBlack' },
  'grayPlus/black': { first: 'whiteBlack', second: 'blackWhite' },
  'grayMinus/white': { first: 'blackWhite', second: 'blackWhite' },
  'grayMinus/black': { first: 'blackWhite', second: 'whiteBlack' }
};

// White CNOTの効果マップ
const whiteCNOTEffects = {
  'white/white': { first: 'white', second: 'black' },
  'white/black': { first: 'white', second: 'white' },
  'white/grayPlus': { first: 'white', second: 'grayPlus' },
  'white/grayMinus': { first: 'white', second: 'grayMinus' },
  'grayPlus/grayPlus': { first: 'grayPlus', second: 'grayPlus' },
  'grayPlus/grayMinus': { first: 'grayMinus', second: 'grayMinus' },
  'grayMinus/grayPlus': { first: 'grayMinus', second: 'grayPlus' },
  'grayMinus/grayMinus': { first: 'grayPlus', second: 'grayMinus' },
  'grayPlus/white': { first: 'whiteBlack', second: 'blackWhite' },
  'grayPlus/black': { first: 'whiteBlack', second: 'whiteBlack' },
  'grayMinus/white': { first: 'blackWhite', second: 'whiteBlack' },
  'grayMinus/black': { first: 'blackWhite', second: 'blackWhite' }
};

// ハイライト関数を修正
function highlightAdjacentTargets(row, col, orthogonalOnly = false) {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("highlightRed");
  });

  const firstPieceType = boardState.board[row][col];
  const isGrayPiece = firstPieceType === "grayPlus" || firstPieceType === "grayMinus";

  // 白/黒の駒の場合は全方向、Grayの駒の場合は上下左右のみ
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];

  directions.forEach(([dx, dy]) => {
    const targetRow = row + dx;
    const targetCol = col + dy;

    if (targetRow >= 0 && targetRow < boardSize &&
        targetCol >= 0 && targetCol < boardSize &&
        boardState.board[targetRow][targetCol] !== null) {
      
      // Grayの駒の場合は、ターゲットの駒も上下左右すべてに駒が接している必要がある
      if (isGrayPiece) {
        if (hasOrthogonallyAdjacentPiece(targetRow, targetCol)) {
          const cellDiv = document.querySelector(
            `.cell[data-row="${targetRow}"][data-col="${targetCol}"]`
          );
          if (cellDiv) {
            cellDiv.classList.add("highlightRed");
          }
        }
      } else {
        // 白/黒の駒の場合は、単純に隣接する駒すべてをハイライト
        const cellDiv = document.querySelector(
          `.cell[data-row="${targetRow}"][data-col="${targetCol}"]`
        );
        if (cellDiv) {
          cellDiv.classList.add("highlightRed");
        }
      }
    }
  });
}

// CNOTで選択可能な駒をハイライト
export function highlightAvailableCNOTTargets() {
  document.querySelectorAll(".cell").forEach((cell) => {
      cell.classList.remove("highlightBlue");
      cell.classList.remove("highlight");
  });

  const targetPieceColor = boardState.currentPlayer === "white" ? "black" : "white";

  boardState.board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
      if (boardState.board[rowIndex][colIndex] === targetPieceColor) {
          const cellDiv = document.querySelector(
          `.cell[data-row="${rowIndex}"][data-col="${colIndex}"]`
          );
          if (cellDiv) {
          cellDiv.classList.add("highlightRed");
          }
      }

      // Grayの駒で、上下左右に隣接する駒がある場合のハイライト
      if (boardState.board[rowIndex][colIndex] === "grayPlus" || 
        boardState.board[rowIndex][colIndex] === "grayMinus") {
      if (hasOrthogonallyAdjacentPiece(rowIndex, colIndex)) {
        const cellDiv = document.querySelector(
          `.cell[data-row="${rowIndex}"][data-col="${colIndex}"]`
        );
        if (cellDiv) {
          cellDiv.classList.add("highlightRed");
        }
      }
    }


      });
  });
 
}

// // 1回目の選択後、周囲の駒をハイライト
// function highlightAdjacentTargets(row, col) {
//   document.querySelectorAll(".cell").forEach((cell) => {
//     cell.classList.remove("highlightRed"); // 既存のハイライトを削除
//   });
//   const directions = [
//     [-1, 0], [1, 0], [0, -1], [0, 1], // 上下左右
//     [-1, -1], [-1, 1], [1, -1], [1, 1] // 斜め
//   ];

//   directions.forEach(([dx, dy]) => {
//     const targetRow = row + dx;
//     const targetCol = col + dy;

//     if (
//       targetRow >= 0 && targetRow < boardSize &&
//       targetCol >= 0 && targetCol < boardSize &&
//       boardState.board[targetRow][targetCol] !== null
//     ) {
//       const cellDiv = document.querySelector(
//         `.cell[data-row="${targetRow}"][data-col="${targetCol}"]`
//       );
//       if (cellDiv) {
//         cellDiv.classList.add("highlightRed"); // ハイライト
//       }
//     }
//   });
// }

// 隣接判定関数
function isAdjacent(row1, col1, row2, col2) {
  const rowDiff = Math.abs(row1 - row2);
  const colDiff = Math.abs(col1 - col2);
  // 隣接しているか確認**
  const isNextTo = (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0));
  // そのセルに駒があることを確認**
  const hasPiece = boardState.board[row2][col2] !== null;
  // 両方の条件を満たす場合のみ true を返す
  return isNextTo && hasPiece;
}


// SWAPゲートの実装
export async function applySWAP(row, col) {
  if (boardState.currentPlayer === "white" && gameState.swapUsedWhite || 
      boardState.currentPlayer === "black" && gameState.swapUsedBlack) {
    showPopupMessage("SWAPゲートは一度しか使用できません！");
    return;
  }

  if (!gameState.firstSWAPSelection) {
    // 最初の選択
    if (boardState.board[row][col] !== null) {
      gameState.firstSWAPSelection = { row, col };
      highlightAdjacentTargets(row, col);
      highlightPlacedPiece(row, col);
      showPopupMessage("SWAP: 入れ替える駒を選択してください");
    } else {
      showPopupMessage("SWAPできる駒を選択してください！");
    }
  } else {
    // 2つ目の選択
    if (isAdjacent(gameState.firstSWAPSelection.row, gameState.firstSWAPSelection.col, row, col)) {
      const firstRow = gameState.firstSWAPSelection.row;
      const firstCol = gameState.firstSWAPSelection.col;
      const secondRow = row;
      const secondCol = col;

      console.log("SWAP前のエンタングル状態:", JSON.stringify(entanglementState.pairs));
      console.log(`SWAP: (${firstRow},${firstCol}) <-> (${secondRow},${secondCol})`);

      // 駒の交換
      const tempPiece = boardState.board[firstRow][firstCol];
      boardState.board[firstRow][firstCol] = boardState.board[row][col];
      boardState.board[row][col] = tempPiece;

      // エンタングルメントの更新（配列をコピーして処理）
      const updatedPairs = entanglementState.pairs.map(pair => {
        const newPair = { ...pair };
        
        // 最初の駒の位置を更新
        if (pair.piece1.row === firstRow && pair.piece1.col === firstCol) {
          newPair.piece1 = { row: secondRow, col: secondCol };
        } else if (pair.piece1.row === secondRow && pair.piece1.col === secondCol) {
          newPair.piece1 = { row: firstRow, col: firstCol };
        }
        
        // 2つ目の駒の位置を更新
        if (pair.piece2.row === firstRow && pair.piece2.col === firstCol) {
          newPair.piece2 = { row: secondRow, col: secondCol };
        } else if (pair.piece2.row === secondRow && pair.piece2.col === secondCol) {
          newPair.piece2 = { row: firstRow, col: firstCol };
        }
        
        return newPair;
      });

      // 更新したペア情報を設定
      entanglementState.pairs = updatedPairs;

      console.log("SWAP後のエンタングル状態:", JSON.stringify(entanglementState.pairs));

      // エンタングルメントの線を再描画
      drawEntanglements();

      if (boardState.currentPlayer === "white") gameState.swapUsedWhite = true;
      if (boardState.currentPlayer === "black") gameState.swapUsedBlack = true;

      updateBoard();
      checkGameOver();
      playerChange();
      highlightPlacedPiece(firstRow, firstCol);
      highlightRedPlacedPiece(secondRow, secondCol);
      gameState.firstSWAPSelection = null;
      showPopupMessage("SWAP!");
    } else {
      showPopupMessage("SWAP: 隣接する駒を選択してください！");
    }
  }
}

// SWAPで選択可能な駒をハイライト
export function highlightAvailableSWAPTargets() {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("highlightBlue"); // 既存のハイライトを削除
  });
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("highlight"); // 既存のハイライトを削除
  });

  boardState.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (boardState.board[rowIndex][colIndex] !== null) {
        const cellDiv = document.querySelector(
          `.cell[data-row="${rowIndex}"][data-col="${colIndex}"]`
        );
        if (cellDiv) {
          cellDiv.classList.add("highlightRed");
        }
      }
    });
  });
}

export function applyCpuCNOT() {
  const blackPieces = [];

  // 黒い駒の座標を取得
  boardState.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (boardState.board[rowIndex][colIndex] === "black") {
        blackPieces.push({ row: rowIndex, col: colIndex });
      }
    });
  });

  if (blackPieces.length === 0) return; // 黒の駒がなければ終了

  // ランダムに黒駒を選択
  const selectedBlackPiece = blackPieces[Math.floor(Math.random() * blackPieces.length)];
  const row1 = selectedBlackPiece.row;
  const col1 = selectedBlackPiece.col;
  applyCNOT(row1, col1);

  // 隣接する駒からランダムに選択
  const AdjacentPieces = [];
  boardState.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (isAdjacent(row1, col1, rowIndex, colIndex)) {
        AdjacentPieces.push({ row: rowIndex, col: colIndex });
      }
    });
  });

  const selectedAdjacentPiece = AdjacentPieces[Math.floor(Math.random() * AdjacentPieces.length)];
  const row2 = selectedAdjacentPiece.row;
  const col2 = selectedAdjacentPiece.col;
  applyCNOT(row2, col2)
}

export function applyCpuSWAP() {
  const PlacedPieces = [];

  // 駒がある座標を取得
  boardState.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      // console.log("rowIndex:", rowIndex, "colIndex:", colIndex); //デバッグログ
      if (boardState.board[rowIndex][colIndex] !== null) {
        // console.log("Not null!"); //デバッグログ
        PlacedPieces.push({ row: rowIndex, col: colIndex });
      }
    });
  });
  // console.log("PlacedPieces:", PlacedPieces); //デバッグログ
  
  // ランダムに駒を選択
  const selectedPlacedPiece = PlacedPieces[Math.floor(Math.random() * PlacedPieces.length)];
  // console.log("selectedPlacedPiece:", selectedPlacedPiece); //デバッグログ
  const row1 = selectedPlacedPiece.row;
  const col1 = selectedPlacedPiece.col;
  applySWAP(row1, col1);

  // 隣接する駒からランダムに選択
  const AdjacentPieces = [];
  boardState.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (isAdjacent(row1, col1, rowIndex, colIndex)) {
        AdjacentPieces.push({ row: rowIndex, col: colIndex });
      }
    });
  });
  // console.log("AdjacentPieces:", AdjacentPieces); //デバッグログ

  const selectedAdjacentPiece = AdjacentPieces[Math.floor(Math.random() * AdjacentPieces.length)];
  // console.log("selectedAdjacentPiece:", selectedAdjacentPiece); //デバッグログ
  const row2 = selectedAdjacentPiece.row;
  const col2 = selectedAdjacentPiece.col;
  applySWAP(row2, col2)
}