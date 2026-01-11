import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS } from "../../theme/colors";

const TWO_PI = Math.PI * 2;

export interface DebrisParticle {
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

export interface FireParticle {
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

export interface SmokeParticle {
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

export interface SparkParticle {
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
    const teamColor = alliance === 0 ? COLORS.UI.TEAM_RED_MEDIUM : COLORS.GAME.TEAM_BLUE_BRIGHT;
    const darkTeamColor = alliance === 0 ? COLORS.UI.TEAM_RED_DARK : COLORS.UI.TEAM_BLUE_MEDIUM;

    const debrisCount = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * TWO_PI;
      const speed = 1.5 + Math.random() * 3.5;
      const width = 6 + Math.random() * 10;
      const height = 4 + Math.random() * 8;
      
      let color: string = teamColor;
      const rand = Math.random();
      if (rand > 0.8) color = COLORS.TERRAIN.GROUND;
      else if (rand > 0.5) color = darkTeamColor;
      
      this.debrisParticles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        angularVelocity: (Math.random() - 0.5) * 15,
        rotation: Math.random() * TWO_PI,
        width, height,
        lifetime: 0,
        maxLifetime: 0.8 + Math.random() * 0.6,
        color
      });
    }

    const fireCount = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < fireCount; i++) {
      const angle = Math.random() * TWO_PI;
      const speed = 3 + Math.random() * 5;
      const size = 5 + Math.random() * 8;
      const colors = [COLORS.EFFECTS.FIRE_RED, COLORS.EFFECTS.FIRE_ORANGE, COLORS.EFFECTS.FIRE_YELLOW, COLORS.EFFECTS.FIRE_BRIGHT];
      this.fireParticles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        angularVelocity: (Math.random() - 0.5) * 5,
        rotation: Math.random() * TWO_PI,
        size,
        lifetime: 0,
        maxLifetime: 0.2 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const smokeCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * TWO_PI;
      const speed = 0.4 + Math.random() * 1.0;
      const size = 10 + Math.random() * 15;
      const colors = [COLORS.TERMINAL.SEPARATOR, COLORS.TERMINAL.TEXT_DIM];
      this.smokeParticles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        angularVelocity: (Math.random() - 0.5) * 2,
        rotation: Math.random() * TWO_PI,
        size,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const sparkCount = 10;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * TWO_PI;
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
    let allDead = true;

    for (const particle of this.debrisParticles) {
      particle.lifetime += deltaTime;
      if (particle.lifetime < particle.maxLifetime) {
        allDead = false;
      }
      particle.x += particle.velocityX * deltaTime;
      particle.y += particle.velocityY * deltaTime;
      particle.rotation += particle.angularVelocity * deltaTime;
      particle.velocityX *= 0.95;
      particle.velocityY *= 0.95;
    }

    for (const particle of this.fireParticles) {
      particle.lifetime += deltaTime;
      if (particle.lifetime < particle.maxLifetime) {
        allDead = false;
      }
      particle.x += particle.velocityX * deltaTime;
      particle.y += particle.velocityY * deltaTime;
      particle.rotation += particle.angularVelocity * deltaTime;
      particle.velocityX *= 0.9;
      particle.velocityY *= 0.9;
    }

    for (const particle of this.smokeParticles) {
      particle.lifetime += deltaTime;
      if (particle.lifetime < particle.maxLifetime) {
        allDead = false;
      }
      particle.x += particle.velocityX * deltaTime;
      particle.y += particle.velocityY * deltaTime;
      particle.rotation += particle.angularVelocity * deltaTime;
      particle.velocityX *= 0.98;
      particle.velocityY *= 0.98;
      particle.size += deltaTime * 10;
    }

    for (const particle of this.sparkParticles) {
      particle.lifetime += deltaTime;
      if (particle.lifetime < particle.maxLifetime) {
        allDead = false;
      }
      particle.x += particle.velocityX * deltaTime;
      particle.y += particle.velocityY * deltaTime;
      particle.velocityX *= 0.95;
      particle.velocityY *= 0.95;
    }

    this.isDead = allDead;
  }

  public getDebrisParticles(): DebrisParticle[] {
    return this.debrisParticles;
  }

  public getFireParticles(): FireParticle[] {
    return this.fireParticles;
  }

  public getSmokeParticles(): SmokeParticle[] {
    return this.smokeParticles;
  }

  public getSparkParticles(): SparkParticle[] {
    return this.sparkParticles;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    const paddedLeft = cameraX - 100;
    const paddedRight = cameraX + viewportWidth + 100;
    const paddedTop = cameraY - 100;
    const paddedBottom = cameraY + viewportHeight + 100;

    this.drawSmoke(ctx, paddedLeft, paddedRight, paddedTop, paddedBottom);
    this.drawDebris(ctx, paddedLeft, paddedRight, paddedTop, paddedBottom);
    this.drawFire(ctx, paddedLeft, paddedRight, paddedTop, paddedBottom);
    this.drawSparks(ctx, paddedLeft, paddedRight, paddedTop, paddedBottom);
  }

  private drawSmoke(ctx: CanvasRenderingContext2D, paddedLeft: number, paddedRight: number, paddedTop: number, paddedBottom: number): void {
    for (const particle of this.smokeParticles) {
      if (particle.lifetime >= particle.maxLifetime) continue;

      const particleX = particle.x * UNIT_TO_PIXEL;
      const particleY = particle.y * UNIT_TO_PIXEL;
      const halfSize = particle.size / 2;
      
      if (particleX + halfSize < paddedLeft || particleX - halfSize > paddedRight ||
          particleY + halfSize < paddedTop || particleY - halfSize > paddedBottom) continue;

      const alpha = 1 - particle.lifetime / particle.maxLifetime;

      ctx.save();
      ctx.translate(particleX, particleY);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, halfSize, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawDebris(ctx: CanvasRenderingContext2D, paddedLeft: number, paddedRight: number, paddedTop: number, paddedBottom: number): void {
    for (const particle of this.debrisParticles) {
      if (particle.lifetime >= particle.maxLifetime) continue;

      const particleX = particle.x * UNIT_TO_PIXEL;
      const particleY = particle.y * UNIT_TO_PIXEL;
      const halfMaxSize = Math.max(particle.width, particle.height) / 2;
      
      if (particleX + halfMaxSize < paddedLeft || particleX - halfMaxSize > paddedRight ||
          particleY + halfMaxSize < paddedTop || particleY - halfMaxSize > paddedBottom) continue;

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

  private drawFire(ctx: CanvasRenderingContext2D, paddedLeft: number, paddedRight: number, paddedTop: number, paddedBottom: number): void {
    for (const particle of this.fireParticles) {
      if (particle.lifetime >= particle.maxLifetime) continue;

      const particleX = particle.x * UNIT_TO_PIXEL;
      const particleY = particle.y * UNIT_TO_PIXEL;
      const halfSize = particle.size / 2;
      
      if (particleX + halfSize < paddedLeft || particleX - halfSize > paddedRight ||
          particleY + halfSize < paddedTop || particleY - halfSize > paddedBottom) continue;

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

  private drawSparks(ctx: CanvasRenderingContext2D, paddedLeft: number, paddedRight: number, paddedTop: number, paddedBottom: number): void {
    ctx.fillStyle = COLORS.TERMINAL.WARNING;
    for (const particle of this.sparkParticles) {
      if (particle.lifetime >= particle.maxLifetime) continue;

      const particleX = particle.x * UNIT_TO_PIXEL;
      const particleY = particle.y * UNIT_TO_PIXEL;
      const halfMaxSize = Math.max(particle.width, particle.height) / 2;
      
      if (particleX + halfMaxSize < paddedLeft || particleX - halfMaxSize > paddedRight ||
          particleY + halfMaxSize < paddedTop || particleY - halfMaxSize > paddedBottom) continue;

      const alpha = 1 - particle.lifetime / particle.maxLifetime;

      ctx.save();
      ctx.translate(particleX, particleY);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillRect(0, -0.5, particle.width, particle.height);
      ctx.restore();
    }
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
