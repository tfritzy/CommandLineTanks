import { MuzzleFlashParticles } from "../objects/particles/MuzzleFlashParticles";

export class MuzzleFlashParticlesManager {
  private particleSystems: MuzzleFlashParticles[] = [];

  public spawnMuzzleFlash(x: number, y: number, angle: number, alliance: number): void {
    const particles = new MuzzleFlashParticles(x, y, angle, alliance);
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
