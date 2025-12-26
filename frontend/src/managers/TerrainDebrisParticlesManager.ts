import { TerrainDebrisParticles } from "../objects/particles/TerrainDebrisParticles";
import { UNIT_TO_PIXEL } from "../constants";
import { isPointInViewport } from "../utils/viewport";

export class TerrainDebrisParticlesManager {
  private particleSystems: TerrainDebrisParticles[] = [];

  public spawnParticles(x: number, y: number): void {
    const particles = new TerrainDebrisParticles(x, y);
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
      const pos = system.getPosition();
      const px = pos.x * UNIT_TO_PIXEL;
      const py = pos.y * UNIT_TO_PIXEL;
      const maxParticleSpread = 5 * UNIT_TO_PIXEL;
      
      if (!isPointInViewport(px, py, maxParticleSpread, cameraX, cameraY, viewportWidth, viewportHeight)) {
        continue;
      }
      
      system.draw(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
    }
  }
}
