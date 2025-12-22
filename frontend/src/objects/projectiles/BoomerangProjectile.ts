import { Projectile } from "./Projectile";
import { UNIT_TO_PIXEL } from "../../game";
import { ProjectileTextureSheet } from "../../managers/ProjectileTextureSheet";

export class BoomerangProjectile extends Projectile {
  private rotation: number = 0;

  public update(deltaTime: number) {
    super.update(deltaTime);
    this.rotation += deltaTime * 15;
  }

  public drawBody(ctx: CanvasRenderingContext2D, textureSheet: ProjectileTextureSheet) {
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;
    const key = this.alliance === 0 ? 'boomerang-red' : 'boomerang-blue';
    textureSheet.drawProjectile(ctx, key, centerX, centerY, 1.0, this.rotation);
  }
}
