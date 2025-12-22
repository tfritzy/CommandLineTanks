import { DeadTankParticles } from "../objects/particles/DeadTankParticles";

export class DeadTankParticlesManager {
  private particleSystems: DeadTankParticles[] = [];

  public spawnParticles(x: number, y: number, alliance: number): void {
    const particles = new DeadTankParticles(x, y, alliance);
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

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    for (const system of this.particleSystems) {
      system.draw(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
    }
  }
}
