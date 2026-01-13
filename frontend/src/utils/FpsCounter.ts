import { COLORS } from "../theme/colors";
import { getPing } from "../spacetimedb-connection";


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
      
      const ping = getPing();
      const pingY = displayHeight - 30;
      
      let pingColor = COLORS.UI.TEXT_PRIMARY;
      if (ping < 50) {
        pingColor = "#96dc7f";
      } else if (ping < 100) {
        pingColor = "#f5c47c";
      } else {
        pingColor = "#e39764";
      }
      
      ctx.beginPath();
      ctx.arc(x + 3, pingY - 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = pingColor;
      ctx.fill();
      
      ctx.fillStyle = COLORS.UI.TEXT_PRIMARY;
      ctx.strokeText(`Ping: ${ping}ms`, x + 12, pingY);
      ctx.fillText(`Ping: ${ping}ms`, x + 12, pingY);
      
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
