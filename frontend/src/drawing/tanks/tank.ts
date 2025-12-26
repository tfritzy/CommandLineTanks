import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { TEAM_COLORS } from "../../constants";

const HEALTH_BAR_WIDTH = 32;
const HEALTH_BAR_HEIGHT = 4;
const HEALTH_BAR_Y_OFFSET = 24;
const HEALTH_BAR_PADDING = 1;
const HEALTH_BAR_BORDER_RADIUS = 2;

interface TankDrawParams {
  x: number;
  y: number;
  turretRotation: number;
  alliance: number;
  flashTimer: number;
  name: string;
  health: number;
  hasShield: boolean;
}

export function drawTankShadow(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x * UNIT_TO_PIXEL, y * UNIT_TO_PIXEL);

  const shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.fillStyle = shadowColor;

  ctx.save();
  ctx.translate(-4, 4);
  ctx.beginPath();
  ctx.roundRect(-16, -16, 32, 32, 5);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

export function drawTankBody(ctx: CanvasRenderingContext2D, params: TankDrawParams) {
  ctx.save();
  ctx.translate(params.x * UNIT_TO_PIXEL, params.y * UNIT_TO_PIXEL);

  const allianceColor = params.alliance === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;
  const bodyColor = getFlashColor(allianceColor, params.flashTimer);
  const borderColor = getFlashColor(params.alliance === 0 ? "#330000" : "#000033", params.flashTimer);
  const selfShadowColor = "rgba(0, 0, 0, 0.35)";

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(-16, -16, 32, 32, 5);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = selfShadowColor;

  ctx.save();
  ctx.translate(-2, 2);
  ctx.rotate(params.turretRotation);
  ctx.beginPath();
  ctx.roundRect(0, -5, 24, 10, 3);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(-1.5, 1.5);
  ctx.rotate(params.turretRotation);
  ctx.beginPath();
  ctx.roundRect(-12, -12, 24, 24, 10);
  ctx.fill();
  ctx.restore();

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

  ctx.restore();

  if (params.hasShield) {
    ctx.save();
    ctx.translate(params.x * UNIT_TO_PIXEL, params.y * UNIT_TO_PIXEL);

    const shieldRadius = 22;
    const gradient = ctx.createRadialGradient(0, 0, shieldRadius - 4, 0, 0, shieldRadius);
    gradient.addColorStop(0, "rgba(115, 150, 213, 0)");
    gradient.addColorStop(0.7, "rgba(115, 150, 213, 0.3)");
    gradient.addColorStop(1, "rgba(90, 120, 178, 0.6)");

    ctx.strokeStyle = "#7396d5";
    ctx.lineWidth = 2;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

export function drawTankNameLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  name: string
) {
  ctx.save();
  ctx.translate(x * UNIT_TO_PIXEL, y * UNIT_TO_PIXEL);
  ctx.font = "14px monospace";
  ctx.fillStyle = "#f5c47c";
  ctx.textAlign = "center";
  ctx.fillText(name, 0, -30);
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

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.beginPath();
  ctx.roundRect(-HEALTH_BAR_WIDTH / 2, HEALTH_BAR_Y_OFFSET, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, HEALTH_BAR_BORDER_RADIUS);
  ctx.fill();

  const healthPercent = health / maxHealth;
  const innerWidth = HEALTH_BAR_WIDTH - HEALTH_BAR_PADDING * 2;
  const healthBarWidth = innerWidth * healthPercent;

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

  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(endX, endY, dotRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
