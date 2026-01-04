import { COLORS } from "../../theme/colors";

const ABILITY_SLOT_BACKGROUND = COLORS.UI.BACKGROUND_DARK;
const ABILITY_SLOT_BORDER = COLORS.TERMINAL.SEPARATOR;
const ABILITY_COOLDOWN_FILL = COLORS.ABILITY.COOLDOWN_BG;
const ABILITY_TEXT_COLOR = COLORS.UI.TEXT_PRIMARY;
const ABILITY_TEXT_STROKE = COLORS.UI.BLACK;
const ABILITY_NAME_COLOR = COLORS.TERMINAL.WARNING;
const ABILITY_NAME_BACKGROUND = COLORS.ABILITY.NAME_BG;

export function drawAbilitySlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  drawIcon: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isReady: boolean) => void,
  progress: number,
  cooldownRemaining: number,
  abilityName: string
) {
  ctx.save();

  const radius = 4;
  ctx.fillStyle = ABILITY_SLOT_BACKGROUND;
  ctx.globalAlpha = 0.9;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + size - radius, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
  ctx.lineTo(x + size, y + size - radius);
  ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
  ctx.lineTo(x + radius, y + size);
  ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = ABILITY_SLOT_BORDER;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 1;
  ctx.stroke();

  const isReady = cooldownRemaining <= 0;
  
  if (progress < 1) {
    const fillHeight = size * progress;
    const fillY = y + size - fillHeight;
    
    ctx.fillStyle = ABILITY_COOLDOWN_FILL;
    ctx.fillRect(x, fillY, size, fillHeight);
  }

  drawIcon(ctx, x + size / 2, y + size / 2, size, isReady);

  if (cooldownRemaining > 0) {
    const cooldownText = Math.ceil(cooldownRemaining).toString();
    ctx.fillStyle = ABILITY_TEXT_COLOR;
    ctx.font = 'bold 12px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    ctx.strokeStyle = ABILITY_TEXT_STROKE;
    ctx.lineWidth = 3;
    ctx.strokeText(cooldownText, x + size / 2, y + size - 4);
    ctx.fillText(cooldownText, x + size / 2, y + size - 4);
  }

  ctx.globalAlpha = 1;
  ctx.font = '9px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  const textMetrics = ctx.measureText(abilityName);
  const textWidth = textMetrics.width;
  const textHeight = 9;
  const padding = 3;
  const bgWidth = textWidth + padding * 2;
  const bgHeight = textHeight + padding * 2;
  const bgX = x + size / 2 - bgWidth / 2;
  const bgY = y + size + 4;
  const bgRadius = 2;
  
  ctx.fillStyle = ABILITY_NAME_BACKGROUND;
  ctx.beginPath();
  ctx.moveTo(bgX + bgRadius, bgY);
  ctx.lineTo(bgX + bgWidth - bgRadius, bgY);
  ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + bgRadius);
  ctx.lineTo(bgX + bgWidth, bgY + bgHeight - bgRadius);
  ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - bgRadius, bgY + bgHeight);
  ctx.lineTo(bgX + bgRadius, bgY + bgHeight);
  ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - bgRadius);
  ctx.lineTo(bgX, bgY + bgRadius);
  ctx.quadraticCurveTo(bgX, bgY, bgX + bgRadius, bgY);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = ABILITY_NAME_COLOR;
  ctx.fillText(abilityName, x + size / 2, bgY + padding);

  ctx.restore();
}
