import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor, lerpColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, NEON_GLOW_BLUR_LARGE } from "../../utils/neon";

const NEON_YELLOW = "#ffff00";

const HEALTH_BAR_WIDTH = 32;
const HEALTH_BAR_HEIGHT = 4;
const HEALTH_BAR_Y_OFFSET = 24;
const HEALTH_BAR_PADDING = 1;
const HEALTH_BAR_BORDER_RADIUS = 2;
const IMMUNITY_FLASH_RATE_SECONDS = 0.2;
const IMMUNITY_MIN_OPACITY = 0.5;

interface TankDrawParams {
  x: number;
  y: number;
  turretRotation: number;
  alliance: number;
  flashTimer: number;
  name: string;
  health: number;
  hasShield: boolean;
  isImmune: boolean;
}

export function drawTankShadow(_ctx: CanvasRenderingContext2D, _x: number, _y: number) {
}

export function drawTankBody(ctx: CanvasRenderingContext2D, params: TankDrawParams) {
  ctx.save();
  ctx.translate(params.x * UNIT_TO_PIXEL, params.y * UNIT_TO_PIXEL);

  const allianceColor = params.alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT : COLORS.GAME.TEAM_BLUE_BRIGHT;
  
  let bodyColor: string = allianceColor;
  
  if (params.flashTimer > 0) {
    bodyColor = getFlashColor(allianceColor, params.flashTimer);
  }
  
  if (params.isImmune) {
    const flashCycle = Date.now() / 1000 / IMMUNITY_FLASH_RATE_SECONDS;
    const lerpAmount = Math.abs(Math.sin(flashCycle * Math.PI)) * (1 - IMMUNITY_MIN_OPACITY) + IMMUNITY_MIN_OPACITY;
    const groundColor = COLORS.TERRAIN.GROUND;
    bodyColor = lerpColor(groundColor, bodyColor, lerpAmount);
  }

  setGlow(ctx, bodyColor, NEON_GLOW_BLUR_LARGE);

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(-16, -16, 32, 32, 5);
  ctx.fill();

  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  ctx.rotate(params.turretRotation);

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(0, -5, 24, 10, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(-12, -12, 24, 24, 10);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  clearGlow(ctx);
  ctx.restore();

  if (params.hasShield) {
    ctx.save();
    ctx.translate(params.x * UNIT_TO_PIXEL, params.y * UNIT_TO_PIXEL);

    const shieldSize = 40;
    const shieldHalfSize = shieldSize / 2;

    setGlow(ctx, COLORS.TERMINAL.INFO, NEON_GLOW_BLUR_MEDIUM);
    ctx.strokeStyle = COLORS.TERMINAL.INFO;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-shieldHalfSize, -shieldHalfSize, shieldSize, shieldSize, 5);
    ctx.stroke();
    clearGlow(ctx);

    ctx.restore();
  }
}

export function drawTankNameLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  targetCode: string,
  name: string
) {
  ctx.save();
  ctx.translate(x * UNIT_TO_PIXEL, y * UNIT_TO_PIXEL);

  if (targetCode) {
    setGlow(ctx, COLORS.TERMINAL.WARNING, NEON_GLOW_BLUR_MEDIUM);
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = COLORS.TERMINAL.WARNING;
    ctx.textAlign = "center";
    ctx.fillText(targetCode, 0, -34);
    clearGlow(ctx);

    setGlow(ctx, COLORS.TERMINAL.TEXT_MUTED, NEON_GLOW_BLUR_MEDIUM);
    ctx.font = "12px monospace";
    ctx.fillStyle = COLORS.TERMINAL.TEXT_MUTED;
    ctx.fillText(name, 0, -20);
    clearGlow(ctx);
  } else {
    setGlow(ctx, COLORS.TERMINAL.TEXT_MUTED, NEON_GLOW_BLUR_MEDIUM);
    ctx.font = "12px monospace";
    ctx.fillStyle = COLORS.TERMINAL.TEXT_MUTED;
    ctx.textAlign = "center";
    ctx.fillText(name, 0, -27);
    clearGlow(ctx);
  }

  ctx.restore();
}

export function drawTankTextLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string
) {
  ctx.save();
  ctx.translate(x * UNIT_TO_PIXEL, y * UNIT_TO_PIXEL);
  setGlow(ctx, NEON_YELLOW, NEON_GLOW_BLUR_MEDIUM);
  ctx.font = "14px monospace";
  ctx.fillStyle = NEON_YELLOW;
  ctx.textAlign = "center";
  ctx.fillText(text, 0, -26);
  clearGlow(ctx);
  ctx.restore();
}

export function drawTankHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  health: number,
  maxHealth: number,
  allianceColor: string
) {
  if (health <= 0 || health >= maxHealth) return;

  ctx.save();
  ctx.translate(x * UNIT_TO_PIXEL, y * UNIT_TO_PIXEL);

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.roundRect(-HEALTH_BAR_WIDTH / 2, HEALTH_BAR_Y_OFFSET, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, HEALTH_BAR_BORDER_RADIUS);
  ctx.fill();

  const healthPercent = health / maxHealth;
  const innerWidth = HEALTH_BAR_WIDTH - HEALTH_BAR_PADDING * 2;
  const healthBarWidth = innerWidth * healthPercent;

  setGlow(ctx, allianceColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.fillStyle = allianceColor;
  ctx.beginPath();
  ctx.roundRect(
    -HEALTH_BAR_WIDTH / 2 + HEALTH_BAR_PADDING,
    HEALTH_BAR_Y_OFFSET + HEALTH_BAR_PADDING,
    healthBarWidth,
    HEALTH_BAR_HEIGHT - HEALTH_BAR_PADDING * 2,
    HEALTH_BAR_BORDER_RADIUS
  );
  ctx.fill();
  clearGlow(ctx);

  ctx.restore();
}

export function drawTankPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  path: Array<{ position: { x: number; y: number }; throttlePercent: number }>,
  lineColor: string,
  dotColor: string
) {
  if (path.length === 0) return;

  const dotRadius = 5;

  ctx.save();

  setGlow(ctx, lineColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();

  const startX = x * UNIT_TO_PIXEL;
  const startY = y * UNIT_TO_PIXEL;
  ctx.moveTo(startX, startY);

  for (const pathEntry of path) {
    const worldX = pathEntry.position.x * UNIT_TO_PIXEL;
    const worldY = pathEntry.position.y * UNIT_TO_PIXEL;
    ctx.lineTo(worldX, worldY);
  }

  ctx.stroke();

  const lastEntry = path[path.length - 1];
  const endX = lastEntry.position.x * UNIT_TO_PIXEL;
  const endY = lastEntry.position.y * UNIT_TO_PIXEL;

  setGlow(ctx, dotColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(endX, endY, dotRadius, 0, Math.PI * 2);
  ctx.fill();
  clearGlow(ctx);

  ctx.restore();
}
