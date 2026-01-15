import { COLORS } from "../../theme/colors";
import { UNIT_TO_PIXEL } from "../../constants";

const FLOWER_SIZE = 0.08;
const PETAL_COUNT = 4;
const PETAL_SIZE = 0.04;
const CENTER_SIZE = 0.018;
const VARIATION_COUNT = 5;

type FlowerTextureCache = Map<number, HTMLCanvasElement>;

const textureCache: FlowerTextureCache = new Map();

function generateFlowerTexture(variationIndex: number): HTMLCanvasElement {
  const size = Math.ceil(FLOWER_SIZE * UNIT_TO_PIXEL * 2);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const seed = variationIndex * 17.3;
  const centerX = size / 2;
  const centerY = size / 2;
  const petalPixelSize = PETAL_SIZE * UNIT_TO_PIXEL;
  const centerPixelSize = CENTER_SIZE * UNIT_TO_PIXEL;

  const flowerCount = 3 + (Math.abs(Math.sin(seed * 1.1)) * 3);

  for (let f = 0; f < flowerCount; f++) {
    const flowerSeed = seed + f * 23.7;
    const angle = Math.abs(Math.sin(flowerSeed * 7.77)) * Math.PI * 2;
    const distance = Math.abs(Math.sin(flowerSeed * 11.11)) * (size / 3);
    const flowerX = centerX + Math.cos(angle) * distance;
    const flowerY = centerY + Math.sin(angle) * distance;
    const rotation = Math.abs(Math.sin(flowerSeed * 13.13)) * Math.PI * 2;

    ctx.fillStyle = COLORS.TERRAIN.FLOWER_PETAL;
    for (let i = 0; i < PETAL_COUNT; i++) {
      const petalAngle = rotation + (i * Math.PI * 2) / PETAL_COUNT;
      const px = flowerX + Math.cos(petalAngle) * petalPixelSize;
      const py = flowerY + Math.sin(petalAngle) * petalPixelSize;

      ctx.beginPath();
      ctx.arc(px, py, petalPixelSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = COLORS.TERRAIN.FLOWER_CENTER;
    ctx.beginPath();
    ctx.arc(flowerX, flowerY, centerPixelSize, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

function getFlowerTexture(variationIndex: number): HTMLCanvasElement {
  let texture = textureCache.get(variationIndex);
  if (!texture) {
    texture = generateFlowerTexture(variationIndex);
    textureCache.set(variationIndex, texture);
  }
  return texture;
}

export function drawFlowers(
  ctx: CanvasRenderingContext2D,
  flowers: Array<{ x: number; y: number; variation: number }>
) {
  if (flowers.length === 0) return;

  ctx.imageSmoothingEnabled = false;

  for (const flower of flowers) {
    const texture = getFlowerTexture(flower.variation);
    const x = Math.round(flower.x - texture.width / 2);
    const y = Math.round(flower.y - texture.height / 2);
    ctx.drawImage(texture, x, y);
  }
}

export function getVariationCount(): number {
  return VARIATION_COUNT;
}
