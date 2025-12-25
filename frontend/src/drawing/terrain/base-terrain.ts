type BaseTerrainType = { tag: string };

export function drawBaseTerrain(
  ctx: CanvasRenderingContext2D,
  baseTerrainLayer: BaseTerrainType[],
  worldWidth: number,
  worldHeight: number,
  startTileX: number,
  endTileX: number,
  startTileY: number,
  endTileY: number,
  unitToPixel: number
) {
  ctx.beginPath();
  for (let tileY = startTileY; tileY <= endTileY; tileY++) {
    for (let tileX = startTileX; tileX <= endTileX; tileX++) {
      if (
        tileX < 0 ||
        tileX >= worldWidth ||
        tileY < 0 ||
        tileY >= worldHeight
      ) {
        continue;
      }

      const worldX = tileX * unitToPixel;
      const worldY = tileY * unitToPixel;
      ctx.rect(worldX, worldY, unitToPixel, unitToPixel);
    }
  }
  ctx.fillStyle = "#2e2e43";
  ctx.fill();

  ctx.fillStyle = "#313148";
  const numGrooves = 2;
  const grooveHeight = unitToPixel * 0.15;
  ctx.beginPath();
  for (let tileY = startTileY; tileY <= endTileY; tileY++) {
    for (let tileX = startTileX; tileX <= endTileX; tileX++) {
      if (
        tileX < 0 ||
        tileX >= worldWidth ||
        tileY < 0 ||
        tileY >= worldHeight
      ) {
        continue;
      }

      const index = tileY * worldWidth + tileX;
      const terrain = baseTerrainLayer[index];

      if (terrain.tag === "Farm") {
        const worldX = tileX * unitToPixel;
        const worldY = tileY * unitToPixel;

        for (let i = 0; i < numGrooves; i++) {
          const grooveY =
            worldY +
            unitToPixel * ((i + 0.5) / numGrooves) -
            grooveHeight / 2;
          ctx.rect(worldX, grooveY, unitToPixel, grooveHeight);
        }
      }
    }
  }
  ctx.fill();

  ctx.strokeStyle = "#4a4b5b22";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let tileY = startTileY; tileY <= endTileY; tileY++) {
    for (let tileX = startTileX; tileX <= endTileX; tileX++) {
      if (
        tileX < 0 ||
        tileX >= worldWidth ||
        tileY < 0 ||
        tileY >= worldHeight
      ) {
        continue;
      }

      const worldX = tileX * unitToPixel;
      const worldY = tileY * unitToPixel;
      ctx.rect(worldX, worldY, unitToPixel, unitToPixel);
    }
  }
  ctx.stroke();
}
