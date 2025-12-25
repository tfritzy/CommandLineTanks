export function drawSmokescreenHud(
  ctx: CanvasRenderingContext2D,
  progress: number,
  cooldownRemaining: number,
  canvasWidth: number,
  canvasHeight: number
) {
  const isReady = cooldownRemaining <= 0;
  const cooldownText = isReady ? 'READY' : `${Math.ceil(cooldownRemaining)}s`;

  ctx.save();

  const width = 120;
  const height = 36;
  const x = canvasWidth / 2 - width / 2;
  const y = canvasHeight - height - 20;
  const radius = 8;

  ctx.fillStyle = '#34404f';
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#4a4b5b';
  ctx.lineWidth = 2;
  ctx.stroke();

  const progressBarWidth = width * progress;
  ctx.fillStyle = isReady ? 'rgba(90, 120, 178, 0.3)' : 'rgba(112, 123, 137, 0.3)';
  ctx.fillRect(x, y, progressBarWidth, height);

  ctx.fillStyle = isReady ? '#aaeeea' : '#a9bcbf';
  ctx.font = 'bold 14px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeText(`🌫️ ${cooldownText}`, x + width / 2, y + height / 2);
  ctx.fillText(`🌫️ ${cooldownText}`, x + width / 2, y + height / 2);

  ctx.restore();
}
