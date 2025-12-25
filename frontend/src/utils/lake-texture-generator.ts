import { TERRAIN_COLORS } from "../constants";

const TILE_SIZE = 64;
const SHEET_COLS = 4;
const SHEET_ROWS = 4;

export function generateLakeTextureSheet(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE * SHEET_COLS;
  canvas.height = TILE_SIZE * SHEET_ROWS;
  const ctx = canvas.getContext('2d')!;
  
  for (let caseNum = 0; caseNum < 16; caseNum++) {
    const sheetX = (caseNum % SHEET_COLS) * TILE_SIZE;
    const sheetY = Math.floor(caseNum / SHEET_COLS) * TILE_SIZE;
    
    const tl = (caseNum & 0b1000) !== 0;
    const tr = (caseNum & 0b0100) !== 0;
    const bl = (caseNum & 0b0010) !== 0;
    const br = (caseNum & 0b0001) !== 0;
    
    ctx.save();
    ctx.translate(sheetX, sheetY);
    ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    drawLakeTileCase(ctx, tl, tr, bl, br, TILE_SIZE);
    
    ctx.restore();
  }
  
  return canvas;
}

function drawLakeTileCase(
  ctx: CanvasRenderingContext2D,
  tl: boolean,
  tr: boolean,
  bl: boolean,
  br: boolean,
  size: number
) {
  ctx.fillStyle = TERRAIN_COLORS.GROUND;
  ctx.fillRect(0, 0, size, size);
  
  ctx.fillStyle = TERRAIN_COLORS.LAKE;
  ctx.beginPath();
  
  const lakeCount = [tl, tr, br, bl].filter(Boolean).length;
  
  if (lakeCount === 0) {
    return;
  } else if (lakeCount === 4) {
    ctx.fillRect(0, 0, size, size);
    return;
  } else if (lakeCount === 1) {
    drawSingleCorner(ctx, tl, tr, bl, br, size);
  } else if (lakeCount === 2) {
    if ((tl && tr) || (tr && br) || (br && bl) || (bl && tl)) {
      drawAdjacentCorners(ctx, tl, tr, bl, br, size);
    } else {
      drawDiagonalCorners(ctx, tl, tr, bl, br, size);
    }
  } else if (lakeCount === 3) {
    drawThreeCorners(ctx, tl, tr, bl, br, size);
  }
  
  ctx.fill();
}

function drawSingleCorner(
  ctx: CanvasRenderingContext2D,
  tl: boolean, tr: boolean, bl: boolean, br: boolean,
  size: number
) {
  const HALF = size / 2;
  
  if (tl) {
    ctx.moveTo(0, HALF);
    ctx.arc(0, 0, HALF, Math.PI * 0.5, 0, true);
    ctx.lineTo(0, 0);
  } else if (tr) {
    ctx.moveTo(HALF, 0);
    ctx.arc(size, 0, HALF, Math.PI, Math.PI * 0.5, true);
    ctx.lineTo(size, 0);
  } else if (br) {
    ctx.moveTo(size, HALF);
    ctx.arc(size, size, HALF, Math.PI * 1.5, Math.PI, true);
    ctx.lineTo(size, size);
  } else if (bl) {
    ctx.moveTo(HALF, size);
    ctx.arc(0, size, HALF, 0, Math.PI * 1.5, true);
    ctx.lineTo(0, size);
  }
  ctx.closePath();
}

function drawAdjacentCorners(
  ctx: CanvasRenderingContext2D,
  tl: boolean, tr: boolean, bl: boolean, br: boolean,
  size: number
) {
  const HALF = size / 2;
  
  if (tl && tr) {
    ctx.rect(0, 0, size, HALF);
  } else if (tr && br) {
    ctx.rect(HALF, 0, HALF, size);
  } else if (br && bl) {
    ctx.rect(0, HALF, size, HALF);
  } else if (bl && tl) {
    ctx.rect(0, 0, HALF, size);
  }
}

function drawDiagonalCorners(
  ctx: CanvasRenderingContext2D,
  tl: boolean, tr: boolean, bl: boolean, br: boolean,
  size: number
) {
  const HALF = size / 2;
  
  if (tl) {
    ctx.moveTo(0, HALF);
    ctx.arc(0, 0, HALF, Math.PI * 0.5, 0, true);
    ctx.lineTo(0, 0);
    ctx.closePath();
  }
  if (tr) {
    ctx.moveTo(HALF, 0);
    ctx.arc(size, 0, HALF, Math.PI, Math.PI * 0.5, true);
    ctx.lineTo(size, 0);
    ctx.closePath();
  }
  if (br) {
    ctx.moveTo(size, HALF);
    ctx.arc(size, size, HALF, Math.PI * 1.5, Math.PI, true);
    ctx.lineTo(size, size);
    ctx.closePath();
  }
  if (bl) {
    ctx.moveTo(HALF, size);
    ctx.arc(0, size, HALF, 0, Math.PI * 1.5, true);
    ctx.lineTo(0, size);
    ctx.closePath();
  }
}

function drawThreeCorners(
  ctx: CanvasRenderingContext2D,
  tl: boolean, tr: boolean, bl: boolean, br: boolean,
  size: number
) {
  const HALF = size / 2;
  
  ctx.rect(0, 0, size, size);
  ctx.fill();
  
  ctx.fillStyle = TERRAIN_COLORS.GROUND;
  ctx.beginPath();
  
  if (!tl) {
    ctx.moveTo(0, HALF);
    ctx.arc(0, 0, HALF, Math.PI * 0.5, 0, true);
    ctx.lineTo(0, 0);
  } else if (!tr) {
    ctx.moveTo(HALF, 0);
    ctx.arc(size, 0, HALF, Math.PI, Math.PI * 0.5, true);
    ctx.lineTo(size, 0);
  } else if (!br) {
    ctx.moveTo(size, HALF);
    ctx.arc(size, size, HALF, Math.PI * 1.5, Math.PI, true);
    ctx.lineTo(size, size);
  } else if (!bl) {
    ctx.moveTo(HALF, size);
    ctx.arc(0, size, HALF, 0, Math.PI * 1.5, true);
    ctx.lineTo(0, size);
  }
  ctx.closePath();
  ctx.fill();
}
