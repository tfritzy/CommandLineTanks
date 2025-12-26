import { getFlashColor } from "../../utils/colors";
import { TERRAIN_DETAIL_COLORS } from "../../constants";

export function drawRockShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const shadowOffset = radius * 0.2;
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";

  ctx.beginPath();
  ctx.arc(centerX - shadowOffset, centerY + shadowOffset, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRockBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  const bodyColor = getFlashColor(TERRAIN_DETAIL_COLORS.ROCK.BODY, flashTimer);
  const shadowColor = getFlashColor(TERRAIN_DETAIL_COLORS.ROCK.SHADOW, flashTimer);
  const highlightColor = getFlashColor(TERRAIN_DETAIL_COLORS.ROCK.HIGHLIGHT, flashTimer);

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = bodyColor;
  ctx.fill();

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.15, centerY + radius * 0.15, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = highlightColor;
  ctx.beginPath();
  ctx.arc(centerX + radius * 0.15, centerY - radius * 0.15, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = getFlashColor(TERRAIN_DETAIL_COLORS.ROCK.OUTLINE, flashTimer);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
}
