let vignetteCanvas: HTMLCanvasElement | null = null;
let vignetteCtx: CanvasRenderingContext2D | null = null;

export function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  // Use a lower resolution for the vignette to significantly improve performance
  // Vignettes are soft and blurry anyway, so this is a great optimization
  const scale = 0.25;
  const vWidth = Math.ceil(width * scale);
  const vHeight = Math.ceil(height * scale);

  if (!vignetteCanvas || vignetteCanvas.width !== vWidth || vignetteCanvas.height !== vHeight) {
    if (!vignetteCanvas) {
      vignetteCanvas = document.createElement("canvas");
    }
    vignetteCanvas.width = vWidth;
    vignetteCanvas.height = vHeight;
    vignetteCtx = vignetteCanvas.getContext("2d");

    if (vignetteCtx) {
      const centerX = vWidth / 2;
      const centerY = vHeight / 2;
      const radius = Math.sqrt(centerX * centerX + centerY * centerY);

      const gradient = vignetteCtx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );

      // Using #2a152d from the project color palette
      gradient.addColorStop(0, "rgba(42, 21, 45, 0)");
      gradient.addColorStop(0.5, "rgba(42, 21, 45, 0)");
      gradient.addColorStop(1, "rgba(42, 21, 45, 0.6)");

      vignetteCtx.fillStyle = gradient;
      vignetteCtx.fillRect(0, 0, vWidth, vHeight);
    }
  }

  if (vignetteCanvas) {
    ctx.save();
    // Disable image smoothing for the scale-up if we want "crisp" pixels (not recommended for vignette)
    // or keep it enabled (default) for a nice blurry look which is perfect for a vignette.
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(vignetteCanvas, 0, 0, vWidth, vHeight, 0, 0, width, height);
    ctx.restore();
  }
}
