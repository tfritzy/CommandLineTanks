import { COLORS } from "../../theme/colors";

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

  ctx.fillStyle = hasGun ? COLORS.TERMINAL.SEPARATOR : COLORS.TERMINAL.BACKGROUND;
  ctx.globalAlpha = hasGun ? 0.8 : 0.3;

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

  ctx.strokeStyle = isSelected ? COLORS.TERMINAL.WARNING : COLORS.TERMINAL.SEPARATOR;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 1;
  ctx.stroke();

  ctx.fillStyle = isSelected ? COLORS.TERMINAL.WARNING : COLORS.TERMINAL.TEXT_MUTED;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText((slotIndex + 1).toString(), x + 4, y + 4);

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
  ctx.fillStyle = COLORS.UI.TEXT_PRIMARY;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(ammo.toString(), x + slotSize - 4, y + slotSize - 3);
  ctx.restore();
}
