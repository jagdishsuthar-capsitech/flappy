export class Player {
  constructor(canvas, options = {}) {
    this.canvas = canvas;

    this.width = options.width ?? 34;
    this.height = options.height ?? 28;

    this.gravity = options.gravity ?? 0.38;
    this.jumpForce = options.jumpForce ?? -7.2;
    this.maxFallSpeed = options.maxFallSpeed ?? 9;

    this.reset();
  }

  reset() {
    this.x = 100;
    this.y = this.canvas.height / 2;

    this.velocity = 0;
    this.rotation = 0;

    this.alive = true;
    this.visible = true;

    this.animationFrame = 0;
    this.animationTimer = 0;

    this.wingPosition = 0;
    this.flapCooldown = 0;
  }

  flap() {
    if (!this.alive || this.flapCooldown > 0) {
      return false;
    }

    this.velocity = this.jumpForce;
    this.flapCooldown = 4;

    this.wingPosition = -1;

    return true;
  }

  update(delta = 1) {
    if (!this.alive) return;

    delta = Math.min(Math.max(delta, 0), 2);

    this.flapCooldown = Math.max(
      0,
      this.flapCooldown - delta
    );

    // Gravity
    this.velocity += this.gravity * delta;

    // Limit falling speed
    this.velocity = Math.min(
      this.velocity,
      this.maxFallSpeed
    );

    // Vertical movement
    this.y += this.velocity * delta;

    // Bird rotation
    const targetRotation = Math.max(
      -0.45,
      Math.min(1.1, this.velocity * 0.07)
    );

    this.rotation +=
      (targetRotation - this.rotation) *
      Math.min(1, 0.15 * delta);

    // Wing animation
    this.animationTimer += delta;

    if (this.animationTimer >= 5) {
      this.animationTimer = 0;

      this.animationFrame =
        (this.animationFrame + 1) % 3;
    }

    this.wingPosition =
      Math.sin(this.animationTimer * 0.8);
  }

  getBounds() {
    // Slightly smaller hitbox for fair gameplay
    const insetX = this.width * 0.12;
    const insetY = this.height * 0.15;

    return {
      x: this.x + insetX,
      y: this.y + insetY,
      width: this.width - insetX * 2,
      height: this.height - insetY * 2
    };
  }

  isOutOfBounds() {
    return (
      this.y < 0 ||
      this.y + this.height > this.canvas.height
    );
  }

  kill() {
    this.alive = false;
    this.velocity = 0;
  }

  draw(ctx) {
    if (!this.visible) return;

    ctx.save();

    ctx.translate(
      this.x + this.width / 2,
      this.y + this.height / 2
    );

    ctx.rotate(this.rotation);

    // Body
    ctx.fillStyle = "#ffcf38";

    ctx.beginPath();
    ctx.ellipse(
      0, 0,
      this.width * 0.48,
      this.height * 0.45,
      0, 0, Math.PI * 2
    );
    ctx.fill();

    // Wing
    ctx.fillStyle = "#f3a712";

    ctx.beginPath();
    ctx.ellipse(
      -3,
      3 + this.wingPosition * 2,
      8,
      5,
      -0.2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Eye
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(8, -6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#222222";

    ctx.beginPath();
    ctx.arc(10, -6, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = "#ff7733";

    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(25, 4);
    ctx.lineTo(14, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}