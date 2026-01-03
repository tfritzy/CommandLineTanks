import { UNIT_TO_PIXEL, TEAM_COLORS } from "../../constants";
import { isPointInViewport } from "../../utils/viewport";

interface DebrisParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  angularVelocity: number;
  rotation: number;
  width: number;
  height: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
}

interface FireParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  angularVelocity: number;
  rotation: number;
  size: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
}

interface SmokeParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  angularVelocity: number;
  rotation: number;
  size: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
}

interface SparkParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  width: number;
  height: number;
  lifetime: number;
  maxLifetime: number;
}

export class DeadTankParticles {
  private debrisParticles: DebrisParticle[] = [];
  private fireParticles: FireParticle[] = [];
  private smokeParticles: SmokeParticle[] = [];
  private sparkParticles: SparkParticle[] = [];
  private isDead = false;

  constructor(x: number, y: number, alliance: number) {
    const teamColor = alliance === 0 ? TEAM_COLORS.RED.DEBRIS_LIGHT : TEAM_COLORS.BLUE.DEBRIS_LIGHT;
    const darkTeamColor = alliance === 0 ? TEAM_COLORS.RED.DEBRIS_DARK : TEAM_COLORS.BLUE.DEBRIS_DARK;

    // 1. Debris (Tank parts) - Reduced count
    const debrisCount = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      const width = 6 + Math.random() * 10;
      const height = 4 + Math.random() * 8;
      
      let color = teamColor;
      const rand = Math.random();
      if (rand > 0.8) color = "#2e2e43";
      else if (rand > 0.5) color = darkTeamColor;
      
      this.debrisParticles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        angularVelocity: (Math.random() - 0.5) * 15,
        rotation: Math.random() * Math.PI * 2,
        width, height,
        lifetime: 0,
        maxLifetime: 0.8 + Math.random() * 0.6,
        color
      });
    }

    // 2. Fire/Explosion Flash - Reduced count
    const fireCount = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < fireCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      const size = 5 + Math.random() * 8;
      const colors = ["#c06852", "#e39764", "#f5c47c", "#fceba8"];
      this.fireParticles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        angularVelocity: (Math.random() - 0.5) * 5,
        rotation: Math.random() * Math.PI * 2,
        size,
        lifetime: 0,
        maxLifetime: 0.2 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // 3. Smoke - Minimal count
    const smokeCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.0;
      const size = 10 + Math.random() * 15;
      const colors = ["#4a4b5b", "#707b89"];
      this.smokeParticles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        angularVelocity: (Math.random() - 0.5) * 2,
        rotation: Math.random() * Math.PI * 2,
        size,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // 4. Sparks - Reduced count
    const sparkCount = 10;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 8;
      this.sparkParticles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        rotation: angle,
        width: 2.5, 
        height: 1.2,
        lifetime: 0,
        maxLifetime: 0.1 + Math.random() * 0.2
      });
    }
  }

  public update(deltaTime: number): void {
    for (const particle of this.debrisParticles) {
      particle.lifetime += deltaTime;
      particle.x += particle.velocityX * deltaTime;
      particle.y += particle.velocityY * deltaTime;
      particle.rotation += particle.angularVelocity * deltaTime;
      particle.velocityX *= 0.95;
      particle.velocityY *= 0.95;
    }

    for (const particle of this.fireParticles) {
      particle.lifetime += deltaTime;
      particle.x += particle.velocityX * deltaTime;
      particle.y += particle.velocityY * deltaTime;
      particle.rotation += particle.angularVelocity * deltaTime;
      particle.velocityX *= 0.9;
      particle.velocityY *= 0.9;
    }

    for (const particle of this.smokeParticles) {
      particle.lifetime += deltaTime;
      particle.x += particle.velocityX * deltaTime;
      particle.y += particle.velocityY * deltaTime;
      particle.rotation += particle.angularVelocity * deltaTime;
      particle.velocityX *= 0.98;
      particle.velocityY *= 0.98;
      particle.size += deltaTime * 10;
    }

    for (const particle of this.sparkParticles) {
      particle.lifetime += deltaTime;
      particle.x += particle.velocityX * deltaTime;
      particle.y += particle.velocityY * deltaTime;
      particle.velocityX *= 0.95;
      particle.velocityY *= 0.95;
    }

    this.isDead = 
      this.debrisParticles.every((p) => p.lifetime >= p.maxLifetime) &&
      this.fireParticles.every((p) => p.lifetime >= p.maxLifetime) &&
      this.smokeParticles.every((p) => p.lifetime >= p.maxLifetime) &&
      this.sparkParticles.every((p) => p.lifetime >= p.maxLifetime);
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    this.drawSmoke(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
    this.drawDebris(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
    this.drawFire(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
    this.drawSparks(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
  }

  private drawSmoke(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    for (const particle of this.smokeParticles) {
      if (particle.lifetime >= particle.maxLifetime) continue;

      const particleX = particle.x * UNIT_TO_PIXEL;
      const particleY = particle.y * UNIT_TO_PIXEL;
      const halfSize = particle.size / 2;
      
      if (!isPointInViewport(particleX, particleY, halfSize, cameraX, cameraY, viewportWidth, viewportHeight)) {
        continue;
      }

      const alpha = 1 - particle.lifetime / particle.maxLifetime;

      ctx.save();
      ctx.translate(particleX, particleY);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawDebris(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    for (const particle of this.debrisParticles) {
      if (particle.lifetime >= particle.maxLifetime) continue;

      const particleX = particle.x * UNIT_TO_PIXEL;
      const particleY = particle.y * UNIT_TO_PIXEL;
      const halfMaxSize = Math.max(particle.width, particle.height) / 2;
      
      if (!isPointInViewport(particleX, particleY, halfMaxSize, cameraX, cameraY, viewportWidth, viewportHeight)) {
        continue;
      }

      const alpha = 1 - particle.lifetime / particle.maxLifetime;

      ctx.save();
      ctx.translate(particleX, particleY);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        -particle.width / 2,
        -particle.height / 2,
        particle.width,
        particle.height
      );
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        -particle.width / 2,
        -particle.height / 2,
        particle.width,
        particle.height
      );
      ctx.restore();
    }
  }

  private drawFire(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    for (const particle of this.fireParticles) {
      if (particle.lifetime >= particle.maxLifetime) continue;

      const particleX = particle.x * UNIT_TO_PIXEL;
      const particleY = particle.y * UNIT_TO_PIXEL;
      const halfSize = particle.size / 2;
      
      if (!isPointInViewport(particleX, particleY, halfSize, cameraX, cameraY, viewportWidth, viewportHeight)) {
        continue;
      }

      const alpha = 1 - particle.lifetime / particle.maxLifetime;

      ctx.save();
      ctx.translate(particleX, particleY);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        -halfSize,
        -halfSize,
        particle.size,
        particle.size
      );
      ctx.restore();
    }
  }

  private drawSparks(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    for (const particle of this.sparkParticles) {
      if (particle.lifetime >= particle.maxLifetime) continue;

      const particleX = particle.x * UNIT_TO_PIXEL;
      const particleY = particle.y * UNIT_TO_PIXEL;
      const halfMaxSize = Math.max(particle.width, particle.height) / 2;
      
      if (!isPointInViewport(particleX, particleY, halfMaxSize, cameraX, cameraY, viewportWidth, viewportHeight)) {
        continue;
      }

      const alpha = 1 - particle.lifetime / particle.maxLifetime;

      ctx.save();
      ctx.translate(particleX, particleY);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#fceba8";
      ctx.fillRect(0, -0.5, particle.width, particle.height);
      ctx.restore();
    }
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
