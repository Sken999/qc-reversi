import { gameState } from "./GameMode.js";
import {
    updatePieceCount,
    updatePieceSelector, 
    updateGateSelector, 
    updateCurrentPlayerDisplay, 
    updateScore, 
    selectPiece,
    highlightAvailableMoves,
    selectGate,
    entanglementState,
    showPopupMessage
} from "./UI.js";
import { placePiece, cpuMove } from "./Player.js";

export const boardState = {
    board: null,
    currentPlayer: "white",
    pieces: null
}
export const boardSize = 8;

// 盤面の初期化
export function initBoard() {
    // 盤面の初期化
    boardState.board = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));

    // エンタングルメントの状態をリセット
    entanglementState.pairs = [];
    entanglementState.currentId = 1;
    
    // コマ数初期化
    boardState.pieces = (gameState.selectedStep === "step0")
        ? { white: 30, black: 30 }
        : { white: 20, black: 20, grayPlus: 10, grayMinus: 10 };
    // 手番初期化
    boardState.currentPlayer = "white";

    // ゲート使用回数初期化
    if (gameState.isCNOTSelected) {
        gameState.cnotUsedWhite = false;
        gameState.cnotUsedBlack = false;
    }
    if (gameState.isSWAPSelected) {
        gameState.swapUsedWhite = false;
        gameState.swapUsedBlack = false;
    }

    // 初期配置
    boardState.board[3][3] = "white";
    boardState.board[4][4] = "white";
    boardState.board[3][4] = "black";
    boardState.board[4][3] = "black";

    // ゲームボード領域のクリア
    const gameBoard = document.getElementById("game-board");
    gameBoard.innerHTML = "";

    // --- 駒選択イベントリスナーの設定 ---
    const pieceTypes = ["white", "grayPlus", "black", "grayMinus"];
    pieceTypes.forEach(type => {
        document.getElementById(`select-${type}`)
        .addEventListener("click", () => selectPiece(type));
    });

    // --- Gate選択イベントリスナーの設定 ---
    updateGateSelector();
    const gateTypes = ["X", "H", "Y", "Z", "CNOT", "SWAP"];
    gateTypes.forEach(gate => {
        document.getElementById(`select-${gate}`)
        .addEventListener("click", () => selectGate(gate));
    });
    // --- 盤面セルの生成 ---
    boardState.board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
        const cellDiv = document.createElement("div");
        cellDiv.classList.add("cell");
        cellDiv.dataset.row = rowIndex;
        cellDiv.dataset.col = colIndex;
        updateCellDiv(cellDiv, cell);
        cellDiv.addEventListener("click", () => placePiece(rowIndex, colIndex));
        gameBoard.appendChild(cellDiv);
        });
    });
    showPopupMessage("Game Start!");
    // 盤面更新、手番表示、スコア更新
    updateBoard();
    // 一人プレイでプレイヤーが後攻の場合、CPUの初手を実行
    if (gameState.isSinglePlayer && !gameState.isPlayerTurn) {
        setTimeout(cpuMove, 500);
    }
}
  
// // --- セル要素の更新処理 ---
// // 指定のcellDivに対し、board上の値に応じたクラス・テキストを設定する
// export function updateCellDiv(cellDiv, cellValue) {
//     cellDiv.className = "cell"; // クラスをリセット
//     cellDiv.textContent = "";   // テキストをクリア

//     if (cellValue === "white" || cellValue === "black") {
//         cellDiv.classList.add(cellValue);
//     } else if (cellValue === "grayPlus") {
//         cellDiv.classList.add("grayPlus");
//         // cellDiv.textContent = "+";
//     } else if (cellValue === "grayMinus") {
//         cellDiv.classList.add("grayMinus");
//         // cellDiv.textContent = "-";
//     }
// }

// セル要素の更新処理を修正
export async function updateCellDiv(cellDiv, cellValue, animate = false) {
    cellDiv.className = "cell";
    const oldImg = cellDiv.querySelector('.piece-image');
    
    if (cellValue) {
        const newImg = document.createElement("img");
        newImg.className = "piece-image";
        
        // 駒の種類に応じて画像を設定
        switch (cellValue) {
            case "white":
                newImg.src = "assets/whitePiece.png";
                break;
            case "black":
                newImg.src = "assets/blackPiece.png";
                break;
            case "grayPlus":
                newImg.src = "assets/grayPlusPiece.png";
                break;
            case "grayMinus":
                newImg.src = "assets/grayMinusPiece.png";
                break;
            case "whiteBlack":
                newImg.src = "assets/whiteBlackPiece.png";
                break;
            case "blackWhite":
                newImg.src = "assets/blackWhitePiece.png";
                break;
        }

        if (animate && oldImg) {
            // アニメーション付きで駒を更新
            oldImg.classList.add('flipping');
            await new Promise(resolve => {
                oldImg.addEventListener('animationend', () => {
                    cellDiv.innerHTML = '';
                    cellDiv.appendChild(newImg);
                    resolve();
                }, { once: true });
            });
        } else {
            // アニメーションなしで即座に更新
            cellDiv.innerHTML = '';
            cellDiv.appendChild(newImg);
        }
    } else {
        cellDiv.innerHTML = '';
    }
}



// --- 盤面の更新 ---
// すべてのセルの表示をboard配列の状態に合わせて更新する
export function updateBoard() {
    document.querySelectorAll(".cell").forEach(cell => {
        const row = cell.dataset.row;
        const col = cell.dataset.col;
        updateCellDiv(cell, boardState.board[row][col]);
    });
    highlightAvailableMoves();
    updateScore();
    updateCurrentPlayerDisplay();
    updatePieceSelector();
    updatePieceCount();
}


  