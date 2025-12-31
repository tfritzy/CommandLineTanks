export class FpsCounter {
  private fps: number = 0;
  private frameCount: number = 0;
  private lastUpdate: number = 0;

  public update(currentTime: number): void {
    this.frameCount++;
    
    if (this.lastUpdate === 0) {
      this.lastUpdate = currentTime;
      return;
    }
    
    if (currentTime - this.lastUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastUpdate));
      this.frameCount = 0;
      this.lastUpdate = currentTime;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.fps > 0) {
      ctx.save();
      ctx.font = "14px monospace";
      ctx.fillStyle = "#fcfbf3";
      ctx.strokeStyle = "#2e2e43";
      ctx.lineWidth = 3;
      ctx.strokeText(`FPS: ${this.fps}`, 10, 20);
      ctx.fillText(`FPS: ${this.fps}`, 10, 20);
      ctx.restore();
    }
  }

  public getFps(): number {
    return this.fps;
  }
}
