import { UNIT_TO_PIXEL, TEAM_COLORS } from "../../constants";
import { isPointInViewport } from "../../utils/viewport";
import { drawMuzzleFlashParticles } from "../../drawing";

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
    const baseColor = alliance === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;
    const colors = [baseColor, "#fcfbf3"];
    
    const particleCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < particleCount; i++) {
      const angleOffset = (Math.random() - 0.5) * ANGLE_SPREAD_RADIANS;
      const particleAngle = angle + angleOffset;
      
      const speed = 6 + Math.random() * 8;
      
      this.particles.push({
        x,
        y,
        velocityX: Math.cos(particleAngle) * speed,
        velocityY: Math.sin(particleAngle) * speed,
        size: 0.03 + Math.random() * 0.04,
        lifetime: 0,
        maxLifetime: 0.08 + Math.random() * 0.08,
        color: colors[Math.floor(Math.random() * colors.length)]
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
    for (const p of this.particles) {
      if (p.lifetime >= p.maxLifetime) continue;

      const px = p.x * UNIT_TO_PIXEL;
      const py = p.y * UNIT_TO_PIXEL;
      const pSize = p.size * UNIT_TO_PIXEL;

      if (!isPointInViewport(px, py, pSize, cameraX, cameraY, viewportWidth, viewportHeight)) {
        continue;
      }

      drawMuzzleFlashParticles(ctx, p);
    }
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
