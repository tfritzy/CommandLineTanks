import { COLORS, PALETTE } from "../../theme/colors";


export function drawBoomerangShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  armLength: number,
  armWidth: number
) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.fillStyle = PALETTE.BLACK_PURE + "4d";

  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 3);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(armLength, -armWidth * 0.4);
    ctx.quadraticCurveTo(armLength * 1.1, 0, armLength, armWidth * 0.4);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, armWidth * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawBoomerangBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  armLength: number,
  armWidth: number,
  color: string
) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.fillStyle = color;
  ctx.strokeStyle = COLORS.GAME.PROJECTILE_OUTLINE;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";

  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 3);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(armLength, -armWidth * 0.4);
    ctx.quadraticCurveTo(armLength * 1.1, 0, armLength, armWidth * 0.4);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, armWidth * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
