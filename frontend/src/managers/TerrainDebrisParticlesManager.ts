import { TerrainDebrisParticles } from "../objects/particles/TerrainDebrisParticles";
import { UNIT_TO_PIXEL } from "../constants";
import { COLORS } from "../theme/colors";

const TWO_PI = Math.PI * 2;
const VIEWPORT_PADDING = 100;

export class TerrainDebrisParticlesManager {
  private particleSystems: TerrainDebrisParticles[] = [];

  public spawnParticles(x: number, y: number): void {
    const particles = new TerrainDebrisParticles(x, y);
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

    ctx.save();

    ctx.fillStyle = COLORS.TERMINAL.TEXT_MUTED;
    ctx.beginPath();
    for (const system of this.particleSystems) {
      for (const p of system.getParticles()) {
        if (p.lifetime >= p.maxLifetime) continue;
        if (p.color !== COLORS.TERMINAL.TEXT_MUTED) continue;
        const px = p.x * UNIT_TO_PIXEL;
        const py = p.y * UNIT_TO_PIXEL;
        const pSize = p.size * UNIT_TO_PIXEL;
        if (px + pSize < paddedLeft || px - pSize > paddedRight || 
            py + pSize < paddedTop || py - pSize > paddedBottom) continue;
        ctx.moveTo(px + pSize, py);
        ctx.arc(px, py, pSize, 0, TWO_PI);
      }
    }
    ctx.fill();

    ctx.fillStyle = COLORS.TERMINAL.TEXT_DIM;
    ctx.beginPath();
    for (const system of this.particleSystems) {
      for (const p of system.getParticles()) {
        if (p.lifetime >= p.maxLifetime) continue;
        if (p.color !== COLORS.TERMINAL.TEXT_DIM) continue;
        const px = p.x * UNIT_TO_PIXEL;
        const py = p.y * UNIT_TO_PIXEL;
        const pSize = p.size * UNIT_TO_PIXEL;
        if (px + pSize < paddedLeft || px - pSize > paddedRight || 
            py + pSize < paddedTop || py - pSize > paddedBottom) continue;
        ctx.moveTo(px + pSize, py);
        ctx.arc(px, py, pSize, 0, TWO_PI);
      }
    }
    ctx.fill();

    ctx.fillStyle = COLORS.TERMINAL.SEPARATOR;
    ctx.beginPath();
    for (const system of this.particleSystems) {
      for (const p of system.getParticles()) {
        if (p.lifetime >= p.maxLifetime) continue;
        if (p.color !== COLORS.TERMINAL.SEPARATOR) continue;
        const px = p.x * UNIT_TO_PIXEL;
        const py = p.y * UNIT_TO_PIXEL;
        const pSize = p.size * UNIT_TO_PIXEL;
        if (px + pSize < paddedLeft || px - pSize > paddedRight || 
            py + pSize < paddedTop || py - pSize > paddedBottom) continue;
        ctx.moveTo(px + pSize, py);
        ctx.arc(px, py, pSize, 0, TWO_PI);
      }
    }
    ctx.fill();

    ctx.restore();
  }

  public destroy(): void {
    this.particleSystems.length = 0;
  }
}
