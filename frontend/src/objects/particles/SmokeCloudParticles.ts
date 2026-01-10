import { UNIT_TO_PIXEL } from "../../constants";
import { isPointInViewport } from "../../utils/viewport";
import { COLORS } from "../../theme/colors";

interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  maxSize: number;
  lifetime: number;
  maxLifetime: number;
  rotationSpeed: number;
  rotation: number;
  color: string;
}

export class SmokeCloudParticles {
  private particles: Particle[] = [];
  private isDead = false;
  private isEmitting = true;
  private timeSinceLastEmit = 0;
  private emitInterval = 0.08;
  private centerX: number;
  private centerY: number;
  private radius: number;

  constructor(x: number, y: number, radius: number) {
    this.centerX = x;
    this.centerY = y;
    this.radius = radius;

    for (let i = 0; i < 20; i++) {
      this.emitParticle();
    }
  }

  private emitParticle(): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.radius * 0.6;

    const speed = 0.1 + Math.random() * 0.3;
    const color = COLORS.TERMINAL.TEXT_MUTED;

    this.particles.push({
      x: this.centerX + Math.cos(angle) * dist,
      y: this.centerY + Math.sin(angle) * dist,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      size: 0,
      maxSize: this.radius * (0.25 + Math.random() * 0.25),
      lifetime: 0,
      maxLifetime: 3.0 + Math.random() * 1.5,
      rotationSpeed: (Math.random() - 0.5) * 0.5,
      rotation: Math.random() * Math.PI * 2,
      color: color,
    });
  }

  public stopEmitting(): void {
    this.isEmitting = false;
  }

  public update(deltaTime: number): void {
    if (this.isEmitting) {
      this.timeSinceLastEmit += deltaTime;
      while (this.timeSinceLastEmit >= this.emitInterval) {
        this.emitParticle();
        this.timeSinceLastEmit -= this.emitInterval;
      }
    }

    let allDead = true;
    for (const p of this.particles) {
      p.lifetime += deltaTime;
      if (p.lifetime < p.maxLifetime) {
        allDead = false;

        p.x += p.velocityX * deltaTime;
        p.y += p.velocityY * deltaTime;

        p.velocityX *= Math.pow(0.3, deltaTime);
        p.velocityY *= Math.pow(0.3, deltaTime);

        p.rotation += p.rotationSpeed * deltaTime;

        const progress = p.lifetime / p.maxLifetime;
        // Start closer to full size and expand less
        p.size = p.maxSize * (0.7 + 0.3 * Math.min(1, progress * 2));
      }
    }

    if (!this.isEmitting && allDead) {
      this.isDead = true;
    }
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    const prevAlpha = ctx.globalAlpha;
    const TWO_PI = Math.PI * 2;

    ctx.fillStyle = COLORS.TERMINAL.TEXT_MUTED;

    // Group particles by alpha bucket
    const particlesByAlpha = new Map<number, typeof this.particles>();

    for (const p of this.particles) {
      if (p.lifetime >= p.maxLifetime) continue;

      const px = p.x * UNIT_TO_PIXEL;
      const py = p.y * UNIT_TO_PIXEL;
      const pSize = p.size * UNIT_TO_PIXEL;

      if (
        !isPointInViewport(
          px,
          py,
          pSize,
          cameraX,
          cameraY,
          viewportWidth,
          viewportHeight
        )
      ) {
        continue;
      }

      const progress = p.lifetime / p.maxLifetime;
      const fadeIn = Math.min(1, progress / 0.4);
      const fadeOut = Math.max(0, 1 - progress);
      const alpha = fadeIn * fadeOut * 0.3;
      const alphaKey = Math.round(alpha * 20) / 20; // Bucket alphas to nearest 0.05

      if (!particlesByAlpha.has(alphaKey)) {
        particlesByAlpha.set(alphaKey, []);
      }
      particlesByAlpha.get(alphaKey)!.push(p);
    }

    for (const [alpha, particles] of particlesByAlpha) {
      ctx.globalAlpha = alpha;
      ctx.beginPath();

      for (const p of particles) {
        const px = p.x * UNIT_TO_PIXEL;
        const py = p.y * UNIT_TO_PIXEL;
        const pSize = p.size * UNIT_TO_PIXEL;

        ctx.moveTo(px + pSize, py);
        ctx.arc(px, py, pSize, 0, TWO_PI);
      }

      ctx.fill();
    }

    ctx.globalAlpha = prevAlpha;
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
