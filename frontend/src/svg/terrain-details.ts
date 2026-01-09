import { COLORS } from "../theme/colors";
import { UNIT_TO_PIXEL, TERRAIN_DETAIL_RADIUS } from "../constants";
import { SvgTextureSheet } from "./svg-cache";

function createRockSvg(radius: number): string {
  const size = radius * 3;
  const cx = size / 2;
  const cy = size / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <clipPath id="rockClip">
        <circle cx="${cx}" cy="${cy}" r="${radius}"/>
      </clipPath>
    </defs>
    <g clip-path="url(#rockClip)">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${COLORS.TERRAIN.ROCK_BODY}"/>
      <circle cx="${cx - radius * 0.15}" cy="${cy + radius * 0.15}" r="${radius}" fill="${COLORS.TERRAIN.ROCK_SHADOW}"/>
      <circle cx="${cx + radius * 0.15}" cy="${cy - radius * 0.15}" r="${radius}" fill="${COLORS.TERRAIN.ROCK_HIGHLIGHT}"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${COLORS.TERRAIN.ROCK_OUTLINE}" stroke-width="1.5"/>
  </svg>`;
}

function createRockShadowSvg(radius: number): string {
  const size = radius * 3;
  const shadowOffset = 6;
  const cx = size / 2 - shadowOffset;
  const cy = size / 2 + shadowOffset;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="rgba(0,0,0,0.3)"/>
  </svg>`;
}

function createTreeSvg(radius: number): string {
  const size = radius * 3;
  const cx = size / 2;
  const cy = size / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <clipPath id="treeClip">
        <circle cx="${cx}" cy="${cy}" r="${radius}"/>
      </clipPath>
    </defs>
    <g clip-path="url(#treeClip)">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${COLORS.TERRAIN.TREE_BASE}"/>
      <circle cx="${cx + radius * 0.4}" cy="${cy - radius * 0.4}" r="${radius * 1.3}" fill="${COLORS.TERRAIN.TREE_FOLIAGE}"/>
    </g>
  </svg>`;
}

function createTreeShadowSvg(radius: number): string {
  const size = radius * 3;
  const shadowOffsetX = -radius * 0.4;
  const shadowOffsetY = radius * 0.4;
  const cx = size / 2 + shadowOffsetX;
  const cy = size / 2 + shadowOffsetY;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="rgba(0,0,0,0.3)"/>
  </svg>`;
}

function createHayBaleSvg(radius: number): string {
  const size = radius * 3;
  const cx = size / 2;
  const cy = size / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${COLORS.TERRAIN.HAY_BALE_BODY}"/>
    <circle cx="${cx}" cy="${cy}" r="${radius * 0.7}" fill="none" stroke="${COLORS.TERRAIN.HAY_BALE_RING}" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${radius * 0.4}" fill="none" stroke="${COLORS.TERRAIN.HAY_BALE_RING}" stroke-width="2"/>
  </svg>`;
}

function createHayBaleShadowSvg(radius: number): string {
  const size = radius * 3;
  const offset = UNIT_TO_PIXEL * 0.15;
  const cx = size / 2 - offset;
  const cy = size / 2 + offset;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="rgba(0,0,0,0.3)"/>
  </svg>`;
}

function createTargetDummySvg(): string {
  const radius = UNIT_TO_PIXEL * 0.4;
  const size = radius * 3;
  const cx = size / 2;
  const cy = size / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${UNIT_TO_PIXEL * 0.4}" fill="${COLORS.TERRAIN.TARGET_DUMMY_BODY}" stroke="${COLORS.TERRAIN.TARGET_DUMMY_RIM}" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${UNIT_TO_PIXEL * 0.25}" fill="${COLORS.TERRAIN.TARGET_DUMMY_RIM}"/>
    <circle cx="${cx}" cy="${cy}" r="${UNIT_TO_PIXEL * 0.1}" fill="${COLORS.TERRAIN.TARGET_DUMMY_CENTER}"/>
  </svg>`;
}

function createTargetDummyShadowSvg(): string {
  const radius = UNIT_TO_PIXEL * 0.4;
  const size = radius * 3;
  const shadowOffset = UNIT_TO_PIXEL * 0.1;
  const cx = size / 2 - shadowOffset;
  const cy = size / 2 + shadowOffset;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${UNIT_TO_PIXEL * 0.4}" fill="rgba(0,0,0,0.35)"/>
  </svg>`;
}

function createFenceEdgeSvg(rotation: number): string {
  const size = UNIT_TO_PIXEL * 2;
  const cx = size / 2;
  const cy = size / 2;
  const angle = rotation * 90;
  
  const railWidth = UNIT_TO_PIXEL * 0.05;
  const slatHeight = UNIT_TO_PIXEL * 0.035;
  const barWidth = railWidth + slatHeight;
  const postSize = UNIT_TO_PIXEL * 0.22;
  const topSize = postSize * 0.7;
  
  const barY = -barWidth / 2;
  const barLength = UNIT_TO_PIXEL;
  
  const postColor = COLORS.TERRAIN.FENCE_POST;
  const topColor = "#d08963";
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${cx}, ${cy}) rotate(${angle})">
      <rect x="${-UNIT_TO_PIXEL * 0.5}" y="${barY}" width="${barLength}" height="${barWidth}" fill="${postColor}"/>
    </g>
    <rect x="${cx - postSize / 2}" y="${cy - postSize / 2}" width="${postSize}" height="${postSize}" fill="${postColor}"/>
    <rect x="${cx - topSize / 2}" y="${cy - topSize / 2}" width="${topSize}" height="${topSize}" fill="${topColor}"/>
  </svg>`;
}

function createFenceEdgeShadowSvg(rotation: number): string {
  const size = UNIT_TO_PIXEL * 2;
  const cx = size / 2;
  const cy = size / 2;
  const shadowOffset = UNIT_TO_PIXEL * 0.10;
  const angle = rotation * 90;
  
  const railWidth = UNIT_TO_PIXEL * 0.05;
  const slatHeight = UNIT_TO_PIXEL * 0.035;
  const barWidth = railWidth + slatHeight;
  const postSize = UNIT_TO_PIXEL * 0.22;
  
  const barY = -barWidth / 2;
  const barLength = UNIT_TO_PIXEL;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect x="${cx - postSize / 2 - shadowOffset}" y="${cy - postSize / 2 + shadowOffset}" width="${postSize}" height="${postSize}" fill="rgba(0,0,0,0.25)"/>
    <g transform="translate(${cx - shadowOffset}, ${cy + shadowOffset}) rotate(${angle})">
      <rect x="${-UNIT_TO_PIXEL * 0.5}" y="${barY}" width="${barLength}" height="${barWidth}" fill="rgba(0,0,0,0.25)"/>
    </g>
  </svg>`;
}

function createFenceCornerSvg(rotation: number): string {
  const size = UNIT_TO_PIXEL * 2;
  const cx = size / 2;
  const cy = size / 2;
  const angle = rotation * 90;
  
  const railWidth = UNIT_TO_PIXEL * 0.05;
  const slatHeight = UNIT_TO_PIXEL * 0.035;
  const totalHeight = railWidth + slatHeight;
  const postSize = UNIT_TO_PIXEL * 0.22;
  const topSize = postSize * 0.7;
  
  const postColor = COLORS.TERRAIN.FENCE_POST;
  const topColor = "#d08963";
  
  const hSlatY = -totalHeight / 2;
  const vSlatX = -totalHeight / 2;
  const barLength = UNIT_TO_PIXEL * 0.5 + totalHeight / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${cx}, ${cy}) rotate(${angle})">
      <rect x="${vSlatX}" y="${hSlatY}" width="${barLength}" height="${totalHeight}" fill="${postColor}"/>
      <rect x="${vSlatX}" y="${hSlatY}" width="${totalHeight}" height="${barLength}" fill="${postColor}"/>
    </g>
    <rect x="${cx - postSize / 2}" y="${cy - postSize / 2}" width="${postSize}" height="${postSize}" fill="${postColor}"/>
    <rect x="${cx - topSize / 2}" y="${cy - topSize / 2}" width="${topSize}" height="${topSize}" fill="${topColor}"/>
  </svg>`;
}

function createFenceCornerShadowSvg(rotation: number): string {
  const size = UNIT_TO_PIXEL * 2;
  const cx = size / 2;
  const cy = size / 2;
  const shadowOffset = UNIT_TO_PIXEL * 0.10;
  const angle = rotation * 90;
  
  const railWidth = UNIT_TO_PIXEL * 0.05;
  const slatHeight = UNIT_TO_PIXEL * 0.035;
  const totalHeight = railWidth + slatHeight;
  const postSize = UNIT_TO_PIXEL * 0.22;
  
  const hSlatY = -totalHeight / 2;
  const vSlatX = -totalHeight / 2;
  const barLength = UNIT_TO_PIXEL * 0.5 + totalHeight / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect x="${cx - postSize / 2 - shadowOffset}" y="${cy - postSize / 2 + shadowOffset}" width="${postSize}" height="${postSize}" fill="rgba(0,0,0,0.25)"/>
    <g transform="translate(${cx - shadowOffset}, ${cy + shadowOffset}) rotate(${angle})">
      <rect x="${vSlatX}" y="${hSlatY}" width="${barLength}" height="${totalHeight}" fill="rgba(0,0,0,0.25)"/>
      <rect x="${vSlatX}" y="${hSlatY}" width="${totalHeight}" height="${barLength}" fill="rgba(0,0,0,0.25)"/>
    </g>
  </svg>`;
}

function createFoundationEdgeSvg(rotation: number): string {
  const size = UNIT_TO_PIXEL * 2;
  const cx = size / 2;
  const cy = size / 2;
  const angle = rotation * 90;
  
  const width = UNIT_TO_PIXEL;
  const height = UNIT_TO_PIXEL * 0.3;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${cx}, ${cy}) rotate(${angle})">
      <rect x="${-UNIT_TO_PIXEL * 0.5}" y="${-height / 2}" width="${width}" height="${height}" fill="${COLORS.TERRAIN.FOUNDATION_BASE}"/>
    </g>
  </svg>`;
}

function createFoundationEdgeShadowSvg(rotation: number): string {
  const size = UNIT_TO_PIXEL * 2;
  const cx = size / 2;
  const cy = size / 2;
  const shadowOffset = UNIT_TO_PIXEL * 0.08;
  const angle = rotation * 90;
  
  const width = UNIT_TO_PIXEL;
  const height = UNIT_TO_PIXEL * 0.3;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${cx - shadowOffset}, ${cy + shadowOffset}) rotate(${angle})">
      <rect x="${-UNIT_TO_PIXEL * 0.5}" y="${-height / 2}" width="${width}" height="${height}" fill="rgba(0,0,0,0.3)"/>
    </g>
  </svg>`;
}

function createFoundationCornerSvg(rotation: number): string {
  const size = UNIT_TO_PIXEL * 2;
  const cx = size / 2;
  const cy = size / 2;
  const angle = rotation * 90;
  
  const u = UNIT_TO_PIXEL;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${cx}, ${cy}) rotate(${angle})">
      <path d="M ${-u * 0.15} ${-u * 0.15}
               L ${u * 0.5} ${-u * 0.15}
               L ${u * 0.5} ${u * 0.15}
               L ${u * 0.15} ${u * 0.15}
               L ${u * 0.15} ${u * 0.5}
               L ${-u * 0.15} ${u * 0.5}
               Z" 
            fill="${COLORS.TERRAIN.FOUNDATION_BASE}"/>
    </g>
  </svg>`;
}

function createFoundationCornerShadowSvg(rotation: number): string {
  const size = UNIT_TO_PIXEL * 2;
  const cx = size / 2;
  const cy = size / 2;
  const shadowOffset = UNIT_TO_PIXEL * 0.08;
  const angle = rotation * 90;
  
  const u = UNIT_TO_PIXEL;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${cx - shadowOffset}, ${cy + shadowOffset}) rotate(${angle})">
      <path d="M ${-u * 0.15} ${-u * 0.15}
               L ${u * 0.5} ${-u * 0.15}
               L ${u * 0.5} ${u * 0.15}
               L ${u * 0.15} ${u * 0.15}
               L ${u * 0.15} ${u * 0.5}
               L ${-u * 0.15} ${u * 0.5}
               Z" 
            fill="rgba(0,0,0,0.3)"/>
    </g>
  </svg>`;
}

export class TerrainDetailSvgSheet extends SvgTextureSheet {
  constructor() {
    super();
    this.registerAllTerrainDetails();
  }

  private registerAllTerrainDetails() {
    const rockRadius = UNIT_TO_PIXEL * TERRAIN_DETAIL_RADIUS.ROCK;
    const treeRadius = UNIT_TO_PIXEL * TERRAIN_DETAIL_RADIUS.TREE;
    const hayBaleRadius = UNIT_TO_PIXEL * TERRAIN_DETAIL_RADIUS.HAY_BALE;
    
    this.registerTexture("rock", createRockSvg(rockRadius), rockRadius * 3, rockRadius * 3);
    this.registerTexture("rock-shadow", createRockShadowSvg(rockRadius), rockRadius * 3, rockRadius * 3);
    
    this.registerTexture("tree", createTreeSvg(treeRadius), treeRadius * 3, treeRadius * 3);
    this.registerTexture("tree-shadow", createTreeShadowSvg(treeRadius), treeRadius * 3, treeRadius * 3);
    
    this.registerTexture("haybale", createHayBaleSvg(hayBaleRadius), hayBaleRadius * 3, hayBaleRadius * 3);
    this.registerTexture("haybale-shadow", createHayBaleShadowSvg(hayBaleRadius), hayBaleRadius * 3, hayBaleRadius * 3);
    
    this.registerTexture("targetdummy", createTargetDummySvg(), UNIT_TO_PIXEL * 1.2, UNIT_TO_PIXEL * 1.2);
    this.registerTexture("targetdummy-shadow", createTargetDummyShadowSvg(), UNIT_TO_PIXEL * 1.2, UNIT_TO_PIXEL * 1.2);
    
    for (let rot = 0; rot < 4; rot++) {
      this.registerTexture(`fenceedge-${rot}`, createFenceEdgeSvg(rot), UNIT_TO_PIXEL * 2, UNIT_TO_PIXEL * 2);
      this.registerTexture(`fenceedge-${rot}-shadow`, createFenceEdgeShadowSvg(rot), UNIT_TO_PIXEL * 2, UNIT_TO_PIXEL * 2);
      
      this.registerTexture(`fencecorner-${rot}`, createFenceCornerSvg(rot), UNIT_TO_PIXEL * 2, UNIT_TO_PIXEL * 2);
      this.registerTexture(`fencecorner-${rot}-shadow`, createFenceCornerShadowSvg(rot), UNIT_TO_PIXEL * 2, UNIT_TO_PIXEL * 2);
      
      this.registerTexture(`foundationedge-${rot}`, createFoundationEdgeSvg(rot), UNIT_TO_PIXEL * 2, UNIT_TO_PIXEL * 2);
      this.registerTexture(`foundationedge-${rot}-shadow`, createFoundationEdgeShadowSvg(rot), UNIT_TO_PIXEL * 2, UNIT_TO_PIXEL * 2);
      
      this.registerTexture(`foundationcorner-${rot}`, createFoundationCornerSvg(rot), UNIT_TO_PIXEL * 2, UNIT_TO_PIXEL * 2);
      this.registerTexture(`foundationcorner-${rot}-shadow`, createFoundationCornerShadowSvg(rot), UNIT_TO_PIXEL * 2, UNIT_TO_PIXEL * 2);
    }
  }

  public getShadowTexture(key: string) {
    if (key.includes("-shadow")) {
      return this.getTexture(key);
    }
    return this.getTexture(`${key}-shadow`);
  }
}

let terrainDetailSvgSheetInstance: TerrainDetailSvgSheet | null = null;
let initPromise: Promise<void> | null = null;

export function getTerrainDetailSvgSheet(): TerrainDetailSvgSheet {
  if (!terrainDetailSvgSheetInstance) {
    terrainDetailSvgSheetInstance = new TerrainDetailSvgSheet();
  }
  return terrainDetailSvgSheetInstance;
}

export async function initTerrainDetailSvgSheet(): Promise<TerrainDetailSvgSheet> {
  const sheet = getTerrainDetailSvgSheet();
  if (!initPromise) {
    initPromise = sheet.initialize();
  }
  await initPromise;
  return sheet;
}
