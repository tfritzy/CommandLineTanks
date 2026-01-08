import { COLORS } from "../theme/colors";


export class FpsCounter {
  private fps: number = 0;
  private frameCount: number = 0;
  private lastUpdate: number = 0;
  private initialized: boolean = false;

  public update(currentTime: number): void {
    if (!this.initialized) {
      this.lastUpdate = currentTime;
      this.initialized = true;
      return;
    }

    this.frameCount++;
    if (currentTime - this.lastUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastUpdate));
      this.frameCount = 0;
      this.lastUpdate = currentTime;
    }
  }

  public draw(ctx: CanvasRenderingContext2D, displayHeight: number): void {
    if (this.fps > 0) {
      ctx.save();
      ctx.font = "14px monospace";
      ctx.fillStyle = COLORS.UI.TEXT_PRIMARY;
      ctx.strokeStyle = COLORS.TERRAIN.GROUND;
      ctx.lineWidth = 3;
      const x = 10;
      const y = displayHeight - 10;
      ctx.strokeText(`FPS: ${this.fps}`, x, y);
      ctx.fillText(`FPS: ${this.fps}`, x, y);
      ctx.restore();
    }
  }

  public getFps(): number {
    return this.fps;
  }
}
