export function drawPlayerScore(
  ctx: CanvasRenderingContext2D,
  name: string,
  kills: number,
  alliance: number,
  x: number,
  y: number,
  barWidth: number,
  barHeight: number,
  maxKills: number
) {
  const color = alliance === 0 ? 'rgba(157, 67, 67, 0.8)' : 'rgba(90, 120, 178, 0.8)';
  const progress = kills / maxKills;
  const radius = barHeight / 2;

  ctx.save();

  ctx.beginPath();
  ctx.roundRect(x - barWidth, y, barWidth, barHeight, radius);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill();

  const inset = 1.5;
  if (progress > 0) {
    const innerWidth = (barWidth - inset * 2) * progress;
    const innerHeight = barHeight - inset * 2;
    const innerRadius = innerHeight / 2;
    ctx.beginPath();
    ctx.roundRect(x - barWidth + inset, y + inset, innerWidth, innerHeight, innerRadius);
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.restore();

  const killText = kills === 1 ? 'kill' : 'kills';
  const text = `${name}  —  ${kills} ${killText}`;

  ctx.font = '800 14px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeText(text, x - barWidth / 2, y + barHeight / 2 + 1);

  ctx.fillStyle = '#fcfbf3';
  ctx.fillText(text, x - barWidth / 2, y + barHeight / 2 + 1);
}
