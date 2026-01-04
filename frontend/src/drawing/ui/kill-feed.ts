import { UI_COLORS } from "../../constants";
import { TERMINAL_COLORS } from "../../components/terminal/colors";

export function drawKillNotification(
  ctx: CanvasRenderingContext2D,
  killeeName: string,
  displayTime: number,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const fadeInTime = 0.3;
  const fadeOutTime = 2.5;
  
  let alpha = 1.0;
  if (displayTime < fadeInTime) {
    alpha = displayTime / fadeInTime;
  } else if (displayTime > fadeOutTime) {
    alpha = Math.max(0, 1.0 - (displayTime - fadeOutTime) / (3.0 - fadeOutTime));
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  const scale = displayTime < fadeInTime 
    ? 0.95 + (0.05 * (displayTime / fadeInTime))
    : 1.0;

  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = TERMINAL_COLORS.BACKGROUND + 'aa';
  
  const radius = 4;
  ctx.beginPath();
  ctx.moveTo(-width / 2 + radius, -height / 2);
  ctx.arcTo(width / 2, -height / 2, width / 2, height / 2, radius);
  ctx.arcTo(width / 2, height / 2, -width / 2, height / 2, radius);
  ctx.arcTo(-width / 2, height / 2, -width / 2, -height / 2, radius);
  ctx.arcTo(-width / 2, -height / 2, width / 2, -height / 2, radius);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.font = '700 16px Poppins, sans-serif';
  
  const label = "ELIMINATED ";
  const name = killeeName.toUpperCase();
  
  const labelWidth = ctx.measureText(label).width;
  const nameWidth = ctx.measureText(name).width;
  const totalWidth = labelWidth + nameWidth;
  
  const startX = -totalWidth / 2;
  
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = TERMINAL_COLORS.ERROR;
  ctx.fillText(label, startX, 1);
  
  ctx.fillStyle = UI_COLORS.TEXT_BRIGHT;
  ctx.fillText(name, startX + labelWidth, 1);

  ctx.restore();
}
