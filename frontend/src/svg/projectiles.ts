import { COLORS } from "../theme/colors";
import { UNIT_TO_PIXEL } from "../constants";
import { SvgTextureSheet } from "./svg-cache";

function createNormalProjectileSvg(color: string, radius: number): string {
  const size = radius * 2 + 4;
  const cx = size / 2;
  const cy = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" stroke="${COLORS.UI.BLACK}" stroke-width="1"/>
  </svg>`;
}

function createNormalProjectileShadowSvg(radius: number): string {
  const size = radius * 2 + 4;
  const cx = size / 2;
  const cy = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="rgba(0,0,0,0.3)"/>
  </svg>`;
}

function createMissileSvg(color: string, radius: number): string {
  const width = radius * 3.5;
  const height = radius * 2 + 4;
  const cx = radius * 1.5;
  const cy = height / 2;
  const flameLength = radius * 1 + 0.5;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <polygon points="${cx - flameLength},${cy} ${cx},${cy - radius * 0.3} ${cx},${cy + radius * 0.3}" fill="${COLORS.EFFECTS.FIRE_YELLOW}"/>
    <polygon points="${cx + radius * 2},${cy} ${cx},${cy - radius * 0.8} ${cx},${cy + radius * 0.8}" fill="${color}"/>
  </svg>`;
}

function createMissileShadowSvg(radius: number): string {
  const width = radius * 3.5;
  const height = radius * 2 + 4;
  const cx = radius * 1.5;
  const cy = height / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <polygon points="${cx + radius * 2},${cy} ${cx},${cy - radius * 0.8} ${cx},${cy + radius * 0.8}" fill="rgba(0,0,0,0.3)"/>
  </svg>`;
}

function createRocketSvg(color: string, radius: number): string {
  const width = radius * 6 + 4;
  const height = radius * 3 + 4;
  const cx = radius * 2.5;
  const cy = height / 2;
  const flameLength = radius * 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <polygon points="${cx - flameLength},${cy} ${cx},${cy - radius * 0.4} ${cx},${cy + radius * 0.4}" fill="${COLORS.EFFECTS.FIRE_YELLOW}"/>
    <path d="M ${cx} ${cy - radius * 1.2} A ${radius * 3} ${radius * 1.2} 0 0 1 ${cx} ${cy + radius * 1.2} L ${cx} ${cy + radius * 1.2} L ${cx} ${cy - radius * 1.2} Z" fill="${color}"/>
  </svg>`;
}

function createRocketShadowSvg(radius: number): string {
  const width = radius * 6 + 4;
  const height = radius * 3 + 4;
  const cx = radius * 2.5;
  const cy = height / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <path d="M ${cx} ${cy - radius * 1.2} A ${radius * 3} ${radius * 1.2} 0 0 1 ${cx} ${cy + radius * 1.2} L ${cx} ${cy + radius * 1.2} L ${cx} ${cy - radius * 1.2} Z" fill="rgba(0,0,0,0.3)"/>
  </svg>`;
}

function createGrenadeSvg(color: string, radius: number): string {
  const width = radius * 2.5;
  const height = radius * 3;
  const cx = width / 2;
  const cy = height / 2 + radius * 0.3;
  const pinWidth = radius * 0.3;
  const pinHeight = radius * 0.4;
  const pinY = cy - radius * 1.1;
  const ringRadius = radius * 0.25;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <ellipse cx="${cx}" cy="${cy}" rx="${radius}" ry="${radius * 1.1}" fill="${color}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="${Math.max(1, radius * 0.15)}"/>
    <line x1="${cx - radius}" y1="${cy}" x2="${cx + radius}" y2="${cy}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="${Math.max(1, radius * 0.15)}"/>
    <rect x="${cx - pinWidth / 2}" y="${pinY - pinHeight}" width="${pinWidth}" height="${pinHeight}" fill="${COLORS.GAME.PROJECTILE_OUTLINE}"/>
    <circle cx="${cx + pinWidth / 2}" cy="${pinY - pinHeight / 2}" r="${ringRadius}" fill="${COLORS.GAME.PROJECTILE_METAL}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="${Math.max(0.5, radius * 0.1)}"/>
  </svg>`;
}

function createGrenadeShadowSvg(radius: number): string {
  const width = radius * 2.5;
  const height = radius * 3;
  const cx = width / 2;
  const cy = height / 2 + radius * 0.3;
  const pinWidth = radius * 0.3;
  const pinHeight = radius * 0.4;
  const pinY = cy - radius * 1.1;
  const ringRadius = radius * 0.25;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <ellipse cx="${cx}" cy="${cy}" rx="${radius}" ry="${radius * 1.1}" fill="rgba(0,0,0,0.3)"/>
    <rect x="${cx - pinWidth / 2}" y="${pinY - pinHeight}" width="${pinWidth}" height="${pinHeight}" fill="rgba(0,0,0,0.3)"/>
    <circle cx="${cx + pinWidth / 2}" cy="${pinY - pinHeight / 2}" r="${ringRadius}" fill="rgba(0,0,0,0.3)"/>
  </svg>`;
}

function createBoomerangArmPath(armLength: number, armWidth: number, rotation: number, cx: number, cy: number): string {
  const rad = (rotation * Math.PI * 2) / 3;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const p1x = cx;
  const p1y = cy;
  const p2x = cx + armLength * cos - (-armWidth * 0.4) * sin;
  const p2y = cy + armLength * sin + (-armWidth * 0.4) * cos;
  const ctrlX = cx + (armLength * 1.1) * cos;
  const ctrlY = cy + (armLength * 1.1) * sin;
  const p3x = cx + armLength * cos - (armWidth * 0.4) * sin;
  const p3y = cy + armLength * sin + (armWidth * 0.4) * cos;
  
  return `M ${p1x} ${p1y} L ${p2x} ${p2y} Q ${ctrlX} ${ctrlY} ${p3x} ${p3y} Z`;
}

function createBoomerangSvg(color: string, armLength: number, armWidth: number): string {
  const size = armLength * 2.5;
  const cx = size / 2;
  const cy = size / 2;
  
  const path0 = createBoomerangArmPath(armLength, armWidth, 0, cx, cy);
  const path1 = createBoomerangArmPath(armLength, armWidth, 1, cx, cy);
  const path2 = createBoomerangArmPath(armLength, armWidth, 2, cx, cy);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <path d="${path0}" fill="${color}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="${path1}" fill="${color}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="${path2}" fill="${color}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="${armWidth * 0.5}" fill="${color}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="2"/>
  </svg>`;
}

function createBoomerangShadowSvg(armLength: number, armWidth: number): string {
  const size = armLength * 2.5;
  const cx = size / 2;
  const cy = size / 2;
  
  const path0 = createBoomerangArmPath(armLength, armWidth, 0, cx, cy);
  const path1 = createBoomerangArmPath(armLength, armWidth, 1, cx, cy);
  const path2 = createBoomerangArmPath(armLength, armWidth, 2, cx, cy);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <path d="${path0}" fill="rgba(0,0,0,0.3)"/>
    <path d="${path1}" fill="rgba(0,0,0,0.3)"/>
    <path d="${path2}" fill="rgba(0,0,0,0.3)"/>
    <circle cx="${cx}" cy="${cy}" r="${armWidth * 0.5}" fill="rgba(0,0,0,0.3)"/>
  </svg>`;
}

function createMoagSvg(color: string, radius: number): string {
  const size = radius * 2 + 4;
  const cx = size / 2;
  const cy = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" stroke="${COLORS.UI.BLACK}" stroke-width="1"/>
  </svg>`;
}

function createMoagShadowSvg(radius: number): string {
  const size = radius * 2 + 4;
  const cx = size / 2;
  const cy = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="rgba(0,0,0,0.3)"/>
  </svg>`;
}

function createSniperSvg(color: string, bulletLength: number, bulletWidth: number, bulletBackRatio: number): string {
  const width = bulletLength * 1.5 + 8;
  const height = bulletWidth * 3;
  const cx = bulletLength * bulletBackRatio + 4;
  const cy = height / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <path d="M ${cx} ${cy - bulletWidth} 
             L ${cx - bulletLength * bulletBackRatio} ${cy - bulletWidth}
             L ${cx - bulletLength * bulletBackRatio} ${cy - bulletWidth * 1.1}
             L ${cx - bulletLength * (bulletBackRatio + 0.05)} ${cy - bulletWidth * 1.1}
             L ${cx - bulletLength * (bulletBackRatio + 0.05)} ${cy + bulletWidth * 1.1}
             L ${cx - bulletLength * bulletBackRatio} ${cy + bulletWidth * 1.1}
             L ${cx - bulletLength * bulletBackRatio} ${cy + bulletWidth}
             L ${cx} ${cy + bulletWidth}
             Z" 
          fill="${color}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="1"/>
    <path d="M ${cx + bulletLength} ${cy}
             C ${cx + bulletLength * 0.8} ${cy - bulletWidth * 0.2} ${cx + bulletLength * 0.4} ${cy - bulletWidth} ${cx} ${cy - bulletWidth}
             L ${cx} ${cy + bulletWidth}
             C ${cx + bulletLength * 0.4} ${cy + bulletWidth} ${cx + bulletLength * 0.8} ${cy + bulletWidth * 0.2} ${cx + bulletLength} ${cy}
             Z"
          fill="${color}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="1"/>
  </svg>`;
}

function createSniperShadowSvg(bulletLength: number, bulletWidth: number, bulletBackRatio: number): string {
  const width = bulletLength * 1.5 + 8;
  const height = bulletWidth * 3;
  const cx = bulletLength * bulletBackRatio + 4;
  const cy = height / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <path d="M ${cx + bulletLength} ${cy}
             C ${cx + bulletLength * 0.8} ${cy - bulletWidth * 0.2} ${cx + bulletLength * 0.4} ${cy - bulletWidth} ${cx} ${cy - bulletWidth}
             L ${cx - bulletLength * bulletBackRatio} ${cy - bulletWidth}
             L ${cx - bulletLength * bulletBackRatio} ${cy + bulletWidth}
             L ${cx} ${cy + bulletWidth}
             C ${cx + bulletLength * 0.4} ${cy + bulletWidth} ${cx + bulletLength * 0.8} ${cy + bulletWidth * 0.2} ${cx + bulletLength} ${cy}
             Z"
          fill="rgba(0,0,0,0.3)"/>
  </svg>`;
}

export class ProjectileSvgSheet extends SvgTextureSheet {
  constructor() {
    super();
    this.registerAllProjectiles();
  }

  private registerAllProjectiles() {
    const textureSize = 0.5;
    const radius = textureSize * UNIT_TO_PIXEL;

    this.registerTexture("normal-0", createNormalProjectileSvg(COLORS.GAME.TEAM_RED_BRIGHT, radius), radius * 2 + 4, radius * 2 + 4);
    this.registerTexture("normal-1", createNormalProjectileSvg(COLORS.GAME.TEAM_BLUE_BRIGHT, radius), radius * 2 + 4, radius * 2 + 4);
    this.registerTexture("normal-shadow", createNormalProjectileShadowSvg(radius), radius * 2 + 4, radius * 2 + 4);

    this.registerTexture("missile-0", createMissileSvg(COLORS.GAME.TEAM_RED_BRIGHT, radius * 1.5), radius * 5.25, radius * 3.5);
    this.registerTexture("missile-1", createMissileSvg(COLORS.GAME.TEAM_BLUE_BRIGHT, radius * 1.5), radius * 5.25, radius * 3.5);
    this.registerTexture("missile-shadow", createMissileShadowSvg(radius * 1.5), radius * 5.25, radius * 3.5);

    this.registerTexture("rocket-0", createRocketSvg(COLORS.GAME.TEAM_RED_BRIGHT, radius), radius * 6 + 4, radius * 3 + 4);
    this.registerTexture("rocket-1", createRocketSvg(COLORS.GAME.TEAM_BLUE_BRIGHT, radius), radius * 6 + 4, radius * 3 + 4);
    this.registerTexture("rocket-shadow", createRocketShadowSvg(radius), radius * 6 + 4, radius * 3 + 4);

    this.registerTexture("grenade-0", createGrenadeSvg(COLORS.GAME.TEAM_RED_BRIGHT, radius), radius * 2.5, radius * 3);
    this.registerTexture("grenade-1", createGrenadeSvg(COLORS.GAME.TEAM_BLUE_BRIGHT, radius), radius * 2.5, radius * 3);
    this.registerTexture("grenade-shadow", createGrenadeShadowSvg(radius), radius * 2.5, radius * 3);

    const armWidth = radius * 0.8;
    const armLength = radius * 2.2;
    this.registerTexture("boomerang-0", createBoomerangSvg(COLORS.GAME.TEAM_RED_BRIGHT, armLength, armWidth), armLength * 2.5, armLength * 2.5);
    this.registerTexture("boomerang-1", createBoomerangSvg(COLORS.GAME.TEAM_BLUE_BRIGHT, armLength, armWidth), armLength * 2.5, armLength * 2.5);
    this.registerTexture("boomerang-shadow", createBoomerangShadowSvg(armLength, armWidth), armLength * 2.5, armLength * 2.5);

    const moagRadius = 0.5 * UNIT_TO_PIXEL;
    this.registerTexture("moag-0", createMoagSvg(COLORS.GAME.TEAM_RED_BRIGHT, moagRadius), moagRadius * 2 + 4, moagRadius * 2 + 4);
    this.registerTexture("moag-1", createMoagSvg(COLORS.GAME.TEAM_BLUE_BRIGHT, moagRadius), moagRadius * 2 + 4, moagRadius * 2 + 4);
    this.registerTexture("moag-shadow", createMoagShadowSvg(moagRadius), moagRadius * 2 + 4, moagRadius * 2 + 4);

    const bulletLength = radius * 2.5;
    const bulletWidth = radius * 0.8;
    const bulletBackRatio = 0.5;
    this.registerTexture("sniper-0", createSniperSvg(COLORS.GAME.TEAM_RED_BRIGHT, bulletLength, bulletWidth, bulletBackRatio), bulletLength * 1.5 + 8, bulletWidth * 3);
    this.registerTexture("sniper-1", createSniperSvg(COLORS.GAME.TEAM_BLUE_BRIGHT, bulletLength, bulletWidth, bulletBackRatio), bulletLength * 1.5 + 8, bulletWidth * 3);
    this.registerTexture("sniper-shadow", createSniperShadowSvg(bulletLength, bulletWidth, bulletBackRatio), bulletLength * 1.5 + 8, bulletWidth * 3);
  }

  public drawProjectile(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    scale: number = 1.0,
    rotation: number = 0
  ) {
    this.draw(ctx, key, x, y, scale, rotation);
  }

  public drawShadow(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    scale: number = 1.0,
    rotation: number = 0
  ) {
    const projectileType = key.split("-")[0];
    const shadowKey = `${projectileType}-shadow`;
    this.draw(ctx, shadowKey, x, y, scale, rotation);
  }
}

let projectileSvgSheetInstance: ProjectileSvgSheet | null = null;
let initPromise: Promise<void> | null = null;

export function getProjectileSvgSheet(): ProjectileSvgSheet {
  if (!projectileSvgSheetInstance) {
    projectileSvgSheetInstance = new ProjectileSvgSheet();
  }
  return projectileSvgSheetInstance;
}

export async function initProjectileSvgSheet(): Promise<ProjectileSvgSheet> {
  const sheet = getProjectileSvgSheet();
  if (!initPromise) {
    initPromise = sheet.initialize();
  }
  await initPromise;
  return sheet;
}
