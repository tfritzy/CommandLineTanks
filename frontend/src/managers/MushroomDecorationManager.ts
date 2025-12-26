import { UNIT_TO_PIXEL } from "../constants";

interface Mushroom {
  x: number;
  y: number;
  size: number;
}

export class MushroomDecorationManager {
  private static readonly DENSITY = 0.015;
  private static readonly BASE_SEED = 12345.67;
  private static readonly SEED_MULTIPLIER_X = 1.1;
  private static readonly SEED_MULTIPLIER_Y = 2.2;
  private static readonly SEED_MULTIPLIER_SIZE = 3.3;
  private static readonly SEED_AMPLIFIER = 10000;
  private static readonly MIN_SIZE = 0.15;
  private static readonly SIZE_VARIATION = 0.15;

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
    const count = Math.floor(this.worldWidth * this.worldHeight * MushroomDecorationManager.DENSITY);

    for (let i = 0; i < count; i++) {
      const seed = i * MushroomDecorationManager.BASE_SEED;
      const x = (Math.abs(Math.sin(seed * MushroomDecorationManager.SEED_MULTIPLIER_X) * MushroomDecorationManager.SEED_AMPLIFIER) % 1) * this.worldWidth;
      const y = (Math.abs(Math.sin(seed * MushroomDecorationManager.SEED_MULTIPLIER_Y) * MushroomDecorationManager.SEED_AMPLIFIER) % 1) * this.worldHeight;
      const sizeSeed = Math.abs(Math.sin(seed * MushroomDecorationManager.SEED_MULTIPLIER_SIZE) * MushroomDecorationManager.SEED_AMPLIFIER) % 1;
      const size = MushroomDecorationManager.MIN_SIZE + sizeSeed * MushroomDecorationManager.SIZE_VARIATION;

      this.mushrooms.push({ x, y, size });
    }
  }

  private getVisibleMushrooms(
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ): Mushroom[] {
    const padding = 2;
    const startX = cameraX / UNIT_TO_PIXEL - padding;
    const endX = (cameraX + canvasWidth) / UNIT_TO_PIXEL + padding;
    const startY = cameraY / UNIT_TO_PIXEL - padding;
    const endY = (cameraY + canvasHeight) / UNIT_TO_PIXEL + padding;

    return this.mushrooms.filter(
      mushroom => mushroom.x >= startX && mushroom.x <= endX && mushroom.y >= startY && mushroom.y <= endY
    );
  }

  public drawShadows(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const visibleMushrooms = this.getVisibleMushrooms(cameraX, cameraY, canvasWidth, canvasHeight);

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";

    for (const mushroom of visibleMushrooms) {
      const worldX = mushroom.x * UNIT_TO_PIXEL;
      const worldY = mushroom.y * UNIT_TO_PIXEL;
      const radius = mushroom.size * UNIT_TO_PIXEL;
      const shadowOffset = radius * 0.3;

      ctx.beginPath();
      ctx.arc(worldX - shadowOffset, worldY + shadowOffset, radius, 0, Math.PI * 2);
      ctx.fill();
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
    const visibleMushrooms = this.getVisibleMushrooms(cameraX, cameraY, canvasWidth, canvasHeight);

    for (const mushroom of visibleMushrooms) {
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
