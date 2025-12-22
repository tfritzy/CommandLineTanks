import { ProjectileImpactParticles } from "../objects/ProjectileImpactParticles";
import { ExplosionParticles } from "../objects/ExplosionParticles";

export class ProjectileImpactParticlesManager {
  private particleSystems: (ProjectileImpactParticles | ExplosionParticles)[] = [];

  public spawnParticles(x: number, y: number, velocityX: number, velocityY: number, color: string): void {
    const particles = new ProjectileImpactParticles(x, y, velocityX, velocityY, color);
    this.particleSystems.push(particles);
  }

  public spawnExplosion(x: number, y: number, explosionRadius: number): void {
    const particles = new ExplosionParticles(x, y, explosionRadius);
    this.particleSystems.push(particles);
  }

  public update(deltaTime: number): void {
    for (const system of this.particleSystems) {
      system.update(deltaTime);
    }

    this.particleSystems = this.particleSystems.filter(
      (system) => !system.getIsDead()
    );
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const system of this.particleSystems) {
      system.draw(ctx);
    }
  }
}
