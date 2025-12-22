const VIEWPORT_PADDING = 100;

export function isPointInViewport(
  x: number,
  y: number,
  radius: number,
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number
): boolean {
  const paddedLeft = cameraX - VIEWPORT_PADDING;
  const paddedRight = cameraX + viewportWidth + VIEWPORT_PADDING;
  const paddedTop = cameraY - VIEWPORT_PADDING;
  const paddedBottom = cameraY + viewportHeight + VIEWPORT_PADDING;

  return (
    x + radius >= paddedLeft &&
    x - radius <= paddedRight &&
    y + radius >= paddedTop &&
    y - radius <= paddedBottom
  );
}
