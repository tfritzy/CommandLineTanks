import { Projectile } from "./Projectile";
import { UNIT_TO_PIXEL } from "../../game";
import { TEAM_COLORS } from "../../constants";
import { ProjectileTextureSheet } from "../../managers/ProjectileTextureSheet";

export class BoomerangProjectile extends Projectile {
  private rotation: number = 0;

  public update(deltaTime: number) {
    super.update(deltaTime);
    this.rotation += deltaTime * 15;
  }

  public drawBody(ctx: CanvasRenderingContext2D, textureSheet?: ProjectileTextureSheet) {
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;

    if (textureSheet) {
      const key = this.alliance === 0 ? 'boomerang-red' : 'boomerang-blue';
      textureSheet.drawProjectile(ctx, key, centerX, centerY, 1.0, this.rotation);
    } else {
      const radius = this.size * UNIT_TO_PIXEL;

      ctx.save();
      
      ctx.translate(centerX, centerY);
      ctx.rotate(this.rotation);
      
      ctx.fillStyle = this.alliance === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;
      ctx.strokeStyle = "#2e2e43";
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.moveTo(0, -radius * 2);
      ctx.lineTo(radius * 0.5, 0);
      ctx.lineTo(0, radius * 2);
      ctx.lineTo(-radius * 1.5, 0);
      ctx.closePath();
      
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    }
  }
}
