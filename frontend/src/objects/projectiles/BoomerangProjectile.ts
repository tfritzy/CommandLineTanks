import { Projectile } from "./Projectile";
import type { ProjectileTextureCache } from "../../textures/ProjectileTextureCache";

export class BoomerangProjectile extends Projectile {
  private rotation: number = 0;

  public update(deltaTime: number) {
    super.update(deltaTime);
    this.rotation += deltaTime * 15;
  }

  public drawShadow(ctx: CanvasRenderingContext2D, textureCache: ProjectileTextureCache) {
    const { x: centerX, y: centerY } = this.getShadowScreenPosition();
    const key = this.getTextureKey('boomerang');
    textureCache.drawShadow(ctx, key, centerX, centerY, this.size, this.rotation);
  }

  public drawBody(ctx: CanvasRenderingContext2D, textureCache: ProjectileTextureCache) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    const key = this.getTextureKey('boomerang');
    textureCache.drawProjectile(ctx, key, centerX, centerY, this.size, this.rotation);
  }
}
