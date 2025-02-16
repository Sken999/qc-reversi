import { gameState } from "./GameMode.js";
import { boardState, boardSize, initBoard } from "./Board.js";
import { highlightAvailableCNOTTargets, highlightAvailableSWAPTargets } from "./Gates.js";

/**
 * ヘルパー：指定のセレクタに一致するボタン群の中から、
 * ボタンIDが prefix + value と一致するものだけ active クラスを付与する。
 */
function setActiveButton(selector, prefix, value) {
  const buttons = document.querySelectorAll(selector);
  const targetId = prefix + value;
  buttons.forEach(button => {
    button.classList.toggle("active", button.id === targetId);
  });
}

/**
 * 駒選択
 */
export function selectPiece(piece) {
  if (boardState.pieces[piece] > 0) {
    gameState.selectedPiece = piece;
    setActiveButton(".piece-button", "select-", gameState.selectedPiece);
    updateGateSelector(); // 選択可能な Gate の更新
  } else {
    // 駒が残っていない場合、別の駒を自動選択
    const availablePieces = boardState.currentPlayer === "black"
      ? ["black", "grayMinus"]
      : ["white", "grayPlus"];
    for (let altPiece of availablePieces) {
      if (boardState.pieces[altPiece] > 0) {
        gameState.selectedPiece = altPiece;
        setActiveButton(".piece-button", "select-", gameState.selectedPiece);
        updateGateSelector();
        return;
      }
    }
    // 使用可能な駒がない場合
    showPopupMessage("使用可能な駒がありません！");
  }
}

/**
 * Gate選択
 */
export function selectGate(gate) {
  gameState.selectedGate = gate;

  // 既存の赤ハイライト削除、盤面再ハイライト、選択状態のリセット
  document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("highlightRed"));
  highlightAvailableMoves();
  gameState.firstCNOTSelection = null;
  gameState.firstSWAPSelection = null;

  // Gateボタンのハイライト更新
  setActiveButton(".gate-button", "select-", gate);

  // Gate固有のハイライト処理
  if (gate === "CNOT") {
    highlightAvailableCNOTTargets();
  } else if (gate === "SWAP") {
    highlightAvailableSWAPTargets();
  }
}

/**
 * 駒数の更新
 */
export function updatePieceCount() {
  document.getElementById("white-count").textContent = boardState.pieces.white;
  document.getElementById("grayPlus-count").textContent = boardState.pieces.grayPlus;
  document.getElementById("black-count").textContent = boardState.pieces.black;
  document.getElementById("grayMinus-count").textContent = boardState.pieces.grayMinus;
}

/**
 * ひっくり返せる駒を取得する関数
 */
export function getFlippablePieces(row, col, player) {
  let flippablePieces = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  // 自分の駒と相手の駒の種類を定義
  // const playerPieces = player === "black" ? ["black", "grayMinus"] : ["white", "grayPlus"];
  // const opponentPieces = player === "black" ? ["white", "grayPlus"] : ["black", "grayMinus"];
  const playerPieces = player === "black" ? ["black", "whiteBlack", "blackWhite"] : ["white", "whiteBlack", "blackWhite"];
  // const playerPieces = player === "black" ? ["black"] : ["white"];
  // const opponentPieces = player === "black" ? ["white", "grayPlus"] : ["black", "grayMinus"];
  const opponentPieces = player === "black" ? ["white", "grayPlus", "grayMinus"] : ["black", "grayMinus", "grayPlus"];

  directions.forEach(([dx, dy]) => {
    let r = row + dx;
    let c = col + dy;
    let potentialFlips = [];
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
      const cellValue = boardState.board[r][c];
      if (cellValue === null) break; // 空マス到達
      if (playerPieces.includes(cellValue)) {
        flippablePieces = flippablePieces.concat(potentialFlips);
        break;
      }
      if (opponentPieces.includes(cellValue)) {
        potentialFlips.push([r, c]);
      } else {
        break;
      }
      r += dx;
      c += dy;
    }
  });

  return flippablePieces;
}

/**
 * 盤面上、置ける場所（ひっくり返せる駒がある場所）に highlight クラスを付与
 */
export function highlightAvailableMoves() {
  // 全セルからハイライト削除
  document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("highlight"));

  boardState.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === null) {
        const flips = getFlippablePieces(rowIndex, colIndex, boardState.currentPlayer);
        if (flips.length > 0) {
          const cellDiv = document.querySelector(`.cell[data-row="${rowIndex}"][data-col="${colIndex}"]`);
          if (cellDiv) cellDiv.classList.add("highlight");
        }
      }
    });
  });
}

/**
 * 指定セルに対して blue または red のハイライトを追加
 */
export function highlightPlacedPiece(row, col) {
  const cell = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
  if (cell) cell.classList.add("highlightBlue");
}

export function highlightRedPlacedPiece(row, col) {
  const cell = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
  if (cell) cell.classList.add("highlightRed");
}

/**
 * 駒選択ボタンの表示更新
 */
export function updatePieceSelector() {
  const selectButtons = {
    white: document.getElementById("select-white"),
    grayPlus: document.getElementById("select-grayPlus"),
    black: document.getElementById("select-black"),
    grayMinus: document.getElementById("select-grayMinus")
  };

  function showButtons(buttonsToShow) {
    Object.values(selectButtons).forEach(btn => btn.classList.add("hidden"));
    buttonsToShow.forEach(btn => btn.classList.remove("hidden"));
  }

  const current = boardState.currentPlayer;
  if (gameState.selectedStep === "step0") {
    if (current === "black") {
      showButtons([selectButtons.black]);
      selectPiece("black");
    } else if (current === "white") {
      showButtons([selectButtons.white]);
      selectPiece("white");
    }
  } else {
    if (current === "black") {
      showButtons([selectButtons.black, selectButtons.grayMinus]);
      selectPiece("black");
    } else if (current === "white") {
      showButtons([selectButtons.white, selectButtons.grayPlus]);
      selectPiece("white");
    }
  }
}

/**
 * Gate選択ボタンの表示更新
 */
export function updateGateSelector() {
  const gateButtons = {
    X: document.getElementById("select-X"),
    H: document.getElementById("select-H"),
    Y: document.getElementById("select-Y"),
    Z: document.getElementById("select-Z"),
    CNOT: document.getElementById("select-CNOT"),
    SWAP: document.getElementById("select-SWAP")
  };

  // ヘルパー：指定したボタン群のみ表示する（X, H, Y, Z）
  function showGateButtons(buttonsToShow) {
    ["X", "H", "Y", "Z"].forEach(key => gateButtons[key].classList.add("hidden"));
    buttonsToShow.forEach(btn => btn.classList.remove("hidden"));
  }

  // CNOT / SWAP の表示条件処理
  gateButtons.CNOT.classList.add("hidden");
  if (gameState.isCNOTSelected) {
    gateButtons.CNOT.classList.remove("hidden");
    if (
      (boardState.currentPlayer === "white" && gameState.cnotUsedWhite) ||
      (boardState.currentPlayer === "black" && gameState.cnotUsedBlack)
    ) {
      gateButtons.CNOT.classList.add("hidden");
    }
  }
  gateButtons.SWAP.classList.add("hidden");
  if (gameState.isSWAPSelected) {
    gateButtons.SWAP.classList.remove("hidden");
    if (
      (boardState.currentPlayer === "white" && gameState.swapUsedWhite) ||
      (boardState.currentPlayer === "black" && gameState.swapUsedBlack)
    ) {
      gateButtons.SWAP.classList.add("hidden");
    }
  }

  // ゲームモード（selectedStep）と選択駒に応じた表示・自動選択
  const step = gameState.selectedStep;
  const piece = gameState.selectedPiece;
  const isBasicPiece = (piece === "black" || piece === "white");

  if (step === "step0") {
    showGateButtons([gateButtons.X]);
    selectGate("X");
  } else if (step === "step1") {
    if (isBasicPiece) {
      showGateButtons([gateButtons.X]);
      selectGate("X");
    } else {
      showGateButtons([gateButtons.H]);
      selectGate("H");
    }
  } else if (step === "step2") {
    if (isBasicPiece) {
      showGateButtons([gateButtons.X, gateButtons.Y]);
      selectGate("X");
    } else {
      showGateButtons([gateButtons.H]);
      selectGate("H");
    }
  } else if (step === "step3") {
    if (isBasicPiece) {
      showGateButtons([gateButtons.X]);
      selectGate("X");
    } else {
      showGateButtons([gateButtons.H, gateButtons.Z]);
      selectGate("H");
    }
  } else if (step === "step4") {
    if (isBasicPiece) {
      showGateButtons([gateButtons.X, gateButtons.Y]);
      selectGate("X");
    } else {
      showGateButtons([gateButtons.H, gateButtons.Z]);
      selectGate("H");
    }
  }
}

/**
 * 現在のプレイヤー表示更新
 */
export function updateCurrentPlayerDisplay() {
  const playerDisplay = document.getElementById("current-player");
  playerDisplay.textContent = `現在の番: ${boardState.currentPlayer === "black" ? "黒" : "白"}`;
}

/**
 * スコア更新
 */
export function updateScore() {
  let blackCount = 0, whiteCount = 0, grayCount = 0;
  boardState.board.forEach(row => {
    row.forEach(cell => {
      if (cell === "black") blackCount++;
      if (cell === "white") whiteCount++;
      if (cell === "grayPlus" || cell === "grayMinus") grayCount++;
    });
  });
  const scoreBoard = document.getElementById("score-board");
  scoreBoard.textContent = `Black: ${blackCount} | White: ${whiteCount} | Gray: ${grayCount}`;
}

/**
 * ポップアップメッセージ表示
 */
export function showPopupMessage(message) {
  const popup = document.getElementById("popup-message");
  popup.textContent = message;
  popup.classList.remove("hidden");
  setTimeout(() => popup.classList.add("hidden"), 1000);
}

// --- リセットボタンの初期化処理 ---
document.getElementById("reset-button").addEventListener("click", initBoard);

// エンタングルした駒の情報を管理するオブジェクト
export const entanglementState = {
  pairs: [], // {piece1: {row, col}, piece2: {row, col}, id: number}
  currentId: 1
};

// エンタングル状態を追加する関数
export function addEntanglement(row1, col1, row2, col2) {
  entanglementState.pairs.push({
    piece1: { row: row1, col: col1 },
    piece2: { row: row2, col: col2 },
    id: entanglementState.currentId++
  });
  drawEntanglements();
}

// エンタングル状態の描画を更新
export function drawEntanglements() {
  // 既存の線を削除
  const existingContainer = document.querySelector('.entanglement-lines');
  if (existingContainer) existingContainer.remove();

  // コンテナ要素の作成
  const container = document.createElement('div');
  container.classList.add('entanglement-lines');
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '10';

  const boardElement = document.getElementById('game-board');
  if (!boardElement) return;
  
  boardElement.style.position = 'relative';
  boardElement.appendChild(container);

  // 各ペアの線を描画
  entanglementState.pairs.forEach(pair => {
    const cell1 = document.querySelector(
      `.cell[data-row="${pair.piece1.row}"][data-col="${pair.piece1.col}"]`
    );
    const cell2 = document.querySelector(
      `.cell[data-row="${pair.piece2.row}"][data-col="${pair.piece2.col}"]`
    );

    if (cell1 && cell2) {
      // セルの位置を取得
      const rect1 = cell1.getBoundingClientRect();
      const rect2 = cell2.getBoundingClientRect();
      const boardRect = boardElement.getBoundingClientRect();

      const cellWidth = rect1.width;
      const cellHeight = rect1.height;
      const x1 = rect1.left - boardRect.left + (cellWidth / 2);
      const y1 = rect1.top - boardRect.top + (cellHeight / 2);
      const x2 = rect2.left - boardRect.left + (cellWidth / 2);
      const y2 = rect2.top - boardRect.top + (cellHeight / 2);

      // 2点間の距離と角度を計算
      const dx = x2 - x1;
      const dy = y2 - y1;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // 線要素の作成
      const line = document.createElement('div');
      line.classList.add('entanglement-line');
      line.style.position = 'absolute';
      line.style.left = `${x1}px`;
      line.style.top = `${y1}px`;
      line.style.width = `${distance}px`;
      line.style.height = '2px';
      line.style.backgroundColor = 'yellow';
      line.style.border = '1px solid black';
      line.style.borderRadius = '3px';
      line.style.transformOrigin = 'left center';
      line.style.transform = `rotate(${angle}deg)`;

      container.appendChild(line);
    }
  });
}
