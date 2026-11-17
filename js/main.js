
import { Game } from "./game.js";
import { AudioManager } from "./audio.js";
import { UI } from "./ui.js";
import { rewards } from "./rewards.js";
import { saveData } from "./storage.js";

// FLAPPY BIRD 3.0 - MAIN ENTRY POINT

class FlappyBirdApp {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");

    if (!this.canvas) {
      throw new Error("Game canvas not found!");
    }

    this.game = null;
    this.audio = null;
    this.ui = null;

    this.initialized = false;
  }

  // INITIALIZE APPLICATION

  init() {
    if (this.initialized) return;

    try {
      // 1. Initialize audio
      this.audio = new AudioManager();

      // 2. Initialize game engine
      this.game = new Game(this.canvas);

      // 3. Initialize UI
      this.ui = new UI(this.game, this.audio);

      // 4. Connect game callbacks
      this.connectGameEvents();

      // 5. Load saved settings
      this.loadSettings();

      // 6. Draw initial game screen
      this.game.draw();

      // 7. Update interface
      this.refreshInterface();

      this.initialized = true;

      console.log("🐤 Flappy Bird 3.0 initialized!");

    } catch (error) {
      console.error("Initialization failed:", error);

      alert(
        "Game initialization failed. Check the browser console."
      );
    }
  }

  // CONNECT GAME EVENTS

  connectGameEvents() {
    this.game.setCallbacks({

      // SCORE
      onScore: score => {
        this.ui.updateHUD();
        this.audio.score();

        console.log("Score:", score);
      },

      // COINS
      onCoins: totalCoins => {
        this.ui.updateHUD();
        this.audio.coin();

        console.log("Coins collected:", totalCoins);
      },

      // GAME OVER
      onGameOver: result => {
        this.handleGameOver(result);
      },

      // GAME STATE
      onStateChange: state => {
        console.log("Game state:", state);
      },

      // TIME ATTACK
      onTimeUpdate: time => {
        const timer = document.getElementById("timer");

        if (timer) {
          timer.textContent =
            `⏳ ${Math.ceil(time)}s`;
        }
      }

    });
  }

  // GAME OVER HANDLER

  handleGameOver(result) {
    console.log("Game finished:", result);

    // Update missions and achievements
    rewards.updateMissions();

    // Update final screen
    this.ui.showGameOver({
      ...result,
      bestScore: saveData.statistics.bestScore
    });

    // Play sound
    if (
      result.reason === "pipe" ||
      result.reason === "boundary"
    ) {
      this.audio.collision();
    }

    this.audio.gameOver();

    // Refresh wallet
    this.ui.refreshWallet();
  }

  // LOAD SETTINGS

  loadSettings() {
    const settings = saveData.settings;

    // Screen layout
    const screenMode =
      settings.screenMode === "desktop"
        ? "desktop"
        : "mobile";

    document.body.classList.remove(
      "mobile-mode",
      "desktop-mode"
    );

    document.body.classList.add(
      `${screenMode}-mode`
    );

    const screenSelect =
      document.getElementById("screenMode");

    if (screenSelect) {
      screenSelect.value = screenMode;
    }

    // Sound button
    const soundButton =
      document.getElementById("soundBtn");

    if (soundButton) {
      soundButton.textContent =
        this.audio.soundEnabled
          ? "🔊 Sound ON"
          : "🔇 Sound OFF";
    }

    // Music button
    const musicButton =
      document.getElementById("musicBtn");

    if (musicButton) {
      musicButton.textContent =
        this.audio.musicEnabled
          ? "🎵 Music ON"
          : "🎵 Music OFF";
    }
  }

  // REFRESH INTERFACE

  refreshInterface() {
    this.ui.refreshWallet();
    this.ui.refreshPlayerInfo();
    this.ui.updateHUD();
  }

  // CLEANUP

  destroy() {
    if (this.game) {
      this.game.destroy();
    }

    if (this.audio) {
      this.audio.destroy();
    }

    this.initialized = false;
  }
}

// START APPLICATION

const app = new FlappyBirdApp();

app.init();

// Optional debugging access
window.flappyBird = app;

// Cleanup
window.addEventListener("beforeunload", () => {
  app.destroy();
});