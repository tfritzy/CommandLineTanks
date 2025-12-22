import { Projectile } from "./Projectile";
import { UNIT_TO_PIXEL } from "../../game";
import { TEAM_COLORS } from "../../constants";

export class BoomerangProjectile extends Projectile {
  private rotation: number = 0;

  public update(deltaTime: number) {
    super.update(deltaTime);
    this.rotation += deltaTime * 15;
  }

  public drawBody(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    const centerX = this.x * UNIT_TO_PIXEL;
    const centerY = this.y * UNIT_TO_PIXEL;
    const radius = this.size * UNIT_TO_PIXEL;
    
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
