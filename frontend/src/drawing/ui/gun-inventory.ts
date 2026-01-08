import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_SMALL, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";

export function drawGunSlot(
  ctx: CanvasRenderingContext2D,
  slotIndex: number,
  x: number,
  y: number,
  slotSize: number,
  hasGun: boolean,
  isSelected: boolean
) {
  ctx.save();

  ctx.fillStyle = "#000000";

  const radius = 4;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + slotSize - radius, y);
  ctx.quadraticCurveTo(x + slotSize, y, x + slotSize, y + radius);
  ctx.lineTo(x + slotSize, y + slotSize - radius);
  ctx.quadraticCurveTo(
    x + slotSize,
    y + slotSize,
    x + slotSize - radius,
    y + slotSize
  );
  ctx.lineTo(x + radius, y + slotSize);
  ctx.quadraticCurveTo(x, y + slotSize, x, y + slotSize - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();

  const slotColor = isSelected ? COLORS.TERMINAL.WARNING : (hasGun ? COLORS.TERMINAL.INFO : COLORS.TERMINAL.SEPARATOR);
  setGlow(ctx, slotColor, isSelected ? NEON_GLOW_BLUR_MEDIUM : NEON_GLOW_BLUR_SMALL);
  ctx.strokeStyle = slotColor;
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.stroke();

  ctx.fillStyle = slotColor;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText((slotIndex + 1).toString(), x + 4, y + 4);
  clearGlow(ctx);

  ctx.restore();
}

export function drawGunAmmo(
  ctx: CanvasRenderingContext2D,
  ammo: number,
  x: number,
  y: number,
  slotSize: number
) {
  ctx.save();
  setGlow(ctx, COLORS.UI.TEXT_PRIMARY, NEON_GLOW_BLUR_SMALL);
  ctx.fillStyle = COLORS.UI.TEXT_PRIMARY;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(ammo.toString(), x + slotSize - 4, y + slotSize - 3);
  clearGlow(ctx);
  ctx.restore();
}
