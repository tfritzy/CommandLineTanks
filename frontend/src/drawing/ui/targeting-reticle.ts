import { UNIT_TO_PIXEL } from "../../constants";

const RETICLE_SIZE = 20;
const RETICLE_GAP = 6;
const RETICLE_CORNER_LENGTH = 8;
const RETICLE_COLOR = "#fceba8";
const RETICLE_LINE_WIDTH = 2;

export function drawTargetingReticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  const pixelX = x * UNIT_TO_PIXEL;
  const pixelY = y * UNIT_TO_PIXEL;

  ctx.save();
  ctx.strokeStyle = RETICLE_COLOR;
  ctx.lineWidth = RETICLE_LINE_WIDTH;

  ctx.beginPath();
  ctx.moveTo(pixelX - RETICLE_SIZE - RETICLE_GAP, pixelY - RETICLE_SIZE - RETICLE_GAP);
  ctx.lineTo(pixelX - RETICLE_SIZE - RETICLE_GAP + RETICLE_CORNER_LENGTH, pixelY - RETICLE_SIZE - RETICLE_GAP);
  ctx.moveTo(pixelX - RETICLE_SIZE - RETICLE_GAP, pixelY - RETICLE_SIZE - RETICLE_GAP);
  ctx.lineTo(pixelX - RETICLE_SIZE - RETICLE_GAP, pixelY - RETICLE_SIZE - RETICLE_GAP + RETICLE_CORNER_LENGTH);

  ctx.moveTo(pixelX + RETICLE_SIZE + RETICLE_GAP, pixelY - RETICLE_SIZE - RETICLE_GAP);
  ctx.lineTo(pixelX + RETICLE_SIZE + RETICLE_GAP - RETICLE_CORNER_LENGTH, pixelY - RETICLE_SIZE - RETICLE_GAP);
  ctx.moveTo(pixelX + RETICLE_SIZE + RETICLE_GAP, pixelY - RETICLE_SIZE - RETICLE_GAP);
  ctx.lineTo(pixelX + RETICLE_SIZE + RETICLE_GAP, pixelY - RETICLE_SIZE - RETICLE_GAP + RETICLE_CORNER_LENGTH);

  ctx.moveTo(pixelX - RETICLE_SIZE - RETICLE_GAP, pixelY + RETICLE_SIZE + RETICLE_GAP);
  ctx.lineTo(pixelX - RETICLE_SIZE - RETICLE_GAP + RETICLE_CORNER_LENGTH, pixelY + RETICLE_SIZE + RETICLE_GAP);
  ctx.moveTo(pixelX - RETICLE_SIZE - RETICLE_GAP, pixelY + RETICLE_SIZE + RETICLE_GAP);
  ctx.lineTo(pixelX - RETICLE_SIZE - RETICLE_GAP, pixelY + RETICLE_SIZE + RETICLE_GAP - RETICLE_CORNER_LENGTH);

  ctx.moveTo(pixelX + RETICLE_SIZE + RETICLE_GAP, pixelY + RETICLE_SIZE + RETICLE_GAP);
  ctx.lineTo(pixelX + RETICLE_SIZE + RETICLE_GAP - RETICLE_CORNER_LENGTH, pixelY + RETICLE_SIZE + RETICLE_GAP);
  ctx.moveTo(pixelX + RETICLE_SIZE + RETICLE_GAP, pixelY + RETICLE_SIZE + RETICLE_GAP);
  ctx.lineTo(pixelX + RETICLE_SIZE + RETICLE_GAP, pixelY + RETICLE_SIZE + RETICLE_GAP - RETICLE_CORNER_LENGTH);
  ctx.stroke();

  ctx.restore();
}
