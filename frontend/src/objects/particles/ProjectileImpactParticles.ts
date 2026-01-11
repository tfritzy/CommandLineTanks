export interface ProjectileImpactParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  lifetime: number;
  maxLifetime: number;
}

export class ProjectileImpactParticles {
  private particles: ProjectileImpactParticle[] = [];
  private isDead = false;
  private color: string;

  constructor(x: number, y: number, velocityX: number, velocityY: number, color: string) {
    this.color = color;
    const oppositeX = -velocityX;
    const oppositeY = -velocityY;
    
    const speed = Math.sqrt(oppositeX * oppositeX + oppositeY * oppositeY);
    const dirX = speed > 0 ? oppositeX / speed : 0;
    const dirY = speed > 0 ? oppositeY / speed : 0;

    const particleCount = 7 + Math.floor(Math.random() * 6);
    for (let i = 0; i < particleCount; i++) {
      const angleOffset = (Math.random() - 0.5) * 1.3; 
      const cos = Math.cos(angleOffset);
      const sin = Math.sin(angleOffset);
      
      const pDirX = dirX * cos - dirY * sin;
      const pDirY = dirX * sin + dirY * cos;
      
      const pSpeed = 2.5 + Math.random() * 3;
      
      this.particles.push({
        x, y,
        velocityX: pDirX * pSpeed,
        velocityY: pDirY * pSpeed,
        size: 0.02 + Math.random() * .03,
        lifetime: 0,
        maxLifetime: 0.2 + Math.random() * 0.2
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
        p.velocityX *= 0.95;
        p.velocityY *= 0.95;
        allDead = false;
      }
    }
    this.isDead = allDead;
  }

  public getParticles(): ProjectileImpactParticle[] {
    return this.particles;
  }

  public getColor(): string {
    return this.color;
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
