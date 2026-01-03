import { TERRAIN_DETAIL_COLORS } from "../../constants";
import { TERMINAL_COLORS } from "../../components/terminal/colors";

const OVERDRIVE_ICON_READY_COLOR = TERRAIN_DETAIL_COLORS.HAY_BALE.BODY;
const OVERDRIVE_ICON_COOLDOWN_COLOR = TERMINAL_COLORS.TEXT_DIM;
const BOLT_WIDTH_SCALE = 0.35;
const BOLT_HEIGHT_SCALE = 0.5;

export function drawOverdriveIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  isReady: boolean
) {
  ctx.save();
  ctx.translate(x, y);

  const color = isReady ? OVERDRIVE_ICON_READY_COLOR : OVERDRIVE_ICON_COOLDOWN_COLOR;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;

  const boltWidth = size * BOLT_WIDTH_SCALE;
  const boltHeight = size * BOLT_HEIGHT_SCALE;
  
  ctx.beginPath();
  ctx.moveTo(-boltWidth * 0.2, -boltHeight * 0.5);
  ctx.lineTo(boltWidth * 0.3, -boltHeight * 0.15);
  ctx.lineTo(boltWidth * 0.1, 0);
  ctx.lineTo(boltWidth * 0.5, boltHeight * 0.5);
  ctx.lineTo(-boltWidth * 0.1, boltHeight * 0.15);
  ctx.lineTo(boltWidth * 0.05, 0);
  ctx.lineTo(-boltWidth * 0.5, -boltHeight * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
