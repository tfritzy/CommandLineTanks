import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS, PALETTE } from "../../theme/colors";

export function drawShieldPickupShadow(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;

  ctx.save();
  ctx.translate(worldX - 4, worldY + 4);
  ctx.fillStyle = PALETTE.BLACK_PURE + "4d";
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

  ctx.save();
  ctx.translate(worldX, worldY);

  ctx.fillStyle = COLORS.TERMINAL.INFO;
  ctx.strokeStyle = COLORS.TERMINAL.BORDER;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const shieldSize = size * 0.5;
  const shieldTop = -shieldSize * 0.5;
  const shieldBottom = shieldSize * 0.5;
  const shieldLeft = -shieldSize * 0.4;
  const shieldRight = shieldSize * 0.4;

  ctx.fillStyle = COLORS.UI.TEXT_PRIMARY;
  ctx.strokeStyle = COLORS.GAME.SHIELD_STROKE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, shieldTop);
  ctx.lineTo(shieldRight, shieldTop + shieldSize * 0.2);
  ctx.lineTo(shieldRight, shieldBottom - shieldSize * 0.15);
  ctx.lineTo(0, shieldBottom);
  ctx.lineTo(shieldLeft, shieldBottom - shieldSize * 0.15);
  ctx.lineTo(shieldLeft, shieldTop + shieldSize * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
