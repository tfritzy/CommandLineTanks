import { TreeDestructionParticles } from "../objects/particles/TreeDestructionParticles";
import { UNIT_TO_PIXEL } from "../constants";
import { drawTreeDestructionParticle } from "../drawing/particles/tree-destruction";

const VIEWPORT_PADDING = 100;

export class TreeDestructionParticlesManager {
  private particleSystems: TreeDestructionParticles[] = [];

  public spawnParticles(x: number, y: number): void {
    const particles = new TreeDestructionParticles(x, y);
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
    if (this.particleSystems.length === 0) return;

    const paddedLeft = cameraX - VIEWPORT_PADDING;
    const paddedRight = cameraX + viewportWidth + VIEWPORT_PADDING;
    const paddedTop = cameraY - VIEWPORT_PADDING;
    const paddedBottom = cameraY + viewportHeight + VIEWPORT_PADDING;

    for (const system of this.particleSystems) {
      for (const p of system.getParticles()) {
        if (p.lifetime >= p.maxLifetime) continue;
        const px = p.x * UNIT_TO_PIXEL;
        const py = p.y * UNIT_TO_PIXEL;
        const pSize = p.size * UNIT_TO_PIXEL;
        
        // Culling
        if (px + pSize < paddedLeft || px - pSize > paddedRight || 
            py + pSize < paddedTop || py - pSize > paddedBottom) continue;

        drawTreeDestructionParticle(ctx, p);
      }
    }
  }

  public destroy(): void {
    this.particleSystems.length = 0;
  }
}
