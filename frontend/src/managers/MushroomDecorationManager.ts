import { UNIT_TO_PIXEL } from "../constants";

interface Mushroom {
  x: number;
  y: number;
  size: number;
}

export class MushroomDecorationManager {
  private mushrooms: Mushroom[] = [];
  private worldWidth: number = 0;
  private worldHeight: number = 0;

  constructor(worldWidth: number, worldHeight: number) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.generateMushrooms();
  }

  public updateWorldDimensions(width: number, height: number) {
    this.worldWidth = width;
    this.worldHeight = height;
    this.generateMushrooms();
  }

  private generateMushrooms() {
    this.mushrooms = [];
    const density = 0.015;
    const baseSeed = 12345.67;
    const seedMultiplierX = 1.1;
    const seedMultiplierY = 2.2;
    const seedMultiplierSize = 3.3;
    const seedAmplifier = 10000;
    const count = Math.floor(this.worldWidth * this.worldHeight * density);

    for (let i = 0; i < count; i++) {
      const seed = i * baseSeed;
      const x = (Math.abs(Math.sin(seed * seedMultiplierX) * seedAmplifier) % 1) * this.worldWidth;
      const y = (Math.abs(Math.sin(seed * seedMultiplierY) * seedAmplifier) % 1) * this.worldHeight;
      const sizeSeed = Math.abs(Math.sin(seed * seedMultiplierSize) * seedAmplifier) % 1;
      const size = 0.15 + sizeSeed * 0.15;

      this.mushrooms.push({ x, y, size });
    }
  }

  public drawShadows(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const padding = 2;
    const startX = cameraX / UNIT_TO_PIXEL - padding;
    const endX = (cameraX + canvasWidth) / UNIT_TO_PIXEL + padding;
    const startY = cameraY / UNIT_TO_PIXEL - padding;
    const endY = (cameraY + canvasHeight) / UNIT_TO_PIXEL + padding;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";

    for (const mushroom of this.mushrooms) {
      if (mushroom.x >= startX && mushroom.x <= endX && mushroom.y >= startY && mushroom.y <= endY) {
        const worldX = mushroom.x * UNIT_TO_PIXEL;
        const worldY = mushroom.y * UNIT_TO_PIXEL;
        const radius = mushroom.size * UNIT_TO_PIXEL;
        const shadowOffset = radius * 0.3;

        ctx.beginPath();
        ctx.arc(worldX - shadowOffset, worldY + shadowOffset, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  public drawBodies(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const padding = 2;
    const startX = cameraX / UNIT_TO_PIXEL - padding;
    const endX = (cameraX + canvasWidth) / UNIT_TO_PIXEL + padding;
    const startY = cameraY / UNIT_TO_PIXEL - padding;
    const endY = (cameraY + canvasHeight) / UNIT_TO_PIXEL + padding;

    for (const mushroom of this.mushrooms) {
      if (mushroom.x >= startX && mushroom.x <= endX && mushroom.y >= startY && mushroom.y <= endY) {
        const worldX = mushroom.x * UNIT_TO_PIXEL;
        const worldY = mushroom.y * UNIT_TO_PIXEL;
        const radius = mushroom.size * UNIT_TO_PIXEL;

        ctx.save();

        ctx.fillStyle = "#c06852";
        ctx.beginPath();
        ctx.arc(worldX, worldY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#e39764";
        ctx.beginPath();
        ctx.arc(worldX + radius * 0.3, worldY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#9d4343";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(worldX, worldY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }
    }
  }
}
