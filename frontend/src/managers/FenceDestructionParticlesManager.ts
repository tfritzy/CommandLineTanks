import { FenceDestructionParticles } from "../objects/particles/FenceDestructionParticles";

export class FenceDestructionParticlesManager {
  private particleSystems: FenceDestructionParticles[] = [];

  public spawnParticles(x: number, y: number): void {
    const particles = new FenceDestructionParticles(x, y);
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
