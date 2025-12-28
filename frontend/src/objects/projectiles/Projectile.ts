import { UNIT_TO_PIXEL, INTERPOLATION_DELAY, BUFFER_DURATION } from "../../constants";

export abstract class Projectile {
  public static readonly SHADOW_OFFSET = 4;
  protected x: number;
  protected y: number;
  protected velocityX: number;
  protected velocityY: number;
  protected size: number;
  protected alliance: number;
  protected explosionRadius: number | undefined;
  protected trackingStrength: number;
  protected trackingRadius: number;
  private positionBuffer: Array<{ x: number; y: number; serverTimestampMs: number }> =
    [];

  constructor(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    size: number,
    alliance: number,
    explosionRadius?: number,
    trackingStrength?: number,
    trackingRadius?: number
  ) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.size = size;
    this.alliance = alliance;
    this.explosionRadius = explosionRadius;
    this.trackingStrength = trackingStrength || 0;
    this.trackingRadius = trackingRadius || 0;
  }

  public draw(ctx: CanvasRenderingContext2D, textureSheet: any) {
    this.drawShadow(ctx, textureSheet);
    this.drawBody(ctx, textureSheet);
  }

  public drawShadow(_ctx: CanvasRenderingContext2D, _textureSheet: any) {}

  public abstract drawBody(
    ctx: CanvasRenderingContext2D,
    textureSheet: any
  ): void;

  public setPosition(x: number, y: number, serverTimestampMicros: bigint) {
    const serverTimestampMs = Number(serverTimestampMicros / 1000n);

    this.positionBuffer.push({
      x,
      y,
      serverTimestampMs,
    });

    const cutoffTime = serverTimestampMs - BUFFER_DURATION;
    this.positionBuffer = this.positionBuffer.filter(
      (p) => p.serverTimestampMs > cutoffTime
    );
  }

  public setVelocity(velocityX: number, velocityY: number) {
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  public update(_deltaTime: number, _tankManager?: { getAllTanks(): IterableIterator<{ getPosition(): { x: number; y: number }; getAlliance(): number; getHealth(): number }> }) {
    if (this.positionBuffer.length === 0) return;

    if (this.positionBuffer.length === 1) {
      this.x = this.positionBuffer[0].x;
      this.y = this.positionBuffer[0].y;
      return;
    }

    const latestServerTime = this.positionBuffer[this.positionBuffer.length - 1].serverTimestampMs;
    const renderTime = latestServerTime - INTERPOLATION_DELAY;

    let prev = this.positionBuffer[0];
    let next = this.positionBuffer[1];

    for (let i = 0; i < this.positionBuffer.length - 1; i++) {
      if (this.positionBuffer[i + 1].serverTimestampMs > renderTime) {
        prev = this.positionBuffer[i];
        next = this.positionBuffer[i + 1];
        break;
      }
    }

    if (
      renderTime >=
      this.positionBuffer[this.positionBuffer.length - 1].serverTimestampMs
    ) {
      const last = this.positionBuffer[this.positionBuffer.length - 1];
      this.x = last.x;
      this.y = last.y;
      return;
    }

    const total = next.serverTimestampMs - prev.serverTimestampMs;
    const elapsed = renderTime - prev.serverTimestampMs;
    const t = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 1;

    this.x = prev.x + (next.x - prev.x) * t;
    this.y = prev.y + (next.y - prev.y) * t;
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getAlliance(): number {
    return this.alliance;
  }

  public getSize(): number {
    return this.size;
  }

  public getExplosionRadius(): number | undefined {
    return this.explosionRadius;
  }

  protected getScreenPosition(): { x: number; y: number } {
    return {
      x: this.x * UNIT_TO_PIXEL,
      y: this.y * UNIT_TO_PIXEL,
    };
  }

  protected getShadowScreenPosition(): { x: number; y: number } {
    return {
      x: this.x * UNIT_TO_PIXEL - Projectile.SHADOW_OFFSET,
      y: this.y * UNIT_TO_PIXEL + Projectile.SHADOW_OFFSET,
    };
  }

  protected getTextureKey(prefix: string): string {
    return `${prefix}-${this.alliance === 0 ? "red" : "blue"}`;
  }

  public isExplosive(): boolean {
    return false;
  }

  public spawnDeathParticles(_particlesManager: any): void {
    // Default implementation - override in subclasses for custom behavior
  }
}
