import { DeadTankParticles } from "../objects/particles/DeadTankParticles";

export class DeadTankParticlesManager {
  private particleSystems: DeadTankParticles[] = [];

  public spawnParticles(x: number, y: number, alliance: number): void {
    const particles = new DeadTankParticles(x, y, alliance);
    this.particleSystems.push(particles);
  }

  public update(deltaTime: number): void {
    for (let i = this.particleSystems.length - 1; i >= 0; i--) {
      this.particleSystems[i].update(deltaTime);
      if (this.particleSystems[i].getIsDead()) {
        this.particleSystems.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    for (const system of this.particleSystems) {
      system.draw(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
    }
  }
}
