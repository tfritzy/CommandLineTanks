import { COLORS } from "../../theme/colors";

const ANGLE_SPREAD_RADIANS = 0.8;
const FRICTION_FACTOR = 0.92;

export interface MuzzleFlashParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  lifetime: number;
  maxLifetime: number;
}

export class MuzzleFlashParticles {
  private particles: MuzzleFlashParticle[] = [];
  private isDead = false;
  private color: string;

  constructor(x: number, y: number, angle: number, alliance: number) {
    this.color = alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT : COLORS.GAME.TEAM_BLUE_BRIGHT;
    
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
        maxLifetime: 0.06 + Math.random() * 0.06
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

  public getParticles(): MuzzleFlashParticle[] {
    return this.particles;
  }

  public getColor(): string {
    return this.color;
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
