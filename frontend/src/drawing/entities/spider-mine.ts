import { UNIT_TO_PIXEL } from "../../constants";
import { TEAM_COLORS } from "../../constants";

export function drawSpiderMineShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  ctx.save();
  ctx.translate(x * UNIT_TO_PIXEL - 4, y * UNIT_TO_PIXEL + 4);
  
  const radius = 8;
  const legLength = 12;
  
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const legX = Math.cos(angle) * legLength;
    const legY = Math.sin(angle) * legLength;
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(legX, legY);
    ctx.stroke();
  }
  
  ctx.restore();
}

export function drawSpiderMineBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  alliance: number
) {
  ctx.save();
  ctx.translate(x * UNIT_TO_PIXEL, y * UNIT_TO_PIXEL);
  
  const radius = 8;
  const legLength = 12;
  const allianceColor = alliance === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;
  
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const legX = Math.cos(angle) * legLength;
    const legY = Math.sin(angle) * legLength;
    const midX = Math.cos(angle) * radius;
    const midY = Math.sin(angle) * radius;
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#2e2e43";
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(legX * 0.7, legY * 0.7);
    ctx.lineTo(legX, legY);
    ctx.stroke();
  }
  
  ctx.fillStyle = allianceColor;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = "#2e2e43";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  const eyeRadius = 2;
  const eyeOffset = 3;
  ctx.fillStyle = "#c06852";
  ctx.beginPath();
  ctx.arc(-eyeOffset, -eyeOffset * 0.5, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeOffset, -eyeOffset * 0.5, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}
