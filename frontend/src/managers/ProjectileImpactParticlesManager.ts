import { ProjectileImpactParticles } from "../objects/particles/ProjectileImpactParticles";
import { ExplosionParticles } from "../objects/particles/ExplosionParticles";
import { DrawableManager } from "./DrawableManager";
import { Drawable } from "../types/Drawable";

export class ProjectileImpactParticlesManager extends DrawableManager<Drawable> {
  public spawnParticles(x: number, y: number, velocityX: number, velocityY: number, color: string): void {
    const particles = new ProjectileImpactParticles(x, y, velocityX, velocityY, color);
    this.add(particles);
  }

  public spawnExplosion(x: number, y: number, explosionRadius: number): void {
    const particles = new ExplosionParticles(x, y, explosionRadius);
    this.add(particles);
  }
}
