import { PROJECTILE_COLORS } from "../../constants";

export function drawGrenadeShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const pinWidth = radius * 0.3;
  const pinHeight = radius * 0.4;
  const pinY = centerY - radius * 1.1;
  const ringRadius = radius * 0.25;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius, radius * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(
    centerX - pinWidth / 2,
    pinY - pinHeight,
    pinWidth,
    pinHeight
  );

  ctx.beginPath();
  ctx.arc(
    centerX + pinWidth / 2,
    pinY - pinHeight / 2,
    ringRadius,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

export function drawGrenadeBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
  shadowColor: string,
  highlightColor: string
) {
  ctx.save();
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius, radius * 1.1, 0, 0, Math.PI * 2);
  ctx.clip();
  
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.2, centerY + radius * 0.2, radius * 1.2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = highlightColor;
  ctx.beginPath();
  ctx.arc(centerX + radius * 0.2, centerY - radius * 0.2, radius * 1.2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  
  ctx.save();
  ctx.strokeStyle = PROJECTILE_COLORS.OUTLINE_DARK;
  ctx.lineWidth = Math.max(1, radius * 0.15);
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius, radius * 1.1, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX - radius, centerY);
  ctx.lineTo(centerX + radius, centerY);
  ctx.stroke();
  
  const pinWidth = radius * 0.3;
  const pinHeight = radius * 0.4;
  const pinY = centerY - radius * 1.1;
  
  ctx.fillStyle = PROJECTILE_COLORS.OUTLINE_DARK;
  ctx.fillRect(centerX - pinWidth / 2, pinY - pinHeight, pinWidth, pinHeight);
  
  ctx.fillStyle = PROJECTILE_COLORS.METAL_GRAY;
  const ringRadius = radius * 0.25;
  ctx.beginPath();
  ctx.arc(centerX + pinWidth / 2, pinY - pinHeight / 2, ringRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = PROJECTILE_COLORS.OUTLINE_DARK;
  ctx.lineWidth = Math.max(0.5, radius * 0.1);
  ctx.beginPath();
  ctx.arc(centerX + pinWidth / 2, pinY - pinHeight / 2, ringRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}
