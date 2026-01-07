import { DeadTankParticles } from "../objects/particles/DeadTankParticles";

export class DeadTankParticlesManager {
  private particleSystems: DeadTankParticles[] = [];

  public spawnParticles(x: number, y: number, alliance: number): void {
    const particles = new DeadTankParticles(x, y, alliance);
    this.particleSystems.push(particles);
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

  public destroy(): void {
    this.particleSystems.length = 0;
  }
}
