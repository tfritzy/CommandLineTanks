import { Projectile } from "./Projectile";
import { ProjectileTextureSheet } from "../../managers/ProjectileTextureSheet";

export class BoomerangProjectile extends Projectile {
  private rotation: number = 0;

  public update(deltaTime: number) {
    super.update(deltaTime);
    this.rotation += deltaTime * 15;
  }

  public drawShadow(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getShadowScreenPosition();
    const key = this.getTextureKey('boomerang');
    textureSheet.drawShadow(ctx, key, centerX, centerY, this.size * 2, this.rotation);
  }

  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const { x: centerX, y: centerY } = this.getScreenPosition();
    const key = this.getTextureKey('boomerang');
    textureSheet.drawProjectile(ctx, key, centerX, centerY, this.size * 2, this.rotation);
  }
}
