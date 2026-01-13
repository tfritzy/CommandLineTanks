import { COLORS } from "../theme/colors";


export class FpsCounter {
  private fps: number = 0;
  private frameCount: number = 0;
  private lastUpdate: number = 0;
  private initialized: boolean = false;
  private pingGetter: (() => number) | null = null;

  public setPingGetter(getter: () => number): void {
    this.pingGetter = getter;
  }

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
      
      if (this.pingGetter) {
        const ping = this.pingGetter();
        const pingY = displayHeight - 30;
        ctx.strokeText(`Ping: ${ping}ms`, x, pingY);
        ctx.fillText(`Ping: ${ping}ms`, x, pingY);
      }
      
      const fpsY = displayHeight - 10;
      ctx.strokeText(`FPS: ${this.fps}`, x, fpsY);
      ctx.fillText(`FPS: ${this.fps}`, x, fpsY);
      ctx.restore();
    }
  }

  public getFps(): number {
    return this.fps;
  }
}
