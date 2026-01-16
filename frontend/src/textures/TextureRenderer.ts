export const TEXTURE_DPR = 4;

export interface TextureImage {
  image: ImageBitmap;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
}

export async function renderToImageBitmap(
  width: number,
  height: number,
  anchorX: number,
  anchorY: number,
  drawFn: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => void
): Promise<TextureImage> {
  const pixelWidth = width * TEXTURE_DPR;
  const pixelHeight = height * TEXTURE_DPR;
  
  const canvas = new OffscreenCanvas(pixelWidth, pixelHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context for texture rendering");
  }

  ctx.scale(TEXTURE_DPR, TEXTURE_DPR);
  ctx.imageSmoothingEnabled = false;

  drawFn(ctx);

  const imageBitmap = await createImageBitmap(canvas);

  return {
    image: imageBitmap,
    width,
    height,
    anchorX,
    anchorY
  };
}

export function drawTexture(
  ctx: CanvasRenderingContext2D,
  texture: TextureImage,
  x: number,
  y: number,
  scale: number = 1.0,
  rotation: number = 0
) {
  ctx.save();
  ctx.translate(x, y);

  if (rotation !== 0) {
    ctx.rotate(rotation);
  }
  if (scale !== 1.0) {
    ctx.scale(scale, scale);
  }

  ctx.drawImage(
    texture.image,
    0,
    0,
    texture.width * TEXTURE_DPR,
    texture.height * TEXTURE_DPR,
    -texture.anchorX,
    -texture.anchorY,
    texture.width + 1,
    texture.height + 1
  );

  ctx.restore();
}