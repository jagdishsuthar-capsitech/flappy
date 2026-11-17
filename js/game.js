
import { Player } from "./player.js";
import { Obstacles } from "./obstacles.js";

import {
  saveData,
  recordGame
} from "./storage.js";

export class Game {
  constructor(canvas, options = {}) {
    if (!canvas) {
      throw new Error("Game canvas not found");
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    if (!this.ctx) {
      throw new Error("Canvas 2D context unavailable");
    }

    this.player = new Player(canvas);
    this.obstacles = new Obstacles(canvas);

    this.state = "menu";

    this.score = 0;
    this.coins = 0;
    this.pipesPassed = 0;

    this.playTime = 0;
    this.elapsedTime = 0;

    this.difficulty = options.difficulty || "medium";
    this.mode = options.mode || "classic";

    this.timeLimit = 60;
    this.timeRemaining = this.timeLimit;

    this.animationId = null;
    this.lastTime = 0;

    this.maxDelta = 2;

    this.callbacks = {
      onScore: null,
      onCoins: null,
      onGameOver: null,
      onStateChange: null,
      onTimeUpdate: null
    };

    this.loop = this.loop.bind(this);

    this.drawBackground();
  }

  // CALLBACKS

  setCallbacks(callbacks = {}) {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks
    };
  }

  emit(event, data) {
    const callback = this.callbacks[event];

    if (typeof callback === "function") {
      callback(data);
    }
  }

  setState(state) {
    this.state = state;

    this.emit("onStateChange", state);
  }

  // GAME SETTINGS

  setDifficulty(difficulty) {
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return false;
    }

    this.difficulty = difficulty;
    this.obstacles.setDifficulty(difficulty);

    return true;
  }

  setMode(mode) {
    const modes = [
      "classic",
      "endless",
      "timeAttack",
      "boss",
      "hardcore",
      "coinRush"
    ];

    if (!modes.includes(mode)) {
      return false;
    }

    this.mode = mode;

    return true;
  }

  // START GAME

  start(options = {}) {
    this.stopLoop();

    if (options.difficulty) {
      this.setDifficulty(options.difficulty);
    }

    if (options.mode) {
      this.setMode(options.mode);
    }

    this.player.reset();
    this.obstacles.reset();
    this.obstacles.setDifficulty(this.difficulty);

    this.score = 0;
    this.coins = 0;
    this.pipesPassed = 0;

    this.playTime = 0;
    this.elapsedTime = 0;

    this.timeRemaining = this.timeLimit;

    this.player.alive = true;

    this.setState("playing");

    this.lastTime = performance.now();

    this.draw();

    this.animationId = requestAnimationFrame(this.loop);
  }

  // BIRD CONTROL

  flap() {
    if (this.state !== "playing") {
      return false;
    }

    return this.player.flap();
  }

  // PAUSE

  pause() {
    if (this.state !== "playing") {
      return false;
    }

    this.stopLoop();
    this.setState("paused");

    return true;
  }

  resume() {
    if (this.state !== "paused") {
      return false;
    }

    this.setState("playing");

    this.lastTime = performance.now();

    this.animationId = requestAnimationFrame(this.loop);

    return true;
  }

  // GAME LOOP

  loop(timestamp) {
    if (this.state !== "playing") {
      return;
    }

    const delta = Math.min(
      Math.max((timestamp - this.lastTime) / 16.6667, 0),
      this.maxDelta
    );

    this.lastTime = timestamp;

    this.update(delta);
    this.draw();

    if (this.state === "playing") {
      this.animationId = requestAnimationFrame(this.loop);
    }
  }

  // UPDATE GAME

  update(delta) {
    if (this.state !== "playing") return;

    this.elapsedTime += delta / 60;
    this.playTime = this.elapsedTime;

    // Time attack mode
    if (this.mode === "timeAttack") {
      this.timeRemaining -= delta / 60;

      this.emit("onTimeUpdate", Math.max(0, this.timeRemaining));

      if (this.timeRemaining <= 0) {
        this.end("time");
        return;
      }
    }

    // Update bird
    this.player.update(delta);

    // Update pipes
    this.obstacles.update(delta, this.score);

    // Check screen boundaries
    if (this.player.isOutOfBounds()) {
      this.end("boundary");
      return;
    }

    // Pipe collision
    if (this.obstacles.collides(this.player)) {
      this.end("pipe");
      return;
    }

    // Score
    const passed = this.obstacles.getPassedPipes(this.player);

    if (passed > 0) {
      this.score += passed;
      this.pipesPassed += passed;

      this.emit("onScore", this.score);
    }

    // Coins
    const collected = this.obstacles.collectCoins(this.player);

    if (collected > 0) {
      this.coins += collected;

      this.emit("onCoins", this.coins);
    }
  }

  // DRAW

  drawBackground() {
    const ctx = this.ctx;

    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Clouds
    ctx.fillStyle = "#ffffff55";

    this.drawCloud(ctx, 75, 110);
    this.drawCloud(ctx, 290, 190);
    this.drawCloud(ctx, 180, 300);

    // Ground
    ctx.fillStyle = "#ded895";
    ctx.fillRect(
      0,
      this.canvas.height - 35,
      this.canvas.width,
      35
    );

    ctx.fillStyle = "#8bc34a";
    ctx.fillRect(
      0,
      this.canvas.height - 35,
      this.canvas.width,
      8
    );
  }

  drawCloud(ctx, x, y) {
    ctx.beginPath();

    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.arc(x + 20, y - 10, 22, 0, Math.PI * 2);
    ctx.arc(x + 42, y, 18, 0, Math.PI * 2);

    ctx.fill();
  }

  draw() {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackground();

    this.obstacles.draw(ctx);
    this.player.draw(ctx);

    this.drawHUD(ctx);
  }

  drawHUD(ctx) {
    ctx.save();

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#17263d";

    ctx.lineWidth = 4;
    ctx.textAlign = "center";
    ctx.font = "bold 38px Arial";

    ctx.strokeText(
      this.score,
      this.canvas.width / 2,
      65
    );

    ctx.fillText(
      this.score,
      this.canvas.width / 2,
      65
    );

    if (this.mode === "timeAttack") {
      ctx.font = "bold 16px Arial";

      ctx.fillText(
        `TIME: ${Math.ceil(this.timeRemaining)}`,
        this.canvas.width / 2,
        95
      );
    }

    ctx.restore();
  }

  // GAME OVER

  end(reason = "collision") {
    if (
      this.state !== "playing" &&
      this.state !== "countdown"
    ) {
      return;
    }

    this.stopLoop();

    this.player.kill();

    const result = {
      score: this.score,
      coins: this.coins,
      pipes: this.pipesPassed,
      playTime: this.playTime,
      reason,
      mode: this.mode,
      difficulty: this.difficulty
    };

    // Save results once
    const updatedSave = recordGame(result);

    this.setState("gameover");

    this.emit("onGameOver", {
      ...result,
      bestScore: updatedSave.statistics.bestScore,
      totalCoins: updatedSave.wallet.coins
    });

    window.dispatchEvent(
      new CustomEvent("gameover", {
        detail: result
      })
    );
  }

  // STOP ANIMATION

  stopLoop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stopLoop();
    this.setState("menu");
  }

  // RESET TO MENU

  goToMenu() {
    this.stopLoop();

    this.player.reset();
    this.obstacles.reset();

    this.score = 0;
    this.coins = 0;
    this.pipesPassed = 0;

    this.setState("menu");

    this.draw();
  }
}