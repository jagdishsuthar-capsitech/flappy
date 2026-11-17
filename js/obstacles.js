
export class Obstacles {
  constructor(canvas, options = {}) {
    this.canvas = canvas;

    this.width = options.width ?? 65;
    this.gap = options.gap ?? 165;
    this.speed = options.speed ?? 2.5;

    this.spawnInterval = options.spawnInterval ?? 95;

    this.items = [];
    this.coins = [];

    this.spawnTimer = 0;
    this.nextId = 0;

    this.coinRadius = 9;
  }

  reset() {
    this.items = [];
    this.coins = [];

    this.spawnTimer = 0;
    this.nextId = 0;
  }

  setDifficulty(difficulty) {
    const settings = {
      easy: {
        gap: 190,
        speed: 2,
        interval: 115
      },
      medium: {
        gap: 165,
        speed: 2.5,
        interval: 95
      },
      hard: {
        gap: 145,
        speed: 3.2,
        interval: 85
      }
    };

    const config = settings[difficulty] || settings.medium;

    this.gap = config.gap;
    this.speed = config.speed;
    this.spawnInterval = config.interval;
  }

  update(delta = 1, score = 0) {
    delta = Math.min(Math.max(delta, 0), 2);

    this.spawnTimer += delta;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer -= this.spawnInterval;
      this.spawn();
    }

    for (const pipe of this.items) {
      pipe.x -= this.speed * delta;
    }

    for (const coin of this.coins) {
      coin.x -= this.speed * delta;
      coin.rotation += 0.08 * delta;
    }

    this.items = this.items.filter(
      pipe => pipe.x + this.width + 10 > 0
    );

    this.coins = this.coins.filter(
      coin => coin.x + this.coinRadius > 0 && !coin.collected
    );
  }

  spawn() {
    const margin = 85;

    const gap = Math.max(
      120,
      this.gap - Math.floor(this.items.length * 0.5)
    );

    const availableHeight =
      this.canvas.height - gap - margin * 2;

    const top = margin +
      Math.random() * Math.max(0, availableHeight);

    const pipe = {
      id: this.nextId++,
      x: this.canvas.width,
      top,
      gap,
      scored: false
    };

    this.items.push(pipe);

    // Spawn a coin in the middle of the opening
    if (Math.random() < 0.75) {
      this.coins.push({
        x: pipe.x + this.width / 2,
        y: top + gap / 2,
        collected: false,
        rotation: 0
      });
    }
  }

  draw(ctx) {
    this.drawPipes(ctx);
    this.drawCoins(ctx);
  }

  drawPipes(ctx) {
    for (const pipe of this.items) {
      const bottomY = pipe.top + pipe.gap;

      // Main pipe body
      ctx.fillStyle = "#36a852";

      ctx.fillRect(
        pipe.x,
        0,
        this.width,
        pipe.top
      );

      ctx.fillRect(
        pipe.x,
        bottomY,
        this.width,
        this.canvas.height - bottomY
      );

      // Pipe shading
      ctx.fillStyle = "#22843c";

      ctx.fillRect(
        pipe.x + this.width - 12,
        0,
        12,
        pipe.top
      );

      ctx.fillRect(
        pipe.x + this.width - 12,
        bottomY,
        12,
        this.canvas.height - bottomY
      );

      // Pipe caps
      ctx.fillStyle = "#4ac665";

      ctx.fillRect(
        pipe.x - 5,
        pipe.top - 20,
        this.width + 10,
        20
      );

      ctx.fillRect(
        pipe.x - 5,
        bottomY,
        this.width + 10,
        20
      );

      ctx.strokeStyle = "#176b31";
      ctx.lineWidth = 2;

      ctx.strokeRect(
        pipe.x,
        0,
        this.width,
        pipe.top
      );

      ctx.strokeRect(
        pipe.x,
        bottomY,
        this.width,
        this.canvas.height - bottomY
      );
    }
  }

  drawCoins(ctx) {
    for (const coin of this.coins) {
      if (coin.collected) continue;

      ctx.save();

      ctx.translate(coin.x, coin.y);

      const scale = Math.max(
        0.25,
        Math.abs(Math.cos(coin.rotation))
      );

      ctx.scale(scale, 1);

      ctx.fillStyle = "#ffcf38";
      ctx.strokeStyle = "#d68a00";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(
        0,
        0,
        this.coinRadius,
        0,
        Math.PI * 2
      );

      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fff1a3";
      ctx.fillRect(-2, -5, 4, 10);

      ctx.restore();
    }
  }

  collides(player) {
    const bounds = player.getBounds();

    for (const pipe of this.items) {
      const overlapsX =
        bounds.x + bounds.width > pipe.x &&
        bounds.x < pipe.x + this.width;

      const hitsTop =
        bounds.y < pipe.top;

      const hitsBottom =
        bounds.y + bounds.height > pipe.top + pipe.gap;

      if (overlapsX && (hitsTop || hitsBottom)) {
        return true;
      }
    }

    return false;
  }

  collectCoins(player) {
    const bounds = player.getBounds();
    let collected = 0;

    for (const coin of this.coins) {
      if (coin.collected) continue;

      const closestX = Math.max(
        bounds.x,
        Math.min(coin.x, bounds.x + bounds.width)
      );

      const closestY = Math.max(
        bounds.y,
        Math.min(coin.y, bounds.y + bounds.height)
      );

      const dx = coin.x - closestX;
      const dy = coin.y - closestY;

      if (
        dx * dx + dy * dy <=
        this.coinRadius * this.coinRadius
      ) {
        coin.collected = true;
        collected++;
      }
    }

    return collected;
  }

  getPassedPipes(player) {
    let passed = 0;

    for (const pipe of this.items) {
      if (
        !pipe.scored &&
        pipe.x + this.width < player.x
      ) {
        pipe.scored = true;
        passed++;
      }
    }

    return passed;
  }
}
