import { TERMINAL_COLORS } from "../../components/terminal/colors";

const SMOKESCREEN_ICON_READY_COLOR = TERMINAL_COLORS.TANK_CODE;
const SMOKESCREEN_ICON_COOLDOWN_COLOR = TERMINAL_COLORS.TEXT_DIM;
const CLOUD_RADIUS_SCALE = 0.35;
const CLOUD_OFFSET_SCALE = 0.4;
const OUTER_CLOUD_SCALE = 0.6;
const CENTER_CLOUD_SCALE = 0.7;

export function drawSmokescreenIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  isReady: boolean
) {
  ctx.save();
  ctx.translate(x, y);

  const cloudRadius = size * CLOUD_RADIUS_SCALE;
  const cloudColor = isReady ? SMOKESCREEN_ICON_READY_COLOR : SMOKESCREEN_ICON_COOLDOWN_COLOR;
  const cloudCount = 5;
  
  ctx.fillStyle = cloudColor;
  ctx.globalAlpha = 0.8;

  for (let i = 0; i < cloudCount; i++) {
    const angle = (i / cloudCount) * Math.PI * 2;
    const offsetX = Math.cos(angle) * cloudRadius * CLOUD_OFFSET_SCALE;
    const offsetY = Math.sin(angle) * cloudRadius * CLOUD_OFFSET_SCALE;
    
    ctx.beginPath();
    ctx.arc(offsetX, offsetY, cloudRadius * OUTER_CLOUD_SCALE, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0, 0, cloudRadius * CENTER_CLOUD_SCALE, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
