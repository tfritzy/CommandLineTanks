import { TerrainDebrisParticles } from "../objects/particles/TerrainDebrisParticles";
import { DrawableManager } from "./DrawableManager";
import { UNIT_TO_PIXEL } from "../game";
import { isPointInViewport } from "../utils/viewport";

export class TerrainDebrisParticlesManager extends DrawableManager<TerrainDebrisParticles> {
  public spawnParticles(x: number, y: number): void {
    const particles = new TerrainDebrisParticles(x, y);
    this.add(particles);
  }

  public override draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    for (const system of this.items) {
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
