import { ProjectileImpactParticles } from "../objects/particles/ProjectileImpactParticles";
import { ExplosionParticles } from "../objects/particles/ExplosionParticles";

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

  public destroy(): void {
    this.particleSystems.length = 0;
  }

  public update(deltaTime: number): void {
    let writeIndex = 0;
    for (let i = 0; i < this.particleSystems.length; i++) {
      this.particleSystems[i].update(deltaTime);
      if (!this.particleSystems[i].getIsDead()) {
        if (writeIndex !== i) {
          this.particleSystems[writeIndex] = this.particleSystems[i];
        }
        writeIndex++;
      }
    }
    this.particleSystems.length = writeIndex;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    for (const system of this.particleSystems) {
      system.draw(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
    }
  }
}
