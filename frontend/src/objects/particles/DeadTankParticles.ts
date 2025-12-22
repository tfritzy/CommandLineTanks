import { UNIT_TO_PIXEL } from "../../game";

interface Particle {
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
  type: 'debris' | 'smoke' | 'fire' | 'spark';
}

export class DeadTankParticles {
  private particles: Particle[] = [];
  private isDead = false;

  constructor(x: number, y: number, alliance: number) {
    const teamColor = alliance === 0 ? "#9d4343" : "#495f94";
    const darkTeamColor = alliance === 0 ? "#813645" : "#3e4c7e";

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
      
      this.particles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        angularVelocity: (Math.random() - 0.5) * 15,
        rotation: Math.random() * Math.PI * 2,
        width, height,
        lifetime: 0,
        maxLifetime: 0.8 + Math.random() * 0.6,
        color,
        type: 'debris'
      });
    }

    // 2. Fire/Explosion Flash - Reduced count
    const fireCount = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < fireCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      const size = 5 + Math.random() * 8;
      const colors = ["#c06852", "#e39764", "#f5c47c", "#fceba8"];
      this.particles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        angularVelocity: (Math.random() - 0.5) * 5,
        rotation: Math.random() * Math.PI * 2,
        width: size, height: size,
        lifetime: 0,
        maxLifetime: 0.2 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'fire'
      });
    }

    // 3. Smoke - Minimal count
    const smokeCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.0;
      const size = 10 + Math.random() * 15;
      const colors = ["#4a4b5b", "#707b89"];
      this.particles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        angularVelocity: (Math.random() - 0.5) * 2,
        rotation: Math.random() * Math.PI * 2,
        width: size, height: size,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'smoke'
      });
    }

    // 4. Sparks - Reduced count
    const sparkCount = 10;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 8;
      this.particles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        angularVelocity: 0,
        rotation: angle,
        width: 2.5, height: 1.2,
        lifetime: 0,
        maxLifetime: 0.1 + Math.random() * 0.2,
        color: "#fceba8",
        type: 'spark'
      });
    }
  }

  public update(deltaTime: number): void {
    for (const particle of this.particles) {
      particle.lifetime += deltaTime;
      particle.x += particle.velocityX * deltaTime;
      particle.y += particle.velocityY * deltaTime;
      particle.rotation += particle.angularVelocity * deltaTime;

      if (particle.type === 'smoke') {
        particle.velocityX *= 0.98;
        particle.velocityY *= 0.98;
        particle.width += deltaTime * 10; // Smoke expands
        particle.height += deltaTime * 10;
      } else if (particle.type === 'fire') {
        particle.velocityX *= 0.9;
        particle.velocityY *= 0.9;
      } else {
        particle.velocityX *= 0.95;
        particle.velocityY *= 0.95;
      }
    }

    this.isDead = this.particles.every((p) => p.lifetime >= p.maxLifetime);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // Draw smoke first (bottom layer)
    this.drawParticlesByType(ctx, 'smoke');
    // Then debris
    this.drawParticlesByType(ctx, 'debris');
    // Then fire
    this.drawParticlesByType(ctx, 'fire');
    // Then sparks (top layer)
    this.drawParticlesByType(ctx, 'spark');
  }

  private drawParticlesByType(ctx: CanvasRenderingContext2D, type: string): void {
    for (const particle of this.particles) {
      if (particle.type !== type || particle.lifetime >= particle.maxLifetime) continue;

      const alpha = 1 - particle.lifetime / particle.maxLifetime;

      ctx.save();
      ctx.translate(particle.x * UNIT_TO_PIXEL, particle.y * UNIT_TO_PIXEL);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;

      if (particle.type === 'smoke') {
        ctx.beginPath();
        ctx.arc(0, 0, particle.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'spark') {
        ctx.fillRect(0, -0.5, particle.width, particle.height);
      } else {
        // Debris and Fire are rectangles
        ctx.fillRect(
          -particle.width / 2,
          -particle.height / 2,
          particle.width,
          particle.height
        );
        
        if (particle.type === 'debris') {
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 1;
          ctx.strokeRect(
            -particle.width / 2,
            -particle.height / 2,
            particle.width,
            particle.height
          );
        }
      }

      ctx.restore();
    }
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
