
import { shop } from "./shop.js";
import { rewards } from "./rewards.js";
import { saveData, saveGame } from "./storage.js";

export class UI {
  constructor(game, audio) {
    this.game = game;
    this.audio = audio;

    this.$ = id => document.getElementById(id);

    this.menu = this.$("menu");
    this.pauseScreen = this.$("pause");
    this.gameOverScreen = this.$("gameOver");
    this.panel = this.$("panel");

    this.panelTitle = this.$("panelTitle");
    this.panelContent = this.$("panelContent");

    this.currentScreen = "menu";

    this.bindEvents();
    this.refreshWallet();
    this.refreshPlayerInfo();
  }

  // ELEMENT HELPERS

  show(element) {
    element?.classList.remove("hidden");
  }

  hide(element) {
    element?.classList.add("hidden");
  }

  setText(id, value) {
    const element = this.$(id);
    if (element) element.textContent = value;
  }

  // EVENT LISTENERS

  bindEvents() {
    this.$("playBtn")?.addEventListener("click", () => {
      this.playGame();
    });

    this.$("pauseBtn")?.addEventListener("click", () => {
      this.pauseGame();
    });

    this.$("resumeBtn")?.addEventListener("click", () => {
      this.resumeGame();
    });

    this.$("pauseHome")?.addEventListener("click", () => {
      this.goHome();
    });

    this.$("gameHomeBtn")?.addEventListener("click", () => {
      this.goHome();
    });

    this.$("againBtn")?.addEventListener("click", () => {
      this.playGame();
    });

    this.$("reviveBtn")?.addEventListener("click", () => {
      this.revive();
    });

    this.$("panelBack")?.addEventListener("click", () => {
      this.closePanel();
    });

    document.querySelectorAll("[data-screen]").forEach(button => {
      button.addEventListener("click", () => {
        this.openPanel(button.dataset.screen);
      });
    });

    this.$("screenMode")?.addEventListener("change", event => {
      this.setScreenMode(event.target.value);
    });

    this.$("soundBtn")?.addEventListener("click", () => {
      this.toggleSound();
    });

    this.$("musicBtn")?.addEventListener("click", () => {
      this.toggleMusic();
    });

    document.querySelectorAll("[data-power]").forEach(button => {
      button.addEventListener("click", () => {
        this.usePower(button.dataset.power);
      });
    });

    // Keyboard controls
    document.addEventListener("keydown", event => {
      if (
        event.code === "Space" &&
        this.game.state === "playing"
      ) {
        event.preventDefault();
        this.game.flap();
        this.audio.flap();
      }

      if (
        event.code === "Escape" &&
        this.game.state === "playing"
      ) {
        this.pauseGame();
      }
    });

    // Canvas controls
    const canvas = this.game.canvas;

    canvas.addEventListener("pointerdown", event => {
      if (this.game.state === "playing") {
        event.preventDefault();
        this.game.flap();
        this.audio.flap();
      }
    });

    // Browser visibility
    document.addEventListener("visibilitychange", () => {
      if (
        document.hidden &&
        this.game.state === "playing"
      ) {
        this.pauseGame();
      }
    });
  }

  // PLAY GAME

  async playGame() {
    await this.audio.init();

    const difficulty = this.$("difficulty")?.value || "medium";
    const mode = this.$("mode")?.value || "classic";

    this.hide(this.menu);
    this.hide(this.pauseScreen);
    this.hide(this.gameOverScreen);
    this.hide(this.panel);

    this.show(this.$("hud"));

    this.game.start({
      difficulty,
      mode
    });

    this.updateHUD();
    this.currentScreen = "game";
  }

  // PAUSE

  pauseGame() {
    if (!this.game.pause()) return;

    this.hide(this.$("hud"));
    this.show(this.pauseScreen);

    this.currentScreen = "pause";
  }

  // RESUME

  resumeGame() {
    if (!this.game.resume()) return;

    this.hide(this.pauseScreen);
    this.show(this.$("hud"));

    this.currentScreen = "game";
  }

  // HOME

  goHome() {
    this.game.goToMenu();

    this.hide(this.pauseScreen);
    this.hide(this.gameOverScreen);
    this.hide(this.panel);
    this.hide(this.$("hud"));

    this.show(this.menu);

    this.refreshWallet();
    this.refreshPlayerInfo();

    this.currentScreen = "menu";
  }

  // GAME OVER

  showGameOver(result) {
    this.hide(this.$("hud"));
    this.hide(this.menu);
    this.show(this.gameOverScreen);

    this.setText("finalScore", result.score);
    this.setText("finalCoins", result.coins);
    this.setText("finalBest", result.bestScore);

    this.setText(
      "resultMessage",
      result.score >= 10
        ? "Amazing flying! Keep it up!"
        : "Try again and beat your record!"
    );

    this.$("reviveBtn").disabled =
      result.mode === "hardcore";

    this.refreshWallet();

    this.currentScreen = "gameover";
  }

  // REVIVE

  revive() {
    // One revive per run; requires a future revive system.
    alert("Revive system will be available in the next update!");
  }

  // HUD

  updateHUD() {
    this.setText("score", this.game.score);
    this.setText("coins", this.game.coins);
    this.setText("best", saveData.statistics.bestScore);
  }

  refreshWallet() {
    this.setText("wallet", saveData.wallet.coins);
  }

  refreshPlayerInfo() {
    this.setText("level", saveData.player.level);
    this.setText("playerName", saveData.player.name);
  }

  // SCREEN MODE

  setScreenMode(mode) {
    document.body.classList.remove(
      "mobile-mode",
      "desktop-mode"
    );

    document.body.classList.add(`${mode}-mode`);

    saveData.settings.screenMode = mode;
    saveGame();
  }

  // SOUND

  toggleSound() {
    const enabled = !this.audio.soundEnabled;

    this.audio.setSound(enabled);

    this.setText(
      "soundBtn",
      enabled ? "🔊 Sound ON" : "🔇 Sound OFF"
    );
  }

  toggleMusic() {
    const enabled = !this.audio.musicEnabled;

    this.audio.setMusic(enabled);

    this.setText(
      "musicBtn",
      enabled ? "🎵 Music ON" : "🎵 Music OFF"
    );
  }

  // PANEL NAVIGATION

  openPanel(screen) {
    this.hide(this.menu);

    this.show(this.panel);

    this.panelContent.innerHTML = "";

    const screens = {
      shop: ["🐤 BIRD SHOP", () => this.renderShop()],
      worlds: ["🌍 WORLDS", () => this.renderWorlds()],
      rewards: ["🎁 REWARDS", () => this.renderRewards()],
      missions: ["🏆 ACHIEVEMENTS", () => this.renderAchievements()],
      leaderboard: ["🥇 SCORES", () => this.renderLeaderboard()],
      statistics: ["📊 STATISTICS", () => this.renderStatistics()],
      settings: ["⚙️ SETTINGS", () => this.renderSettings()],
      backup: ["💾 SAVE BACKUP", () => this.renderBackup()]
    };

    const selected = screens[screen];

    if (!selected) {
      this.goHome();
      return;
    }

    this.panelTitle.textContent = selected[0];
    selected[1]();

    this.currentScreen = screen;
  }

  closePanel() {
    this.hide(this.panel);
    this.show(this.menu);

    this.refreshWallet();
    this.currentScreen = "menu";
  }

  // SAFE PANEL ITEM

  createItem(title, description, actionText, callback, disabled = false) {
    const item = document.createElement("div");
    item.className = "item";

    const details = document.createElement("div");

    const heading = document.createElement("strong");
    heading.textContent = title;

    const small = document.createElement("small");
    small.textContent = description;

    details.append(heading, small);

    const button = document.createElement("button");
    button.textContent = actionText;
    button.disabled = disabled;

    button.addEventListener("click", callback);

    item.append(details, button);

    this.panelContent.appendChild(item);
  }

  // BIRD SHOP

  renderShop() {
    const birds = shop.getBirds();

    for (const bird of birds) {
      let action = "BUY";
      let disabled = false;

      if (bird.selected) {
        action = "SELECTED";
        disabled = true;
      } else if (bird.unlocked) {
        action = "SELECT";
      } else {
        action = `🪙 ${bird.price}`;
      }

      this.createItem(
        `${bird.emoji} ${bird.name}`,
        bird.description,
        action,
        () => {
          const result = bird.unlocked
            ? shop.chooseBird(bird.id)
            : shop.buyBird(bird.id);

          alert(result.message);

          if (result.success) {
            this.refreshWallet();
            this.renderShop();
          }
        },
        disabled
      );
    }
  }

  // WORLDS

  renderWorlds() {
    const worlds = [
      ["🌳 Green Forest", "Free starting world"],
      ["🏜️ Desert", "Coming soon"],
      ["❄️ Snow Kingdom", "Coming soon"],
      ["🌋 Volcano", "Coming soon"],
      ["🌌 Space", "Coming soon"]
    ];

    for (const [name, description] of worlds) {
      this.createItem(
        name,
        description,
        name.includes("Forest") ? "UNLOCKED" : "LOCKED",
        () => {},
        true
      );
    }
  }

  // DAILY REWARDS

  renderRewards() {
    const daily = rewards.getDailyRewardInfo();

    this.createItem(
      "🎁 Daily Login Reward",
      `Current streak: ${daily.streak} days`,
      daily.claimedToday
        ? "CLAIMED"
        : `CLAIM ${daily.nextReward} COINS`,
      () => {
        const result = rewards.claimDaily();

        alert(result.message);

        this.refreshWallet();
        this.renderRewards();
      },
      daily.claimedToday
    );

    this.createItem(
      "⭐ XP",
      `Level ${saveData.player.level} · ${saveData.player.xp} XP`,
      "INFO",
      () => {}
    );

    for (const mission of rewards.getMissions()) {
      this.createItem(
        mission.name,
        `${mission.description} (${mission.progress}/${mission.target})`,
        mission.claimed
          ? "CLAIMED"
          : mission.completed
            ? "CLAIM"
            : "IN PROGRESS",
        () => {
          const result = rewards.claimMission(mission.id);

          alert(result.message);

          this.refreshWallet();
          this.renderRewards();
        },
        mission.claimed || !mission.completed
      );
    }
  }

  // ACHIEVEMENTS

  renderAchievements() {
    for (const achievement of rewards.getAchievements()) {
      this.createItem(
        achievement.name,
        `${achievement.description} (${achievement.progress}/${achievement.target})`,
        achievement.unlocked ? "UNLOCKED" : "LOCKED",
        () => {},
        true
      );
    }
  }

  // LEADERBOARD

  renderLeaderboard() {
    const scores = saveData.leaderboard || [];

    if (!scores.length) {
      this.createItem(
        "No scores yet",
        "Play a game to create your first score.",
        "OK",
        () => {},
        true
      );
      return;
    }

    [...scores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .forEach((entry, index) => {
        this.createItem(
          `#${index + 1} ${entry.name || "PLAYER"}`,
          `Score: ${entry.score}`,
          "SCORE",
          () => {},
          true
        );
      });
  }

  // STATISTICS

  renderStatistics() {
    const stats = saveData.statistics;

    const entries = [
      ["Games Played", stats.gamesPlayed],
      ["Best Score", stats.bestScore],
      ["Total Score", stats.totalScore],
      ["Total Pipes", stats.totalPipes],
      ["Total Coins", saveData.wallet.totalCoins],
      ["Total Deaths", stats.totalDeaths]
    ];

    for (const [name, value] of entries) {
      this.createItem(
        name,
        String(value),
        "INFO",
        () => {},
        true
      );
    }
  }

  // SETTINGS

  renderSettings() {
    this.createItem(
      "🔊 Sound",
      "Toggle sound effects using the footer button.",
      this.audio.soundEnabled ? "ON" : "OFF",
      () => this.toggleSound()
    );

    this.createItem(
      "🎵 Music",
      "Toggle background music using the footer button.",
      this.audio.musicEnabled ? "ON" : "OFF",
      () => this.toggleMusic()
    );

    this.createItem(
      "📱 Screen Layout",
      "Choose mobile or desktop layout.",
      "CHANGE",
      () => {
        const current = document.body.classList.contains("desktop-mode")
          ? "desktop"
          : "mobile";

        const next = current === "desktop" ? "mobile" : "desktop";

        this.setScreenMode(next);

        if (this.$("screenMode")) {
          this.$("screenMode").value = next;
        }
      }
    );
  }

  // SAVE BACKUP

  renderBackup() {
    this.createItem(
      "💾 Export Save",
      "Download your game progress as a JSON file.",
      "EXPORT",
      () => this.exportBackup()
    );

    this.createItem(
      "📂 Import Save",
      "Restore a previously exported JSON save.",
      "IMPORT",
      () => this.importBackup()
    );
  }

  exportBackup() {
    const blob = new Blob(
      [JSON.stringify(saveData, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "flappy-bird-backup.json";

    link.click();

    URL.revokeObjectURL(url);
  }

  importBackup() {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = ".json,application/json";

    input.addEventListener("change", async () => {
      const file = input.files?.[0];

      if (!file) return;

      try {
        const imported = JSON.parse(await file.text());

        if (
          !imported ||
          typeof imported !== "object" ||
          !imported.wallet ||
          !imported.player ||
          !imported.statistics ||
          !imported.birds
        ) {
          throw new Error("Invalid backup format");
        }

        if (!confirm("Replace your current game save?")) {
          return;
        }

        localStorage.setItem(
          "flappyBirdSave",
          JSON.stringify(imported)
        );

        alert("Backup imported! Reloading game.");

        location.reload();
      } catch (error) {
        alert("Invalid backup file.");
        console.error(error);
      }
    });

    input.click();
  }

  // POWER UPS

  usePower(type) {
    alert(`${type} power-up will be connected in a future update.`);
  }
}
