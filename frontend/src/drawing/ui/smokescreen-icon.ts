export function drawSmokescreenIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  isReady: boolean
) {
  ctx.save();
  ctx.translate(x, y);

  const cloudRadius = size * 0.35;
  const cloudColor = isReady ? '#aaeeea' : '#707b89';
  const cloudCount = 5;
  
  ctx.fillStyle = cloudColor;
  ctx.globalAlpha = 0.8;

  for (let i = 0; i < cloudCount; i++) {
    const angle = (i / cloudCount) * Math.PI * 2;
    const offsetX = Math.cos(angle) * cloudRadius * 0.4;
    const offsetY = Math.sin(angle) * cloudRadius * 0.4;
    
    ctx.beginPath();
    ctx.arc(offsetX, offsetY, cloudRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0, 0, cloudRadius * 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
