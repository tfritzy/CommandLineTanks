import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";

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

  ctx.fillStyle = "#000000aa";
  
  const radius = 4;
  ctx.beginPath();
  ctx.moveTo(-width / 2 + radius, -height / 2);
  ctx.arcTo(width / 2, -height / 2, width / 2, height / 2, radius);
  ctx.arcTo(width / 2, height / 2, -width / 2, height / 2, radius);
  ctx.arcTo(-width / 2, height / 2, -width / 2, -height / 2, radius);
  ctx.arcTo(-width / 2, -height / 2, width / 2, -height / 2, radius);
  ctx.closePath();
  ctx.fill();

  setGlow(ctx, COLORS.TERMINAL.ERROR, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = COLORS.TERMINAL.ERROR;
  ctx.lineWidth = 1;
  ctx.stroke();
  clearGlow(ctx);

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
  setGlow(ctx, COLORS.TERMINAL.ERROR, NEON_GLOW_BLUR_MEDIUM);
  ctx.fillStyle = COLORS.TERMINAL.ERROR;
  ctx.fillText(label, startX, 1);
  clearGlow(ctx);
  
  setGlow(ctx, COLORS.UI.TEXT_PRIMARY, NEON_GLOW_BLUR_MEDIUM);
  ctx.fillStyle = COLORS.UI.TEXT_PRIMARY;
  ctx.fillText(name, startX + labelWidth, 1);
  clearGlow(ctx);

  ctx.restore();
}
