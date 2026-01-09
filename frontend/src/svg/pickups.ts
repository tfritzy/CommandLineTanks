import { COLORS } from "../theme/colors";
import { UNIT_TO_PIXEL } from "../constants";
import { SvgTextureSheet } from "./svg-cache";

function createHealthPackSvg(): string {
  const size = UNIT_TO_PIXEL * 1.2;
  const cx = size / 2;
  const cy = size / 2;
  const radius = UNIT_TO_PIXEL * 0.3;
  const crossSize = radius * 0.8;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx - 4}" cy="${cy + 4}" r="${radius}" fill="rgba(0,0,0,0.3)"/>
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${COLORS.GAME.HEALTH_PACK_PRIMARY}" stroke="${COLORS.GAME.HEALTH_PACK_SECONDARY}" stroke-width="3"/>
    <line x1="${cx}" y1="${cy - crossSize / 2}" x2="${cx}" y2="${cy + crossSize / 2}" stroke="${COLORS.UI.TEXT_PRIMARY}" stroke-width="4" stroke-linecap="round"/>
    <line x1="${cx - crossSize / 2}" y1="${cy}" x2="${cx + crossSize / 2}" y2="${cy}" stroke="${COLORS.UI.TEXT_PRIMARY}" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

function createShieldPickupSvg(): string {
  const size = UNIT_TO_PIXEL * 1.2;
  const cx = size / 2;
  const cy = size / 2;
  const radius = UNIT_TO_PIXEL * 0.3;
  const shieldSize = radius;
  const shieldTop = -shieldSize * 0.5;
  const shieldBottom = shieldSize * 0.5;
  const shieldLeft = -shieldSize * 0.4;
  const shieldRight = shieldSize * 0.4;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx - 4}" cy="${cy + 4}" r="${radius}" fill="rgba(0,0,0,0.3)"/>
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${COLORS.GAME.SHIELD_PRIMARY}" stroke="${COLORS.GAME.SHIELD_STROKE}" stroke-width="3"/>
    <path d="M ${cx} ${cy + shieldTop}
             L ${cx + shieldRight} ${cy + shieldTop + shieldSize * 0.2}
             L ${cx + shieldRight} ${cy + shieldBottom - shieldSize * 0.15}
             L ${cx} ${cy + shieldBottom}
             L ${cx + shieldLeft} ${cy + shieldBottom - shieldSize * 0.15}
             L ${cx + shieldLeft} ${cy + shieldTop + shieldSize * 0.2}
             Z" 
          fill="${COLORS.UI.TEXT_PRIMARY}" stroke="${COLORS.GAME.SHIELD_STROKE}" stroke-width="2"/>
  </svg>`;
}

function createUnknownPickupSvg(): string {
  const size = UNIT_TO_PIXEL * 1.2;
  const cx = size / 2;
  const cy = size / 2;
  const radius = UNIT_TO_PIXEL * 0.3;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx - 4}" cy="${cy + 4}" r="${radius}" fill="rgba(0,0,0,0.3)"/>
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${COLORS.TERMINAL.TEXT_MUTED}" stroke="${COLORS.TERMINAL.TEXT_DIM}" stroke-width="3"/>
    <text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="${COLORS.UI.TEXT_PRIMARY}" font-family="monospace" font-weight="bold" font-size="20">?</text>
  </svg>`;
}

function createNormalProjectilePickupSvg(color: string): string {
  const size = UNIT_TO_PIXEL * 1.2;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 0.1 * UNIT_TO_PIXEL;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx - 4}" cy="${cy + 4}" r="${radius}" fill="rgba(0,0,0,0.3)"/>
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" stroke="${COLORS.UI.BLACK}" stroke-width="1"/>
  </svg>`;
}

function createTripleShooterPickupSvg(color: string): string {
  const size = UNIT_TO_PIXEL * 1.2;
  const cx = size / 2;
  const cy = size / 2;
  const triangleSpacing = 0.15 * UNIT_TO_PIXEL;
  const cos30 = Math.sqrt(3) / 2;
  const sin30 = 0.5;
  const radius = 0.08 * UNIT_TO_PIXEL;
  
  const positions = [
    { x: 0, y: triangleSpacing },
    { x: -triangleSpacing * cos30, y: -triangleSpacing * sin30 },
    { x: triangleSpacing * cos30, y: -triangleSpacing * sin30 },
  ];
  
  let circles = "";
  for (const pos of positions) {
    circles += `<circle cx="${cx + pos.x - 4}" cy="${cy + pos.y + 4}" r="${radius}" fill="rgba(0,0,0,0.3)"/>`;
  }
  for (const pos of positions) {
    circles += `<circle cx="${cx + pos.x}" cy="${cy + pos.y}" r="${radius}" fill="${color}" stroke="${COLORS.UI.BLACK}" stroke-width="1"/>`;
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${circles}</svg>`;
}

function createMissilePickupSvg(color: string): string {
  const size = UNIT_TO_PIXEL * 1.2;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 0.2 * UNIT_TO_PIXEL;
  const angle = -Math.PI / 4;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const flameLength = radius * 1 + 0.5;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${cx}, ${cy})">
      <g transform="translate(-4, 4)">
        <polygon points="${radius * 2 * cos},${radius * 2 * sin} ${-radius * 0.8 * sin},${radius * 0.8 * cos} ${radius * 0.8 * sin},${-radius * 0.8 * cos}" fill="rgba(0,0,0,0.3)"/>
      </g>
      <polygon points="${-flameLength * cos},${-flameLength * sin} ${-radius * 0.3 * sin},${radius * 0.3 * cos} ${radius * 0.3 * sin},${-radius * 0.3 * cos}" fill="${COLORS.EFFECTS.FIRE_YELLOW}"/>
      <polygon points="${radius * 2 * cos},${radius * 2 * sin} ${-radius * 0.8 * sin},${radius * 0.8 * cos} ${radius * 0.8 * sin},${-radius * 0.8 * cos}" fill="${color}"/>
    </g>
  </svg>`;
}

function createRocketPickupSvg(color: string): string {
  const size = UNIT_TO_PIXEL * 1.2;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 0.1 * UNIT_TO_PIXEL;
  const angleDeg = -45;
  const flameLength = radius * 2;
  const rx = radius * 3;
  const ry = radius * 1.2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${cx}, ${cy}) rotate(${angleDeg})">
      <g transform="translate(-4, 4)">
        <path d="M 0 ${-ry} A ${rx} ${ry} 0 0 1 0 ${ry} L 0 ${ry} L 0 ${-ry} Z" fill="rgba(0,0,0,0.3)"/>
      </g>
      <polygon points="${-flameLength},0 0,${-radius * 0.4} 0,${radius * 0.4}" fill="${COLORS.EFFECTS.FIRE_YELLOW}"/>
      <path d="M 0 ${-ry} A ${rx} ${ry} 0 0 1 0 ${ry} L 0 ${ry} L 0 ${-ry} Z" fill="${color}"/>
    </g>
  </svg>`;
}

function createGrenadePickupSvg(color: string): string {
  const size = UNIT_TO_PIXEL * 1.2;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 0.2 * UNIT_TO_PIXEL;
  const pinWidth = radius * 0.3;
  const pinHeight = radius * 0.4;
  const pinY = -radius * 1.1;
  const ringRadius = radius * 0.25;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${cx}, ${cy})">
      <g transform="translate(-4, 4)">
        <ellipse cx="0" cy="0" rx="${radius}" ry="${radius * 1.1}" fill="rgba(0,0,0,0.3)"/>
        <rect x="${-pinWidth / 2}" y="${pinY - pinHeight}" width="${pinWidth}" height="${pinHeight}" fill="rgba(0,0,0,0.3)"/>
        <circle cx="${pinWidth / 2}" cy="${pinY - pinHeight / 2}" r="${ringRadius}" fill="rgba(0,0,0,0.3)"/>
      </g>
      <ellipse cx="0" cy="0" rx="${radius}" ry="${radius * 1.1}" fill="${color}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="${Math.max(1, radius * 0.15)}"/>
      <line x1="${-radius}" y1="0" x2="${radius}" y2="0" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="${Math.max(1, radius * 0.15)}"/>
      <rect x="${-pinWidth / 2}" y="${pinY - pinHeight}" width="${pinWidth}" height="${pinHeight}" fill="${COLORS.GAME.PROJECTILE_OUTLINE}"/>
      <circle cx="${pinWidth / 2}" cy="${pinY - pinHeight / 2}" r="${ringRadius}" fill="${COLORS.GAME.PROJECTILE_METAL}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="${Math.max(0.5, radius * 0.1)}"/>
    </g>
  </svg>`;
}

function createBoomerangPickupSvg(color: string): string {
  const size = UNIT_TO_PIXEL * 1.2;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 0.18 * UNIT_TO_PIXEL;
  const armWidth = radius * 0.8;
  const armLength = radius * 2.2;
  
  function createArm(rotation: number, offsetX: number, offsetY: number, fill: string, stroke?: string): string {
    const rad = (rotation * Math.PI * 2) / 3;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    const p2x = offsetX + armLength * cos - (-armWidth * 0.4) * sin;
    const p2y = offsetY + armLength * sin + (-armWidth * 0.4) * cos;
    const ctrlX = offsetX + (armLength * 1.1) * cos;
    const ctrlY = offsetY + (armLength * 1.1) * sin;
    const p3x = offsetX + armLength * cos - (armWidth * 0.4) * sin;
    const p3y = offsetY + armLength * sin + (armWidth * 0.4) * cos;
    
    const strokeAttr = stroke ? `stroke="${stroke}" stroke-width="2" stroke-linejoin="round"` : "";
    return `<path d="M ${offsetX} ${offsetY} L ${p2x} ${p2y} Q ${ctrlX} ${ctrlY} ${p3x} ${p3y} Z" fill="${fill}" ${strokeAttr}/>`;
  }
  
  let paths = "";
  for (let i = 0; i < 3; i++) {
    paths += createArm(i, cx - 4, cy + 4, "rgba(0,0,0,0.3)");
  }
  paths += `<circle cx="${cx - 4}" cy="${cy + 4}" r="${armWidth * 0.5}" fill="rgba(0,0,0,0.3)"/>`;
  for (let i = 0; i < 3; i++) {
    paths += createArm(i, cx, cy, color, COLORS.GAME.PROJECTILE_OUTLINE);
  }
  paths += `<circle cx="${cx}" cy="${cy}" r="${armWidth * 0.5}" fill="${color}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="2"/>`;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths}</svg>`;
}

function createMoagPickupSvg(color: string): string {
  const size = UNIT_TO_PIXEL * 1.2;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 0.3 * UNIT_TO_PIXEL;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx - 4}" cy="${cy + 4}" r="${radius}" fill="rgba(0,0,0,0.3)"/>
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" stroke="${COLORS.UI.BLACK}" stroke-width="1"/>
  </svg>`;
}

function createSniperPickupSvg(color: string): string {
  const size = UNIT_TO_PIXEL * 1.2;
  const cx = size / 2;
  const cy = size / 2;
  const bulletLength = 0.4 * UNIT_TO_PIXEL;
  const bulletWidth = bulletLength * 0.3;
  const bulletBackRatio = 0.4;
  const angle = -45;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${cx}, ${cy})">
      <g transform="translate(-4, 4) rotate(${angle})">
        <path d="M ${bulletLength} 0
                 C ${bulletLength * 0.8} ${-bulletWidth * 0.2} ${bulletLength * 0.4} ${-bulletWidth} 0 ${-bulletWidth}
                 L ${-bulletLength * bulletBackRatio} ${-bulletWidth}
                 L ${-bulletLength * bulletBackRatio} ${bulletWidth}
                 L 0 ${bulletWidth}
                 C ${bulletLength * 0.4} ${bulletWidth} ${bulletLength * 0.8} ${bulletWidth * 0.2} ${bulletLength} 0
                 Z"
              fill="rgba(0,0,0,0.3)"/>
      </g>
      <g transform="rotate(${angle})">
        <path d="M 0 ${-bulletWidth}
                 L ${-bulletLength * bulletBackRatio} ${-bulletWidth}
                 L ${-bulletLength * bulletBackRatio} ${-bulletWidth * 1.1}
                 L ${-bulletLength * (bulletBackRatio + 0.05)} ${-bulletWidth * 1.1}
                 L ${-bulletLength * (bulletBackRatio + 0.05)} ${bulletWidth * 1.1}
                 L ${-bulletLength * bulletBackRatio} ${bulletWidth * 1.1}
                 L ${-bulletLength * bulletBackRatio} ${bulletWidth}
                 L 0 ${bulletWidth}
                 Z" 
              fill="${color}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="1"/>
        <path d="M ${bulletLength} 0
                 C ${bulletLength * 0.8} ${-bulletWidth * 0.2} ${bulletLength * 0.4} ${-bulletWidth} 0 ${-bulletWidth}
                 L 0 ${bulletWidth}
                 C ${bulletLength * 0.4} ${bulletWidth} ${bulletLength * 0.8} ${bulletWidth * 0.2} ${bulletLength} 0
                 Z"
              fill="${color}" stroke="${COLORS.GAME.PROJECTILE_OUTLINE}" stroke-width="1"/>
      </g>
    </g>
  </svg>`;
}

export class PickupSvgSheet extends SvgTextureSheet {
  private pickupColor: string;

  constructor(pickupColor: string) {
    super();
    this.pickupColor = pickupColor;
    this.registerAllPickups();
  }

  private registerAllPickups() {
    const size = UNIT_TO_PIXEL * 1.2;
    
    this.registerTexture("Health", createHealthPackSvg(), size, size);
    this.registerTexture("Shield", createShieldPickupSvg(), size, size);
    this.registerTexture("Unknown", createUnknownPickupSvg(), size, size);
    this.registerTexture("Base", createNormalProjectilePickupSvg(this.pickupColor), size, size);
    this.registerTexture("TripleShooter", createTripleShooterPickupSvg(this.pickupColor), size, size);
    this.registerTexture("MissileLauncher", createMissilePickupSvg(this.pickupColor), size, size);
    this.registerTexture("Rocket", createRocketPickupSvg(this.pickupColor), size, size);
    this.registerTexture("Grenade", createGrenadePickupSvg(this.pickupColor), size, size);
    this.registerTexture("Boomerang", createBoomerangPickupSvg(this.pickupColor), size, size);
    this.registerTexture("Moag", createMoagPickupSvg(this.pickupColor), size, size);
    this.registerTexture("Sniper", createSniperPickupSvg(this.pickupColor), size, size);
  }
}

let redTeamPickupSheetInstance: PickupSvgSheet | null = null;
let blueTeamPickupSheetInstance: PickupSvgSheet | null = null;
let redInitPromise: Promise<void> | null = null;
let blueInitPromise: Promise<void> | null = null;

export function getRedTeamPickupSvgSheet(): PickupSvgSheet {
  if (!redTeamPickupSheetInstance) {
    redTeamPickupSheetInstance = new PickupSvgSheet(COLORS.GAME.TEAM_RED_BRIGHT);
  }
  return redTeamPickupSheetInstance;
}

export function getBlueTeamPickupSvgSheet(): PickupSvgSheet {
  if (!blueTeamPickupSheetInstance) {
    blueTeamPickupSheetInstance = new PickupSvgSheet(COLORS.GAME.TEAM_BLUE_BRIGHT);
  }
  return blueTeamPickupSheetInstance;
}

export async function initPickupSvgSheets(): Promise<void> {
  const redSheet = getRedTeamPickupSvgSheet();
  const blueSheet = getBlueTeamPickupSvgSheet();
  
  if (!redInitPromise) {
    redInitPromise = redSheet.initialize();
  }
  if (!blueInitPromise) {
    blueInitPromise = blueSheet.initialize();
  }
  
  await Promise.all([redInitPromise, blueInitPromise]);
}
