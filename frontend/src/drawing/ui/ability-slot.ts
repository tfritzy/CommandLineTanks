const ABILITY_SLOT_BACKGROUND = '#34404f';
const ABILITY_SLOT_BORDER = '#4a4b5b';
const ABILITY_COOLDOWN_FILL = 'rgba(112, 123, 137, 0.4)';
const ABILITY_ICON_READY = '#aaeeea';
const ABILITY_ICON_COOLDOWN = '#707b89';
const ABILITY_TEXT_COLOR = '#fcfbf3';
const ABILITY_TEXT_STROKE = '#000';

export function drawAbilitySlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  icon: string,
  progress: number,
  cooldownRemaining: number
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

  ctx.fillStyle = isReady ? ABILITY_ICON_READY : ABILITY_ICON_COOLDOWN;
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, x + size / 2, y + size / 2);

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

  ctx.restore();
}
