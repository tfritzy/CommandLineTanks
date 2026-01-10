import { UNIT_TO_PIXEL } from "../../constants";
import { isPointInViewport } from "../../utils/viewport";
import { COLORS } from "../../theme/colors";

const ANGLE_SPREAD_RADIANS = 0.8;
const FRICTION_FACTOR = 0.92;

interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
}

export class MuzzleFlashParticles {
  private particles: Particle[] = [];
  private isDead = false;

  constructor(x: number, y: number, angle: number, alliance: number) {
    const color = alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT : COLORS.GAME.TEAM_BLUE_BRIGHT;
    
    const particleCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < particleCount; i++) {
      const angleOffset = (Math.random() - 0.5) * ANGLE_SPREAD_RADIANS;
      const particleAngle = angle + angleOffset;
      
      const speed = 3 + Math.random() * 4;
      
      this.particles.push({
        x,
        y,
        velocityX: Math.cos(particleAngle) * speed,
        velocityY: Math.sin(particleAngle) * speed,
        size: 0.03 + Math.random() * 0.04,
        lifetime: 0,
        maxLifetime: 0.06 + Math.random() * 0.06,
        color: color
      });
    }
  }

  public update(deltaTime: number): void {
    const frictionMultiplier = Math.pow(FRICTION_FACTOR, deltaTime);
    let allDead = true;
    for (const p of this.particles) {
      p.lifetime += deltaTime;
      if (p.lifetime < p.maxLifetime) {
        p.x += p.velocityX * deltaTime;
        p.y += p.velocityY * deltaTime;
        p.velocityX *= frictionMultiplier;
        p.velocityY *= frictionMultiplier;
        allDead = false;
      }
    }
    this.isDead = allDead;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    const prevAlpha = ctx.globalAlpha;
    const TWO_PI = Math.PI * 2;
    
    for (const p of this.particles) {
      if (p.lifetime >= p.maxLifetime) continue;

      const px = p.x * UNIT_TO_PIXEL;
      const py = p.y * UNIT_TO_PIXEL;
      const pSize = p.size * UNIT_TO_PIXEL;

      if (!isPointInViewport(px, py, pSize, cameraX, cameraY, viewportWidth, viewportHeight)) {
        continue;
      }

      const alpha = 1 - p.lifetime / p.maxLifetime;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, TWO_PI);
      ctx.fill();
    }
    
    ctx.globalAlpha = prevAlpha;
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
