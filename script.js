
// 定数と変数 //
const boardSize = 8;
let board;
let isSinglePlayer = false;
let currentPlayer = "white";
let selectedPiece = "white";
let isPlayerTurn = true;
let cpuPlayer = "white";

let selectedGate = "X";
let selectedStep = "step0";
let selectedStepText = null;
let isCNOTSelected = false;
let isSWAPSelected = false;
let cnotUsedWhite = true; // CNOTゲートが使用済みかどうか
let cnotUsedBlack = true; // CNOTゲートが使用済みかどうか
let firstCNOTSelection = null; // 最初に選択された黒の駒の座標
let swapUsedWhite = true; // CNOTゲートが使用済みかどうか
let swapUsedBlack = true; // CNOTゲートが使用済みかどうか
let firstSWAPSelection = null; // 最初に選択された黒の駒の座標

function initVal() {
}


// ゲームルール(step)ボタン
const StepBottons = document.querySelectorAll(".step-button")
StepBottons.forEach(button => {
  button.addEventListener("click", () => {
    // すべてのボタンから"active"クラスを削除
    StepBottons.forEach(bnt =>bnt.classList.remove("active"));
    // クリックされたボタンに"active"クラスを追加
    button.classList.add("active");
    selectedStep = button.id;
    selectedStepText = button.textContent.trim();
  });
});

// ゲームオプション(2bit gate)ボタン
const optButtons = document.querySelectorAll(".opt-button");
optButtons.forEach(button => {
  button.addEventListener("click", () => {
    // クリックされたボタンの "active" クラスをトグル
    button.classList.toggle("active");

    if (button.id === "Option-CNOT") {
      isCNOTSelected = !isCNOTSelected;
      cnotUsedBlack = !cnotUsedBlack;
      cnotUsedWhite = !cnotUsedWhite;
    }
    if (button.id === "Option-SWAP") {
      isSWAPSelected = !isSWAPSelected;
      swapUsedBlack = !swapUsedBlack;
      swapUsedWhite = !swapUsedWhite;
    }
    });
});


// 一人プレイか二人プレイの選択Event listeners //
document.addEventListener("DOMContentLoaded", () => {
  // 一人プレイ選択時の処理
  document.getElementById("single-player").addEventListener("click", () => {
    // StepButtonsのいずれかのボタンに"active"クラスがついているか
    const StepIsSelected = Array.from(StepBottons).some(button => button.classList.contains("active"));
    if (!StepIsSelected) {
      alert("ステップを選択してください！");
    } else {
      isSinglePlayer = true; // 1人用モードを有効化
      hideTexts();
      document.getElementById("start-options").classList.remove("hidden");  
    }
  });
  // 二人プレイ選択時の処理
  document.getElementById("two-players").addEventListener("click", () => {
    // StepButtonsのいずれかのボタンに"active"クラスがついているか
    const StepIsSelected = Array.from(StepBottons).some(button => button.classList.contains("active"));
    if (!StepIsSelected) {
      alert("ステップを選択してください！");
    } else {
    isSinglePlayer = false; // 2人用モードを有効化
    hideTexts();
    startGame();
    }
  });
  //一人プレイ時の先攻後攻
  document.getElementById("play-first").addEventListener("click", () => {
    isPlayerTurn = true; // プレイヤーが先攻
    cpuPlayer = "black";
    startGame();
  });
  document.getElementById("play-second").addEventListener("click", () => {
    isPlayerTurn = false; // プレイヤーが後攻
    cpuPlayer = "white";
    startGame();
  });
});

//プレイスタート時の説明文隠し
function hideTexts() {
  document.getElementById("game-intro").classList.add("hidden");
  document.getElementById("gate-options").classList.add("hidden");
  document.getElementById("2bit-gate-options").classList.add("hidden");
  document.getElementById("game-rule").classList.add("hidden");
  document.getElementById("game-options").classList.add("hidden");

}



// ゲーム開始
function startGame() {
  updateCurrentGameMode()
  document.getElementById("start-options").classList.add("hidden");
  document.getElementById("info").classList.remove("hidden");
  document.getElementById("button-container").classList.remove("hidden");
  document.getElementById("gate-button-container").classList.remove("hidden");
  document.getElementById("game-board").classList.remove("hidden");
  document.getElementById("reset-button").classList.remove("hidden");
  initBoard();
}


// 盤面の初期化 //
function initBoard() {
  initVal()

  board = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));
  //コマ数初期化
  if (selectedStep == "step0") {
    pieces = {
      white: 30, black: 30    
    };
  } else {
    pieces = {
      white: 15, black: 15, grayPlus: 15, grayMinus: 15
    };
  }
  // 手番初期化
  currentPlayer = "white";
  // 初期配置
  board[3][3] = "white";
  board[4][4] = "white";
  board[3][4] = "black";
  board[4][3] = "black";

  const gameBoard = document.getElementById("game-board");
  gameBoard.innerHTML = "";
  // 駒選択イベントリスナー
  document.getElementById("select-white").addEventListener("click", () => selectPiece("white"));
  document.getElementById("select-grayPlus").addEventListener("click", () => selectPiece("grayPlus"));
  document.getElementById("select-black").addEventListener("click", () => selectPiece("black"));
  document.getElementById("select-grayMinus").addEventListener("click", () => selectPiece("grayMinus"));
  // // 駒選択イベントリスナーの設定後
  updatePieceSelector();
  // 駒数の表示更新
  updatePieceCount();
  // Gateボタン表示
  updateGateSelector();
  // Gate選択イベントリスナー
  document.getElementById("select-X").addEventListener("click", () => selectGate("X"));
  document.getElementById("select-H").addEventListener("click", () => selectGate("H"));
  document.getElementById("select-Y").addEventListener("click", () => selectGate("Y"));
  document.getElementById("select-Z").addEventListener("click", () => selectGate("Z"));
  document.getElementById("select-CNOT").addEventListener("click", () => selectGate("CNOT"));
  document.getElementById("select-SWAP").addEventListener("click", () => selectGate("SWAP"));

  // 盤面の生成
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellDiv = document.createElement("div");
      cellDiv.classList.add("cell");
      cellDiv.dataset.row = rowIndex;
      cellDiv.dataset.col = colIndex;

      if (cell === "black") {
        cellDiv.classList.add("black");
      } else if (cell === "white") {
        cellDiv.classList.add("white");
      }
      if (cell === "grayPlus") {
        cellDiv.classList.add("grayPlus");
        cellDiv.textContent = "+";
      }
      if (cell === "grayMinus") {
        cellDiv.classList.add("grayMinus");
        cellDiv.textContent = "-";
      }
      cellDiv.addEventListener("click", () => placePiece(rowIndex, colIndex));
      gameBoard.appendChild(cellDiv);
    });
  });

  // 盤面更新
  updateBoard();
  updateCurrentPlayerDisplay();
  updateScore();

  // CPUの初手を処理
  if (isSinglePlayer && !isPlayerTurn) {
    setTimeout(cpuMove, 500); // プレイヤーが後攻の場合、CPUが最初の手を実行
  }
}



// 駒選択
function selectPiece(piece) {
  // 選択ボタンハイライト処理関数
  function highlightButton (selectedPiece){
    // すべての piece-button を取得
    const pieceButtons = document.querySelectorAll(".piece-button");
    const conditionMetButtonId = "select-" + selectedPiece; // 例: 条件に合致するボタンのID
    pieceButtons.forEach(button => {
      if (button.id === conditionMetButtonId) {
        button.classList.add("active"); // 条件に合致するボタンをハイライト
      } else {
        button.classList.remove("active"); // 他のボタンのハイライトを解除
      }
    });
  }

  if (pieces[piece] > 0) {
    selectedPiece = piece;
    highlightButton(selectedPiece);
    // showPopupMessage(`選択中の駒: ${piece}`); // ポップアップは使わない
    updateGateSelector(); // 選択可能なGateの更新
  } else {
    // 駒が残っていない場合、別の駒を自動選択
    const availablePieces = currentPlayer === "black"
      ? ["black", "grayMinus"]
      : ["white", "grayPlus"];
    for (let altPiece of availablePieces) {
      if (pieces[altPiece] > 0) {
        selectedPiece = altPiece;
        highlightButton(selectedPiece);
        // showPopupMessage(`選択中の駒: ${altPiece}`); // ポップアップは使わない
        updateGateSelector(); // 選択可能なGateの更新
        return;
      }
    }
    // すべての駒が無い場合の処理（安全対策として）
    showPopupMessage("使用可能な駒がありません！");
  }
}

// Gate選択
function selectGate(Gate){
  selectedGate = Gate;

  // CNOTのハイライト条件からの復帰
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("highlightRed"); // 既存のハイライトを削除
  });
  highlightAvailableMoves() 
  firstCNOTSelection = null // CNOTの1コマ目選択状態から復帰
  firstSWAPSelection = null // SWAPの1コマ目選択状態から復帰

  // すべての gate-button を取得
  const gateButtons = document.querySelectorAll(".gate-button");
  // 条件に合致するボタンのID
  const conditionMetButtonId = "select-" + selectedGate; // 例: 条件に合致するボタンのID

  // 条件を判定してボタンをハイライト
  gateButtons.forEach(button => {
    if (button.id === conditionMetButtonId) {
      button.classList.add("active"); // 条件に合致するボタンをハイライト
    } else {
      button.classList.remove("active"); // 他のボタンのハイライトを解除
    }
  });

  if (selectedGate === "CNOT") {
    highlightAvailableCNOTTargets(); // CNOT対象の駒をハイライト
  } else if (selectedGate === "SWAP") {
    highlightAvailableSWAPTargets();
  }
}


//H,X,Y,Zの作用を定義
function applyPieceEffect(row, col, effect) {
  const target = board[row][col];
  if (effect === "X") {
    if (target === "white") board[row][col] = "black";
    else if (target === "black") board[row][col] = "white";
  } else if (effect === "H") {
    if (target === "white") board[row][col] = "grayPlus";
    else if (target === "black") board[row][col] = "grayMinus";
    else if (target === "grayPlus") board[row][col] = "white";
    else if (target === "grayMinus") board[row][col] = "black";
  } else if (effect === "Y") {
    if (target === "white") board[row][col] = "black";
    else if (target === "black") board[row][col] = "white";
    else if (target === "grayPlus") board[row][col] = "grayMinus";
    else if (target === "grayMinus") board[row][col] = "grayPlus";
  } else if (effect === "Z") {
    if (target === "grayPlus") board[row][col] = "grayMinus";
    else if (target === "grayMinus") board[row][col] = "grayPlus";
  } 
}


// 駒を置く処理
function placePiece(row, col) {

  if (selectedGate === "CNOT") {
    applyCNOT(row, col)
  } else if (selectedGate === "SWAP") {
    applySWAP(row, col)
  } else {
    if (board[row][col] !== null) return; // すでに駒がある場合は無効
    const flippedPieces = getFlippablePieces(row, col, currentPlayer);
    if (flippedPieces.length === 0) return; // 挟めない場合は無効
    showPopupMessage(`[Last operation] ${selectedPiece}: ${selectedGate}`);
    // 駒を置く
    board[row][col] = selectedPiece;
    pieces[selectedPiece]--; // 駒を減少
    updatePieceCount(); // 駒数を更新
  
    // 挟んだ駒に作用を適用
    flippedPieces.forEach(([r, c]) => applyPieceEffect(r, c, selectedGate));
  
    updateBoard();
    updateScore();
    checkGameOver();
    playerChange();
    highlightPlacedPiece(row, col); // 置いた場所をハイライト
  }
}

 // プレイヤー交代
function playerChange () {
  currentPlayer = currentPlayer === "black" ? "white" : "black";
  updateCurrentPlayerDisplay();

  updateBoard();
  // updateScore();
  updatePieceSelector(); // 手番に応じて選択可能な駒を更新

  // CPUのターンを実行（シングルプレイヤーで、プレイヤーのターンが終了した場合）
  if (isSinglePlayer && currentPlayer === cpuPlayer && !checkGameOver() && !checkSkip()) {
    setTimeout(cpuMove, 500); // CPUの動きを500ms後に実行
  }

  //もし次の手番で、置ける場所がなければ、スキップして次の手番へ
  checkSkip()
}


//駒数を更新する
function updatePieceCount() {
  document.getElementById("white-count").textContent = pieces.white;
  document.getElementById("grayPlus-count").textContent = pieces.grayPlus;
  document.getElementById("black-count").textContent = pieces.black;
  document.getElementById("grayMinus-count").textContent = pieces.grayMinus;
}


// 駒を置ける場所をチェック
function getFlippablePieces(row, col, player) {
  let flippablePieces = [];
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // 上下左右
    [-1, -1], [-1, 1], [1, -1], [1, 1] // 斜め
  ];
  // 現在のプレイヤーの駒と相手の駒を定義
  const playerPieces = player === "black" ? ["black", "grayMinus"] : ["white", "grayPlus"];
  const opponentPieces = player === "black" ? ["white", "grayPlus"] : ["black", "grayMinus"];

  directions.forEach(([dx, dy]) => {
    let r = row + dx;
    let c = col + dy;
    let potentialFlips = [];

    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
      if (board[r][c] === null) break; // 空マスに到達したら終了
      if (playerPieces.includes(board[r][c])) {
        flippablePieces = flippablePieces.concat(potentialFlips);
        break;
      }
      if (opponentPieces.includes(board[r][c])) {
        potentialFlips.push([r, c]); // 挟めるかもしれない駒を追加
      } else {
        break; // 自分の駒でも相手の駒でもない場合
      }
      r += dx;
      c += dy;
    }
  });
  return flippablePieces;
}


// 置ける場所をハイライト
function highlightAvailableMoves() {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("highlight");
  });

  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (board[rowIndex][colIndex] === null) {
        const flippablePieces = getFlippablePieces(rowIndex, colIndex, currentPlayer);
        if (flippablePieces.length > 0) {
          const cellDiv = document.querySelector(
            `.cell[data-row="${rowIndex}"][data-col="${colIndex}"]`
          );
          if (cellDiv) {
            cellDiv.classList.add("highlight");
          }
        }
      }
    });
  });
}

// 置いた場所をハイライト
function highlightPlacedPiece(row, col) {
  // 対象セルを取得
  const cell = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
  if (cell) {
    // highlightBlue クラスを追加
    cell.classList.add("highlightBlue");
  }
}

// 置いた場所を赤にハイライト
function highlightRedPlacedPiece(row, col) {
  // 対象セルを取得
  const cell = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
  if (cell) {
    // highlightBlue クラスを追加
    cell.classList.add("highlightRed");
  }
}


// {
//   document.querySelectorAll(".cell").forEach((cell) => {
//     cell.classList.remove("highlightBlue");
//   });
//   const cellDiv = document.querySelector(
//     `.cell[data-row="${row}"][data-col="${col}"]`
//   );
//   cellDiv.classList.add("highlightBlue");
// }

// CPUロジック
// ランダムに配置する。
// X/Yを選べる状況下では、X:Y=1:2の確率でランダムにゲート選択
// H/Zを選べる条件下では、挟む駒が白黒が多いならH,Grayが多いならZを選択。→できていないできていない
// 角をとれる場合は、優先して白か黒で取る→できていない


// CPU動作logic
function cpuMove() {
  const moves = [];
  // ランダムに駒を選択

  if (cpuPlayer === "white") {
    if (cnotUsedWhite === false) {
      if (Math.random() * (pieces["white"] + pieces["grayPlus"] + 1.5) > (pieces["white"] + pieces["grayPlus"])) {
        applyCpuCNOT();
        return;
      }
    }
    if (swapUsedWhite === false) {
      if (Math.random() * (pieces["white"] + pieces["grayPlus"] + 1.5) > (pieces["white"] + pieces["grayPlus"])) {
        applyCpuSWAP();
        return;
      }
    }
  }

  if (cpuPlayer === "black") {
    if (cnotUsedBlack === false) {
      if (Math.random() * (pieces["black"] + pieces["grayMinus"] + 1.5) > (pieces["black"] + pieces["grayMinus"])) {
        applyCpuCNOT();
        return;
      }
    }
    if (swapUsedBlack === false) {
      if (Math.random() * (pieces["black"] + pieces["grayMinus"] + 1.5) > (pieces["black"] + pieces["grayMinus"])) {
        applyCpuSWAP();
        return;
      }
    }
  }

  if (cpuPlayer == "white") {
    if (pieces["white"] > 0 && pieces["grayPlus"] > 0){
      if (Math.random() * (pieces["white"] + pieces["grayPlus"]) < pieces["white"]) selectPiece("white");
      else selectPiece("grayPlus");
    }
  } else {
    if (pieces["black"] > 0 && pieces["grayMinus"] > 0){
      if (Math.random() * (pieces["black"] + pieces["grayMinus"]) < pieces["black"]) selectPiece("black");
      else selectPiece("grayMinus");
    }
  }

  if (selectedStep === "step2" || selectedStep === "step4") {
    if (selectedPiece === "white" || selectedPiece === "black") {
      if (Math.random() < 0.66) selectGate("Y")
    }
  }
  if (selectedStep === "step3" || selectedStep === "step4") {
    if (selectedPiece === "grayPlus" || selectedPiece === "grayMinus") {
      if (Math.random() < 0.5) selectGate("Z") // 本当は、挟む駒の種類によって変えたい。
    }
  }

  // 駒を置ける位置を取得
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (board[rowIndex][colIndex] === null) {
        const flippablePieces = getFlippablePieces(rowIndex, colIndex, currentPlayer, selectedPiece);
        if (flippablePieces.length > 0) moves.push({ row: rowIndex, col: colIndex });
      }
    });
  });
  // 駒を置ける位置をランダムに選択し、置く
  if (moves.length > 0) {
    const move = moves[Math.floor(Math.random() * moves.length)];
    placePiece(move.row, move.col);
  }
}

// 盤面の更新
function updateBoard() {
  document.querySelectorAll(".cell").forEach((cell) => {
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    cell.className = "cell"; // 既存のクラスをリセット
    cell.textContent = ""; // 既存のテキストをクリア

    if (board[row][col] === "white") cell.classList.add("white");
    else if (board[row][col] === "black") cell.classList.add("black"); 
    else if (board[row][col] === "grayPlus") cell.classList.add("grayPlus"); // cell.textContent = "+"; // 駒のマークを追加
    else if (board[row][col] === "grayMinus") cell.classList.add("grayMinus"); // cell.textContent = "-"; // 駒のマークを追加
  });
  highlightAvailableMoves();

}


//駒選択ボタンの表示更新関数
function updatePieceSelector() {
  const selectWhite = document.getElementById("select-white");
  const selectGrayPlus = document.getElementById("select-grayPlus");
  const selectBlack = document.getElementById("select-black");
  const selectGrayMinus = document.getElementById("select-grayMinus");

  function showButtons(buttons) {
    [selectWhite, selectGrayPlus, selectBlack, selectGrayMinus].forEach((button) => {
      button.classList.add("hidden");
    });
    buttons.forEach((button) => {
      button.classList.remove("hidden")
    });
  }
  // 現在のプレイヤーに応じて表示
  if (selectedStep === "step0") {
    if (currentPlayer === "black") {
      showButtons([selectBlack]);
      selectPiece("black"); // 自動で黒を選択
    } else if (currentPlayer === "white") {
      showButtons([selectWhite]);
      selectPiece("white"); // 自動で白を選択
    }
  } else {
    if (currentPlayer === "black") {
      showButtons([selectBlack,selectGrayMinus]);
      selectPiece("black"); // 自動で黒を選択
    } else if (currentPlayer === "white") {
      showButtons([selectWhite,selectGrayPlus]);
      selectPiece("white"); // 自動で白を選択
    }    
  }
}

//Gate選択ボタンの表示更新関数
function updateGateSelector() {
  // console.log("selectedStep:", selectedStep); //デバッグログ
  // console.log("selectedPiece:", selectedPiece); //デバッグログ

  const selectX = document.getElementById("select-X");
  const selectH = document.getElementById("select-H");
  const selectY = document.getElementById("select-Y");
  const selectZ = document.getElementById("select-Z");
  const selectCNOT = document.getElementById("select-CNOT");
  const selectSWAP = document.getElementById("select-SWAP");
  function showGateButtons(buttons) {
    [selectX, selectH, selectY, selectZ].forEach((button) => {
      button.classList.add("hidden");
    });
    buttons.forEach((button) => {
      button.classList.remove("hidden")
    });
    // console.log("表示するボタン:", buttons); //デバッグログ
  }

  // CNOTを選択しており、使っていなければ表示
  selectCNOT.classList.add("hidden");
  if (isCNOTSelected) {
    selectCNOT.classList.remove("hidden");
    if (currentPlayer === "white" && cnotUsedWhite === true) {
      selectCNOT.classList.add("hidden");
    } else if (currentPlayer === "black" && cnotUsedBlack === true) {
      selectCNOT.classList.add("hidden");
    }   
  }

  // SWAPを選択しており、使っていなければ表示
    selectSWAP.classList.add("hidden");
    if (isSWAPSelected) {
      selectSWAP.classList.remove("hidden");
      if (currentPlayer === "white" && swapUsedWhite === true) {
        selectSWAP.classList.add("hidden");
      } else if (currentPlayer === "black" && swapUsedBlack === true) {
        selectSWAP.classList.add("hidden");
      }
    }
  

  // 選択したGameModeと、選択した駒に応じて表示
  if (selectedStep === "step0") {
    showGateButtons([selectX]);
    selectGate("X"); // 自動でXを選択
  } else if (selectedStep === "step1") {
    if (selectedPiece === "black" || selectedPiece == "white") {
      showGateButtons([selectX]);
      selectGate("X"); // 自動でXを選択
    } else {
      showGateButtons([selectH]);
      selectGate("H"); // 自動でHを選択
    }
  } else if (selectedStep === "step2") {
    if (selectedPiece === "black" || selectedPiece == "white") {
      showGateButtons([selectX, selectY]);
      selectGate("X"); // 自動でXを選択
    } else {
      showGateButtons([selectH]);
      selectGate("H"); // 自動でHを選択
    }
  } else if (selectedStep === "step3") {
    if (selectedPiece === "black" || selectedPiece == "white") {
      showGateButtons([selectX]);
      selectGate("X"); // 自動でXを選択
    } else {
      showGateButtons([selectH, selectZ]);
      selectGate("H"); // 自動でHを選択
    }
  } else if (selectedStep === "step4") {
    if (selectedPiece === "black" || selectedPiece == "white") {
      showGateButtons([selectX, selectY]);
      selectGate("X"); // 自動でXを選択
    } else {
      showGateButtons([selectH, selectZ]);
      selectGate("H"); // 自動でHを選択
    }
  }
}

// 現在のGameModeを表示
function updateCurrentGameMode() {
  const gameModeDisplay = document.getElementById("current-GameStep");
  gameModeDisplay.textContent = `GameMode: ${selectedStepText}`;
}

// 現在のプレイヤーを表示
function updateCurrentPlayerDisplay() {
  const playerDisplay = document.getElementById("current-player");
  playerDisplay.textContent = `現在の番: ${currentPlayer === "black" ? "黒" : "白"}`;
}

// スコア更新
function updateScore() {
  let blackCount = 0;
  let whiteCount = 0;
  let grayCount = 0;
  board.forEach(row => {
    row.forEach(cell => {
      if (cell === "black") blackCount++;
      if (cell === "white") whiteCount++;
      if (cell === "grayPlus") grayCount++;
      if (cell === "grayMinus") grayCount++;
    });
  });
  const scoreBoard = document.getElementById("score-board");
  scoreBoard.textContent = `Black: ${blackCount} | White: ${whiteCount} | Gray: ${grayCount}`;
}

// ポップアップメッセージ
function showPopupMessage(message) {
  const popup = document.getElementById("popup-message");
  popup.textContent = message;
  popup.classList.remove("hidden");
  setTimeout(() => {
    popup.classList.add("hidden");
  }, 1000);
}

// ゲーム終了判定
function checkGameOver() {
  let blackMoves = 0;
  let whiteMoves = 0;
  let emptyCells = 0;
  // 空セルのカウント、および黒/白が動けるセルのカウント
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (board[rowIndex][colIndex] === null) {
        emptyCells++; // 空セルをカウント
        if (getFlippablePieces(rowIndex, colIndex, "black").length > 0) blackMoves++;
        if (getFlippablePieces(rowIndex, colIndex, "white").length > 0) whiteMoves++;
      }
    });
  });
  // もしどちらも駒を置くことができなければ、コメント表示して測定ボタンの表示
  if (emptyCells === 0 || blackMoves === 0 && whiteMoves === 0) {
    showPopupMessage(`ゲームが終了しました。測定ボタンを押してください。`);
    // const measureButton = document.createElement("button");
    document.getElementById("reset-button").classList.add("hidden");
    document.getElementById("measure-button").classList.remove("hidden");
    document.getElementById("measure-button").addEventListener("click", () => finalizeGame());
    // measureButton.textContent = "測定";
    // measureButton.addEventListener("click", finalizeGame);
    // document.body.appendChild(measureButton);
    return true; // ゲーム終了
    }
  return false; // ゲーム継続
}

// 観測とゲーム終了処理
function finalizeGame() {
  board.flat().forEach((cell, index) => {
    if (cell === "grayPlus") {
      board[Math.floor(index / boardSize)][index % boardSize] =
        Math.random() < 0.5 ? "white" : "black";
    }
    if (cell === "grayMinus") {
      board[Math.floor(index / boardSize)][index % boardSize] =
        Math.random() < 0.5 ? "white" : "black";
    }
    document.getElementById("reset-button").classList.remove("hidden");
  });

  updateBoard();
  updateScore();
  const whiteCount = board.flat().filter(c => c === "white").length;
  const blackCount = board.flat().filter(c => c === "black").length;
  if (whiteCount == blackCount) {
    showPopupMessage(`引き分け！`);
  } else {
    const winner = whiteCount > blackCount ? "白" : "黒";
  showPopupMessage(`勝者: ${winner}`);
  }
  document.getElementById("measure-button").classList.add("hidden");
}

// スキップ判定
function checkSkip() {
  let availableMoves = 0;
  let emptyCells = 0;

  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (board[rowIndex][colIndex] === null) {
        emptyCells++; // 空セルをカウント
        if (getFlippablePieces(rowIndex, colIndex, currentPlayer).length > 0) {
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

    if (currentPlayer === "black") pieces.white++;
    else if (currentPlayer === "white") pieces.black++;
    //Skip時のコマ数を合わせる場合は減らさないといけないが、実装未定
    // if (currentPlayer === "black" && pieces.black > 0) pieces.grayPlus++;
    // else if (currentPlayer === "black" && pieces.black == 0) pieces.grayPlus++;
    // else if (currentPlayer === "white" && pieces.white > 0) pieces.grayMinus++;
    // else if (currentPlayer === "white" && pieces.white == 0) pieces.grayMinus++;

    showPopupMessage(`${currentPlayer === "black" ? "黒" : "白"}は置ける場所がありません。スキップします。`);
    currentPlayer = currentPlayer === "black" ? "white" : "black"; // スキップ時もプレイヤーを交代
    updateCurrentPlayerDisplay();
    updatePieceSelector(); // 手番に応じて選択可能な駒を更新
    updatePieceCount();
    updateBoard(); // スキップ後の駒表示を更新
    highlightAvailableMoves(); // 新しい手番に基づいてハイライトを更新
    return true;
  }
return false;
}

// リセットボタンによる初期化
document.getElementById("reset-button").addEventListener("click", initBoard);
// initBoard();





// CNOTゲートの実装
function applyCNOT(row, col) {
  if (currentPlayer === "white" && cnotUsedWhite || currentPlayer === "black" && cnotUsedBlack) {
    showPopupMessage("CNOTゲートは一度しか使用できません！");
    return;
  }
  console.log("row:", row, "col:", col); //デバッグログ

  if (!firstCNOTSelection) {
    // **最初の選択:** 黒の駒を選択
    if (board[row][col] === "black") {
      firstCNOTSelection = { row, col };
      highlightAdjacentTargets(row, col); // 次の選択肢をハイライト
      highlightPlacedPiece(row, col); // 置いた場所をハイライト
      showPopupMessage("CNOT: 隣接する駒を選択してください");
    } else {
      showPopupMessage("CNOTゲートは黒の駒にのみ使用できます！");
    }
  } else {
    // **2つ目の選択:** 隣接する駒を選択
    if (isAdjacent(firstCNOTSelection.row, firstCNOTSelection.col, row, col)) {
      applyPieceEffect(row, col, "X"); // Xゲートを適用
      if (currentPlayer === "white") cnotUsedWhite = true;
      if (currentPlayer === "black") cnotUsedBlack = true;
      firstRow = firstCNOTSelection.row
      firstCol = firstCNOTSelection.col
      secondRow = row
      secondCol = col
      showPopupMessage("CNOT！");
      updateBoard();
      updateScore();
      checkGameOver();
      playerChange();
      highlightPlacedPiece(firstRow, firstCol); // 最初に置いた場所をハイライト
      highlightRedPlacedPiece(secondRow, secondCol); // 置いた場所をハイライト
      firstCNOTSelection = null; // 選択リセット
    } else {
      showPopupMessage("CNOT: 隣接する駒を選択してください！");
    }
  }
}

// CNOTで選択可能な駒をハイライト
function highlightAvailableCNOTTargets() {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("highlightBlue"); // 既存のハイライトを削除
  });
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("highlight"); // 既存のハイライトを削除
  });

  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (board[rowIndex][colIndex] === "black") {
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



// 1回目の選択後、周囲の駒をハイライト
function highlightAdjacentTargets(row, col) {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("highlightRed"); // 既存のハイライトを削除
  });
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // 上下左右
    [-1, -1], [-1, 1], [1, -1], [1, 1] // 斜め
  ];

  directions.forEach(([dx, dy]) => {
    const targetRow = row + dx;
    const targetCol = col + dy;

    if (
      targetRow >= 0 && targetRow < boardSize &&
      targetCol >= 0 && targetCol < boardSize &&
      board[targetRow][targetCol] !== null
    ) {
      const cellDiv = document.querySelector(
        `.cell[data-row="${targetRow}"][data-col="${targetCol}"]`
      );
      if (cellDiv) {
        cellDiv.classList.add("highlightRed"); // ハイライト
      }
    }
  });
}

// 隣接判定関数
function isAdjacent(row1, col1, row2, col2) {
  const rowDiff = Math.abs(row1 - row2);
  const colDiff = Math.abs(col1 - col2);
  // 隣接しているか確認**
  const isNextTo = (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0));
  // そのセルに駒があることを確認**
  const hasPiece = board[row2][col2] !== null;
  // 両方の条件を満たす場合のみ true を返す
  return isNextTo && hasPiece;
}


// SWAPゲートの実装
function applySWAP(row, col) {
  if (currentPlayer === "white" && swapUsedWhite || currentPlayer === "black" && swapUsedBlack) {
    showPopupMessage("SWAPゲートは一度しか使用できません！");
    return;
  }


  if (!firstSWAPSelection) {
    // **最初の選択:** 黒の駒を選択
    if (board[row][col] !== null) {
      firstSWAPSelection = { row, col };
      highlightAdjacentTargets(row, col); // 次の選択肢をハイライト
      highlightPlacedPiece(row, col); // 置いた場所をハイライト
      showPopupMessage("SWAP: 入れ替える駒を選択してください");
    } else {
      showPopupMessage("SWAPできる駒を選択してください！");
    }
  } else {
    // **2つ目の選択:** 隣接する駒を選択
    if (isAdjacent(firstSWAPSelection.row, firstSWAPSelection.col, row, col)) {
      // applyPieceEffect(row, col, "X"); // Xゲートを適用
      firstRow = firstSWAPSelection.row
      firstCol = firstSWAPSelection.col
      secondRow = row
      secondCol = col
      let tempPiece = board[firstRow][firstCol];
      board[firstRow][firstCol] = board[row][col]; //二つ目の駒を一つ目の駒に移動
      board[row][col] = tempPiece; //一つ目の駒に二つ目の駒を上書き

      if (currentPlayer === "white") swapUsedWhite = true;
      if (currentPlayer === "black") swapUsedBlack = true;
      showPopupMessage("SWAP！");
      updateBoard();
      updateScore();
      checkGameOver();
      playerChange();
      highlightPlacedPiece(firstRow, firstCol); // 最初に置いた場所をハイライト
      highlightRedPlacedPiece(secondRow, secondCol); // 置いた場所をハイライト
      firstSWAPSelection = null; // 選択リセット
    } else {
      showPopupMessage("SWAP: 隣接する駒を選択してください！");
    }
  }
}

// SWAPで選択可能な駒をハイライト
function highlightAvailableSWAPTargets() {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("highlightBlue"); // 既存のハイライトを削除
  });
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("highlight"); // 既存のハイライトを削除
  });

  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (board[rowIndex][colIndex] !== null) {
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

function applyCpuCNOT() {
  const blackPieces = [];

  // 黒い駒の座標を取得
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (board[rowIndex][colIndex] === "black") {
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
  board.forEach((row, rowIndex) => {
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

function applyCpuSWAP() {
  const PlacedPieces = [];

  // 駒がある座標を取得
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      // console.log("rowIndex:", rowIndex, "colIndex:", colIndex); //デバッグログ
      if (board[rowIndex][colIndex] !== null) {
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
  board.forEach((row, rowIndex) => {
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