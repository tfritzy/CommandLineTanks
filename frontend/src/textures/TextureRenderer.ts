import { getNormalizedDPR } from "../utils/dpr";

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
  drawFn: (ctx: CanvasRenderingContext2D) => void
): Promise<TextureImage> {
  const dpr = getNormalizedDPR();
  
  const canvas = document.createElement("canvas");
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context for texture rendering");
  }
  
  ctx.scale(dpr, dpr);
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
  const dpr = getNormalizedDPR();
  
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
    texture.width * dpr,
    texture.height * dpr,
    -texture.anchorX,
    -texture.anchorY,
    texture.width,
    texture.height
  );
  
  ctx.restore();
}
