import { MuzzleFlashParticles } from "../objects/particles/MuzzleFlashParticles";
import { UNIT_TO_PIXEL } from "../constants";
import { COLORS } from "../theme/colors";

const TWO_PI = Math.PI * 2;
const VIEWPORT_PADDING = 100;

export class MuzzleFlashParticlesManager {
  private particleSystems: MuzzleFlashParticles[] = [];

  public spawnMuzzleFlash(x: number, y: number, angle: number, alliance: number): void {
    const particles = new MuzzleFlashParticles(x, y, angle, alliance);
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

    ctx.fillStyle = COLORS.GAME.TEAM_RED_BRIGHT;
    ctx.beginPath();
    for (const system of this.particleSystems) {
      const particles = system.getParticles();
      const color = system.getColor();
      if (color !== COLORS.GAME.TEAM_RED_BRIGHT) continue;

      for (const p of particles) {
        if (p.lifetime >= p.maxLifetime) continue;
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

    ctx.fillStyle = COLORS.GAME.TEAM_BLUE_BRIGHT;
    ctx.beginPath();
    for (const system of this.particleSystems) {
      const particles = system.getParticles();
      const color = system.getColor();
      if (color !== COLORS.GAME.TEAM_BLUE_BRIGHT) continue;

      for (const p of particles) {
        if (p.lifetime >= p.maxLifetime) continue;
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
