import { MuzzleFlashParticles } from "../objects/particles/MuzzleFlashParticles";

export class MuzzleFlashParticlesManager {
  private particleSystems: MuzzleFlashParticles[] = [];

  public spawnMuzzleFlash(x: number, y: number, angle: number, alliance: number): void {
    const particles = new MuzzleFlashParticles(x, y, angle, alliance);
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
