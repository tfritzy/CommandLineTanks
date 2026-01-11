import type { Particle } from "./ParticleTypes";
import { COLORS } from "../../theme/colors";

const TWO_PI = Math.PI * 2;

export class TerrainDebrisParticles {
  private particles: Particle[] = [];
  private isDead = false;
  private x: number;
  private y: number;
  private cachedPosition: { x: number; y: number };

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.cachedPosition = { x, y };
    const fenceColors = [COLORS.TERMINAL.TEXT_MUTED, COLORS.TERMINAL.TEXT_DIM, COLORS.TERMINAL.SEPARATOR];
    
    const particleCount = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * TWO_PI;
      const speed = 1.5 + Math.random() * 2.5;
      
      this.particles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size: 0.03 + Math.random() * 0.04,
        lifetime: 0,
        maxLifetime: 0.3 + Math.random() * 0.3,
        color: fenceColors[Math.floor(Math.random() * fenceColors.length)]
      });
    }
  }

  public update(deltaTime: number): void {
    let allDead = true;
    for (const p of this.particles) {
      p.lifetime += deltaTime;
      if (p.lifetime < p.maxLifetime) {
        p.x += p.velocityX * deltaTime;
        p.y += p.velocityY * deltaTime;
        p.velocityY += 3 * deltaTime;
        p.velocityX *= 0.97;
        p.velocityY *= 0.97;
        allDead = false;
      }
    }
    this.isDead = allDead;
  }

  public getParticles(): Particle[] {
    return this.particles;
  }

  public getIsDead(): boolean {
    return this.isDead;
  }

  public getPosition(): { x: number; y: number } {
    this.cachedPosition.x = this.x;
    this.cachedPosition.y = this.y;
    return this.cachedPosition;
  }
}
