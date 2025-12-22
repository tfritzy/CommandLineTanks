import { ProjectileImpactParticles } from "./objects/ProjectileImpactParticles";

export class ProjectileImpactParticlesManager {
  private particleSystems: ProjectileImpactParticles[] = [];

  public spawnParticles(x: number, y: number, velocityX: number, velocityY: number, color: string): void {
    const particles = new ProjectileImpactParticles(x, y, velocityX, velocityY, color);
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
