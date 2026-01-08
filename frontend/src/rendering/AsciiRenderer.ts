import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { COLORS, PALETTE } from "../theme/colors";

export interface AsciiCell {
  char: string;
  fg: string;
  bg: string;
  zIndex: number;
}

export interface RenderableEntity {
  x: number;
  y: number;
  char: string;
  fg: string;
  bg?: string;
  zIndex: number;
}

const CHARS = {
  GROUND: ".",
  GROUND_ALT: ",",
  FARM: "=",
  TANK_BODY: "█",
  TANK_TURRET: "▄",
  PROJECTILE: "*",
  MISSILE: "◆",
  ROCKET: "▲",
  GRENADE: "●",
  MOAG: "◉",
  TREE: "♣",
  ROCK: "◊",
  HAY_BALE: "○",
  HEALTH_PACK: "+",
  EXPLOSION: "#",
  EMPTY: " ",
  WALL: "▓",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

function colorToAnsi(hex: string): string {
  const rgb = hexToRgb(hex);
  return `\x1b[38;2;${rgb.r};${rgb.g};${rgb.b}m`;
}

function bgColorToAnsi(hex: string): string {
  const rgb = hexToRgb(hex);
  return `\x1b[48;2;${rgb.r};${rgb.g};${rgb.b}m`;
}

const ANSI_RESET = "\x1b[0m";

export class AsciiRenderer {
  private terminal: Terminal;
  private fitAddon: FitAddon;
  private container: HTMLDivElement | null = null;
  private buffer: AsciiCell[][] = [];
  private cols: number = 0;
  private rows: number = 0;
  private lastRenderedBuffer: string = "";

  private cameraX: number = 0;
  private cameraY: number = 0;

  private charAspectRatio: number = 2.0;

  constructor() {
    this.terminal = new Terminal({
      cursorBlink: false,
      disableStdin: true,
      fontSize: 10,
      fontFamily: "'JetBrains Mono', monospace",
      lineHeight: 1.0,
      letterSpacing: 0,
      theme: {
        background: PALETTE.GROUND_DARK,
        foreground: PALETTE.WHITE_BRIGHT,
        cursor: PALETTE.GROUND_DARK,
      },
      scrollback: 0,
      convertEol: false,
      allowTransparency: false,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
  }

  public mount(container: HTMLDivElement): void {
    this.container = container;
    this.terminal.open(container);
    this.fitAddon.fit();
    this.updateDimensions();

    window.addEventListener("resize", this.handleResize);
  }

  public unmount(): void {
    window.removeEventListener("resize", this.handleResize);
    this.terminal.dispose();
    this.container = null;
  }

  private handleResize = (): void => {
    if (this.container) {
      this.fitAddon.fit();
      this.updateDimensions();
    }
  };

  private updateDimensions(): void {
    this.cols = this.terminal.cols;
    this.rows = this.terminal.rows;
    this.initBuffer();
  }

  private initBuffer(): void {
    this.buffer = [];
    for (let y = 0; y < this.rows; y++) {
      const row: AsciiCell[] = [];
      for (let x = 0; x < this.cols; x++) {
        row.push({
          char: CHARS.EMPTY,
          fg: PALETTE.GROUND_MEDIUM,
          bg: PALETTE.GROUND_DARK,
          zIndex: 0,
        });
      }
      this.buffer.push(row);
    }
  }

  public setWorldDimensions(_width: number, _height: number): void {
  }

  public setCamera(x: number, y: number): void {
    this.cameraX = x;
    this.cameraY = y;
  }

  public clearBuffer(): void {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.buffer[y]?.[x];
        if (cell) {
          cell.char = CHARS.EMPTY;
          cell.fg = PALETTE.GROUND_MEDIUM;
          cell.bg = PALETTE.GROUND_DARK;
          cell.zIndex = 0;
        }
      }
    }
  }

  public worldToScreen(worldX: number, worldY: number): { col: number; row: number } {
    const screenX = worldX - this.cameraX + this.cols / 2 / this.charAspectRatio;
    const screenY = worldY - this.cameraY + this.rows / 2;

    return {
      col: Math.floor(screenX * this.charAspectRatio),
      row: Math.floor(screenY),
    };
  }

  public screenToWorld(col: number, row: number): { x: number; y: number } {
    const worldX = col / this.charAspectRatio + this.cameraX - this.cols / 2 / this.charAspectRatio;
    const worldY = row + this.cameraY - this.rows / 2;

    return { x: worldX, y: worldY };
  }

  public setCell(col: number, row: number, cell: Partial<AsciiCell>): void {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return;
    }

    const existing = this.buffer[row]?.[col];
    if (!existing) return;

    const newZIndex = cell.zIndex ?? 0;
    if (newZIndex >= existing.zIndex) {
      if (cell.char !== undefined) existing.char = cell.char;
      if (cell.fg !== undefined) existing.fg = cell.fg;
      if (cell.bg !== undefined) existing.bg = cell.bg;
      existing.zIndex = newZIndex;
    }
  }

  public drawTerrain(
    baseTerrainLayer: { tag: string }[],
    worldWidth: number,
    worldHeight: number
  ): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const world = this.screenToWorld(col, row);
        const tileX = Math.floor(world.x);
        const tileY = Math.floor(world.y);

        if (tileX < 0 || tileX >= worldWidth || tileY < 0 || tileY >= worldHeight) {
          this.setCell(col, row, {
            char: CHARS.EMPTY,
            fg: PALETTE.GROUND_DARK,
            bg: PALETTE.GROUND_DARK,
            zIndex: 0,
          });
          continue;
        }

        const index = tileY * worldWidth + tileX;
        const terrain = baseTerrainLayer[index];

        const isCheckerDark = (tileX + tileY) % 2 === 0;
        const groundChar = isCheckerDark ? CHARS.GROUND : CHARS.GROUND_ALT;

        if (terrain?.tag === "Farm") {
          this.setCell(col, row, {
            char: CHARS.FARM,
            fg: COLORS.TERRAIN.FARM_GROOVE,
            bg: PALETTE.GROUND_DARK,
            zIndex: 1,
          });
        } else {
          this.setCell(col, row, {
            char: groundChar,
            fg: isCheckerDark ? PALETTE.GROUND_MEDIUM : PALETTE.GROUND_DARK,
            bg: PALETTE.GROUND_DARK,
            zIndex: 1,
          });
        }
      }
    }
  }

  public drawEntity(entity: RenderableEntity): void {
    const screen = this.worldToScreen(entity.x, entity.y);
    this.setCell(screen.col, screen.row, {
      char: entity.char,
      fg: entity.fg,
      bg: entity.bg,
      zIndex: entity.zIndex,
    });
  }

  public drawTank(
    x: number,
    y: number,
    turretRotation: number,
    alliance: number,
    health: number,
    maxHealth: number,
    _name: string,
    targetCode: string
  ): void {
    const screen = this.worldToScreen(x, y);
    const color = alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT : COLORS.GAME.TEAM_BLUE_BRIGHT;
    const darkColor = alliance === 0 ? PALETTE.RED_DARK : PALETTE.BLUE_DARK;

    if (health <= 0) {
      this.setCell(screen.col, screen.row, {
        char: "×",
        fg: PALETTE.SLATE_MEDIUM,
        zIndex: 10,
      });
      return;
    }

    const dx = Math.cos(turretRotation);
    const dy = Math.sin(turretRotation);

    const turretScreen = this.worldToScreen(x + dx * 0.5, y + dy * 0.5);

    const angle = turretRotation * (180 / Math.PI);
    const normalizedAngle = ((angle % 360) + 360) % 360;

    let turretChar = "-";
    if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) turretChar = "\\";
    else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) turretChar = "|";
    else if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) turretChar = "/";
    else if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) turretChar = "-";
    else if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) turretChar = "\\";
    else if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) turretChar = "|";
    else if (normalizedAngle >= 292.5 && normalizedAngle < 337.5) turretChar = "/";

    this.setCell(screen.col, screen.row, {
      char: CHARS.TANK_BODY,
      fg: color,
      zIndex: 100,
    });

    this.setCell(turretScreen.col, turretScreen.row, {
      char: turretChar,
      fg: color,
      zIndex: 101,
    });

    if (targetCode) {
      const labelScreen = this.worldToScreen(x, y - 1);
      for (let i = 0; i < targetCode.length; i++) {
        const charOffset = i - Math.floor(targetCode.length / 2);
        this.setCell(labelScreen.col + charOffset, labelScreen.row, {
          char: targetCode[i],
          fg: COLORS.TERMINAL.WARNING,
          zIndex: 200,
        });
      }
    }

    if (health < maxHealth) {
      const healthPercent = health / maxHealth;
      const healthBarWidth = 5;
      const filledBars = Math.round(healthPercent * healthBarWidth);
      const healthScreen = this.worldToScreen(x, y + 1);

      for (let i = 0; i < healthBarWidth; i++) {
        const charOffset = i - Math.floor(healthBarWidth / 2);
        const isFilled = i < filledBars;
        this.setCell(healthScreen.col + charOffset, healthScreen.row, {
          char: isFilled ? "█" : "░",
          fg: isFilled ? color : darkColor,
          zIndex: 150,
        });
      }
    }
  }

  public drawProjectile(
    x: number,
    y: number,
    projectileType: string,
    alliance: number
  ): void {
    const screen = this.worldToScreen(x, y);
    const color = alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT : COLORS.GAME.TEAM_BLUE_BRIGHT;

    let char = CHARS.PROJECTILE;
    switch (projectileType) {
      case "Missile":
        char = CHARS.MISSILE;
        break;
      case "Rocket":
        char = CHARS.ROCKET;
        break;
      case "Grenade":
        char = CHARS.GRENADE;
        break;
      case "Moag":
        char = CHARS.MOAG;
        break;
    }

    this.setCell(screen.col, screen.row, {
      char,
      fg: color,
      zIndex: 90,
    });
  }

  public drawTerrainDetail(
    x: number,
    y: number,
    detailType: string,
    health?: number
  ): void {
    const screen = this.worldToScreen(x, y);

    let char = CHARS.ROCK;
    let fg = COLORS.TERRAIN.ROCK_BODY;

    switch (detailType) {
      case "Tree":
        char = CHARS.TREE;
        fg = COLORS.TERRAIN.TREE_FOLIAGE;
        break;
      case "Rock":
        char = CHARS.ROCK;
        fg = COLORS.TERRAIN.ROCK_BODY;
        break;
      case "HayBale":
        char = CHARS.HAY_BALE;
        fg = COLORS.TERRAIN.HAY_BALE_BODY;
        break;
    }

    if (health !== undefined && health <= 0) {
      char = "×";
      fg = PALETTE.SLATE_MEDIUM;
    }

    this.setCell(screen.col, screen.row, {
      char,
      fg,
      zIndex: 50,
    });
  }

  public drawPickup(x: number, y: number, pickupType: string): void {
    const screen = this.worldToScreen(x, y);

    let char = CHARS.HEALTH_PACK;
    let fg = COLORS.TERMINAL.SUCCESS;

    switch (pickupType) {
      case "HealthPack":
        char = "+";
        fg = COLORS.TERMINAL.SUCCESS;
        break;
      case "Shield":
        char = "◈";
        fg = COLORS.TERMINAL.INFO;
        break;
    }

    this.setCell(screen.col, screen.row, {
      char,
      fg,
      zIndex: 40,
    });
  }

  public drawExplosion(x: number, y: number, intensity: number): void {
    const screen = this.worldToScreen(x, y);

    const chars = [".", "*", "#", "█"];
    const charIndex = Math.min(Math.floor(intensity * chars.length), chars.length - 1);

    const colors = [PALETTE.ORANGE_MEDIUM, PALETTE.YELLOW_MEDIUM, PALETTE.YELLOW_BRIGHT, PALETTE.WHITE_BRIGHT];
    const colorIndex = Math.min(Math.floor(intensity * colors.length), colors.length - 1);

    this.setCell(screen.col, screen.row, {
      char: chars[charIndex],
      fg: colors[colorIndex],
      zIndex: 200,
    });
  }

  public render(): void {
    let output = "\x1b[H";

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.buffer[row]?.[col];
        if (cell) {
          output += colorToAnsi(cell.fg);
          if (cell.bg && cell.bg !== PALETTE.GROUND_DARK) {
            output += bgColorToAnsi(cell.bg);
          }
          output += cell.char;
          output += ANSI_RESET;
        }
      }
      if (row < this.rows - 1) {
        output += "\r\n";
      }
    }

    if (output !== this.lastRenderedBuffer) {
      this.terminal.write(output);
      this.lastRenderedBuffer = output;
    }
  }

  public getCols(): number {
    return this.cols;
  }

  public getRows(): number {
    return this.rows;
  }

  public getChars(): typeof CHARS {
    return CHARS;
  }
}
