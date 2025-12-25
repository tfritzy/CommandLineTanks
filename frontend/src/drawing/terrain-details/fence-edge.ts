import { UNIT_TO_PIXEL } from "../../game";
import { getFlashColor } from "../../utils/colors";

export function drawFenceEdgeShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  rotation: number
) {
  ctx.save();

  const shadowOffset = UNIT_TO_PIXEL * 0.06;
  const angle = (rotation * 90 * Math.PI) / 180;
  const lsX = shadowOffset * (Math.sin(angle) - Math.cos(angle));
  const lsY = shadowOffset * (Math.sin(angle) + Math.cos(angle));

  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.translate(-centerX, -centerY);

  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";

  ctx.beginPath();
  ctx.roundRect(x - UNIT_TO_PIXEL * 0.5 + lsX, y - UNIT_TO_PIXEL * 0.03 + lsY, UNIT_TO_PIXEL, UNIT_TO_PIXEL * 0.06, 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  for (let i = 0; i < 2; i++) {
    const localX = 0.25 + i * 0.5 - 0.5;
    const worldX = centerX + UNIT_TO_PIXEL * (localX * Math.cos(angle));
    const worldY = centerY + UNIT_TO_PIXEL * (localX * Math.sin(angle));

    ctx.beginPath();
    ctx.arc(worldX - shadowOffset, worldY + shadowOffset, UNIT_TO_PIXEL * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawFenceEdgeBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  rotation: number,
  flashTimer: number
) {
  ctx.save();

  ctx.translate(centerX, centerY);
  ctx.rotate((rotation * 90 * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  const railColor = getFlashColor("#e39764", flashTimer);
  const postColor = getFlashColor("#c06852", flashTimer);

  ctx.fillStyle = railColor;
  ctx.fillRect(x - UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.03, UNIT_TO_PIXEL, UNIT_TO_PIXEL * 0.06);

  ctx.fillStyle = postColor;
  for (let i = 0; i < 2; i++) {
    const px = x - UNIT_TO_PIXEL * 0.5 + UNIT_TO_PIXEL * (0.25 + i * 0.5);
    ctx.beginPath();
    ctx.arc(px, y, UNIT_TO_PIXEL * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
