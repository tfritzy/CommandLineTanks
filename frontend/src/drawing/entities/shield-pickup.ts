import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";

export function drawShieldPickupShadow(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;
  const shadowColor = getNeonShadowColor(COLORS.TERMINAL.INFO);

  ctx.save();
  ctx.translate(worldX - 4, worldY + 4);
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawShieldPickupBody(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;
  const fillColor = getNeonFillColor(COLORS.TERMINAL.INFO);

  ctx.save();
  ctx.translate(worldX, worldY);

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();

  setGlow(ctx, COLORS.TERMINAL.INFO, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = COLORS.TERMINAL.INFO;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.stroke();

  const shieldSize = size * 0.5;
  const shieldTop = -shieldSize * 0.5;
  const shieldBottom = shieldSize * 0.5;
  const shieldLeft = -shieldSize * 0.4;
  const shieldRight = shieldSize * 0.4;

  ctx.strokeStyle = COLORS.TERMINAL.INFO;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, shieldTop);
  ctx.lineTo(shieldRight, shieldTop + shieldSize * 0.2);
  ctx.lineTo(shieldRight, shieldBottom - shieldSize * 0.15);
  ctx.lineTo(0, shieldBottom);
  ctx.lineTo(shieldLeft, shieldBottom - shieldSize * 0.15);
  ctx.lineTo(shieldLeft, shieldTop + shieldSize * 0.2);
  ctx.closePath();
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();
}
