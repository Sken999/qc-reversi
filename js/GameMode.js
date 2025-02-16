import { startGame } from "./Game.js";


export const gameState = {
    selectedStep: null,
    selectedStepText: "",
    isCNOTSelected: false,
    isSWAPSelected: false,
    cnotUsedWhite: true,
    cnotUsedBlack: true,
    swapUsedWhite: true,
    swapUsedBlack: true,
    isSinglePlayer: false,
    cpuPlayer: "white",
    isPlayerTurn: true
};

document.addEventListener("DOMContentLoaded", () => {
    const stepButtons = document.querySelectorAll(".step-button");
    const optButtons  = document.querySelectorAll(".opt-button");
  
    // --- ゲームルール (step) ボタン ---
    stepButtons.forEach(button => {
      button.addEventListener("click", () => {
        // すべてのstepボタンから "active" クラスを削除し、クリックしたボタンに追加
        stepButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
  
        // 選択されたステップ情報を設定
        gameState.selectedStep = button.id;
        gameState.selectedStepText = button.textContent.trim();
      });
    });
  
    // --- ゲームオプション (2bit gate) ボタン ---
    optButtons.forEach(button => {
      button.addEventListener("click", () => {
        button.classList.toggle("active");
        if (button.id === "Option-CNOT") {
          gameState.isCNOTSelected = !gameState.isCNOTSelected;
          gameState.cnotUsedBlack = !gameState.cnotUsedBlack;
          gameState.cnotUsedWhite = !gameState.cnotUsedWhite;
        } else if (button.id === "Option-SWAP") {
          gameState.isSWAPSelected = !gameState.isSWAPSelected;
          gameState.swapUsedBlack = !gameState.swapUsedBlack;
          gameState.swapUsedWhite = !gameState.swapUsedWhite;
        }
      });
    });
  
    // --- 一人プレイ/二人プレイの選択 ---
    document.getElementById("single-player").addEventListener("click", () => {
      if (gameState.selectedStep === null) {
        alert("ステップを選択してください！");
        return;
      }
      gameState.isSinglePlayer = true;
      hideTexts();
      // 一人プレイの場合、先攻後攻選択画面を表示
      document.getElementById("start-options").classList.remove("hidden");
    });
    
    document.getElementById("two-players").addEventListener("click", () => {
      if (gameState.selectedStep === null) {
        alert("ステップを選択してください！");
        return;
      }
      gameState.isSinglePlayer = false;
      hideTexts();
      startGame();
    });
  
    // --- 一人プレイ時の先攻・後攻選択 ---
    document.getElementById("play-first").addEventListener("click", () => {
      gameState.isPlayerTurn = true;  // プレイヤーが先攻
      gameState.cpuPlayer = "black";
      startGame();
    });
    document.getElementById("play-second").addEventListener("click", () => {
      gameState.isPlayerTurn = false; // プレイヤーが後攻
      gameState.cpuPlayer = "white";
      startGame();
    });
  });
  
  // --- 説明文などを隠す関数 ---
  function hideTexts() {
    ["game-intro", "gate-options", "2bit-gate-options", "game-rule", "game-options"]
      .forEach(id => document.getElementById(id).classList.add("hidden"));
  }
  