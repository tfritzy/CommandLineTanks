import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor, lerpColor } from "../../utils/colors";
import { COLORS, PALETTE } from "../../theme/colors";

const HEALTH_BAR_WIDTH = 32;
const HEALTH_BAR_HEIGHT = 4;
const HEALTH_BAR_Y_OFFSET = 24;
const HEALTH_BAR_PADDING = 1;
const HEALTH_BAR_BORDER_RADIUS = 2;
const IMMUNITY_FLASH_RATE_SECONDS = 0.2;
const IMMUNITY_MIN_OPACITY = 0.5;
const TWO_PI = Math.PI * 2;

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

export function drawTankShadow(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const px = x * UNIT_TO_PIXEL - 2;
  const py = y * UNIT_TO_PIXEL + 2;
  
  ctx.fillStyle = PALETTE.TRANSPARENT_SHADOW;
  ctx.beginPath();
  ctx.roundRect(px - 16, py - 16, 32, 32, 5);
  ctx.fill();
}

export function drawTankBody(ctx: CanvasRenderingContext2D, params: TankDrawParams) {
  const centerX = Math.floor(params.x * UNIT_TO_PIXEL);
  const centerY = Math.floor(params.y * UNIT_TO_PIXEL);

  const allianceColor = params.alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT : COLORS.GAME.TEAM_BLUE_BRIGHT;
  const baseBorderColor = params.alliance === 0 ? "#330000" : "#000033";
  
  let bodyColor: string = allianceColor;
  let borderColor: string = baseBorderColor;
  
  if (params.flashTimer > 0) {
    bodyColor = getFlashColor(allianceColor, params.flashTimer);
    borderColor = getFlashColor(baseBorderColor, params.flashTimer);
  }
  
  if (params.isImmune) {
    const flashCycle = Date.now() / 1000 / IMMUNITY_FLASH_RATE_SECONDS;
    const lerpAmount = Math.abs(Math.sin(flashCycle * Math.PI)) * (1 - IMMUNITY_MIN_OPACITY) + IMMUNITY_MIN_OPACITY;
    const groundColor = COLORS.TERRAIN.GROUND;
    bodyColor = lerpColor(groundColor, bodyColor, lerpAmount);
    borderColor = lerpColor(groundColor, borderColor, lerpAmount);
  }

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(centerX - 15, centerY - 15, 30, 30, 5);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  
  ctx.save();
  ctx.translate(centerX - 2, centerY + 2);
  ctx.rotate(params.turretRotation);
  ctx.beginPath();
  ctx.roundRect(0, -5, 24, 10, 3);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(centerX - 1.5, centerY + 1.5);
  ctx.rotate(params.turretRotation);
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, TWO_PI);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(params.turretRotation);

  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = borderColor;
  ctx.beginPath();
  ctx.roundRect(0, -5, 24, 10, 3);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, TWO_PI);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (params.hasShield) {
    const shieldSize = 40;
    const shieldHalfSize = shieldSize / 2;

    ctx.strokeStyle = COLORS.TERMINAL.INFO;
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(115, 150, 213, 0.25)";
    ctx.beginPath();
    ctx.roundRect(centerX - shieldHalfSize, centerY - shieldHalfSize, shieldSize, shieldSize, 5);
    ctx.fill();
    ctx.stroke();
  }
}

export function drawTankNameLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  targetCode: string,
  name: string
) {
  const px = Math.floor(x * UNIT_TO_PIXEL);
  const py = Math.floor(y * UNIT_TO_PIXEL);
  
  ctx.textAlign = "center";

  if (targetCode) {
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = COLORS.TERMINAL.WARNING;
    ctx.fillText(targetCode, px, py - 34);

    ctx.font = "12px monospace";
    ctx.fillStyle = COLORS.TERMINAL.TEXT_MUTED;
    ctx.fillText(name, px, py - 20);
  } else {
    ctx.font = "12px monospace";
    ctx.fillStyle = COLORS.TERMINAL.TEXT_MUTED;
    ctx.fillText(name, px, py - 27);
  }
}

export function drawTankTextLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string
) {
  const px = x * UNIT_TO_PIXEL;
  const py = y * UNIT_TO_PIXEL;
  ctx.font = "14px monospace";
  ctx.fillStyle = "#f5c47c";
  ctx.textAlign = "center";
  ctx.fillText(text, px, py - 26);
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

  const px = x * UNIT_TO_PIXEL;
  const py = y * UNIT_TO_PIXEL;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.beginPath();
  ctx.roundRect(px - HEALTH_BAR_WIDTH / 2, py + HEALTH_BAR_Y_OFFSET, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, HEALTH_BAR_BORDER_RADIUS);
  ctx.fill();

  const healthPercent = health / maxHealth;
  const innerWidth = HEALTH_BAR_WIDTH - HEALTH_BAR_PADDING * 2;
  const healthBarWidth = innerWidth * healthPercent;

  ctx.fillStyle = allianceColor;
  ctx.beginPath();
  ctx.roundRect(
    px - HEALTH_BAR_WIDTH / 2 + HEALTH_BAR_PADDING,
    py + HEALTH_BAR_Y_OFFSET + HEALTH_BAR_PADDING,
    healthBarWidth,
    HEALTH_BAR_HEIGHT - HEALTH_BAR_PADDING * 2,
    HEALTH_BAR_BORDER_RADIUS
  );
  ctx.fill();
}

export function drawTankPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  path: Array<{ x: number; y: number }>,
  lineColor: string,
  dotColor: string
) {
  if (path.length === 0) return;

  const dotRadius = 5;

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();

  const startX = x * UNIT_TO_PIXEL;
  const startY = y * UNIT_TO_PIXEL;
  ctx.moveTo(startX, startY);

  for (const pathEntry of path) {
    const gameX = pathEntry.x * UNIT_TO_PIXEL;
    const gameY = pathEntry.y * UNIT_TO_PIXEL;
    ctx.lineTo(gameX, gameY);
  }

  ctx.stroke();

  const lastEntry = path[path.length - 1];
  const endX = lastEntry.x * UNIT_TO_PIXEL;
  const endY = lastEntry.y * UNIT_TO_PIXEL;

  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(endX, endY, dotRadius, 0, TWO_PI);
  ctx.fill();
}
