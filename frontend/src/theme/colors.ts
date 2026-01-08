import { PALETTE as PALETTE_CONFIG, UI_COLORS, GAME_COLORS, TERMINAL_COLORS } from './colors.config.js';

export const PALETTE = PALETTE_CONFIG;

const NEON_PINK = "#ff00aa";
const NEON_CYAN = "#00ffff";
const NEON_GREEN = "#00ff66";
const NEON_YELLOW = "#ffff00";
const NEON_ORANGE = "#ff6600";
const NEON_PURPLE = "#aa00ff";

export const COLORS = {
  UI: UI_COLORS,

  GAME: {
    ...GAME_COLORS,
  },

  ABILITY: {
    OVERDRIVE_READY: NEON_YELLOW,
    REPAIR_READY: NEON_GREEN,
    SMOKESCREEN_READY: NEON_CYAN,
    COOLDOWN: NEON_CYAN,
  },

  TERRAIN: {
    GROUND: PALETTE.GROUND_DARK,
    FARM_GROOVE: PALETTE.GROUND_MEDIUM,
    GRID: PALETTE.TRANSPARENT_GRID,
    CHECKER: PALETTE.TRANSPARENT_DARK,

    TREE_BASE: NEON_GREEN,
    TREE_FOLIAGE: NEON_GREEN,

    DEAD_TREE_BASE: NEON_PURPLE,
    DEAD_TREE_FOLIAGE: NEON_PURPLE,

    ROCK_BODY: PALETTE.BLACK_PURE,
    ROCK_SHADOW: PALETTE.BLACK_PURE,
    ROCK_HIGHLIGHT: PALETTE.BLACK_PURE,
    ROCK_OUTLINE: NEON_CYAN,

    HAY_BALE_BODY: PALETTE.BLACK_PURE,
    HAY_BALE_RING: NEON_YELLOW,

    FOUNDATION_BASE: NEON_CYAN,

    FENCE_RAIL: NEON_ORANGE,
    FENCE_POST: NEON_ORANGE,

    TARGET_DUMMY_BODY: PALETTE.BLACK_PURE,
    TARGET_DUMMY_RIM: NEON_PINK,
    TARGET_DUMMY_CENTER: NEON_YELLOW,

    MUSHROOM_CAP: NEON_PURPLE,
    MUSHROOM_SHADOW: PALETTE.TRANSPARENT_SHADOW,
  },

  TERMINAL: TERMINAL_COLORS,

  EFFECTS: {
    FIRE_RED: NEON_PINK,
    FIRE_ORANGE: NEON_ORANGE,
    FIRE_YELLOW: NEON_YELLOW,
    FIRE_BRIGHT: PALETTE.WHITE_PURE,
  },
} as const;

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

const ANSI_RESET = "\x1b[0m";

export type TerminalColorKey = keyof typeof COLORS.TERMINAL;

export function colorize(text: string, colorKey: TerminalColorKey): string {
  const color = COLORS.TERMINAL[colorKey];
  const ansiColor = colorToAnsi(color);
  return `${ansiColor}${text}${ANSI_RESET}`;
}

export function success(text: string): string {
  return colorize(text, 'SUCCESS');
}

export function info(text: string): string {
  return colorize(text, 'INFO');
}

export function warning(text: string): string {
  return colorize(text, 'WARNING');
}

export function error(text: string): string {
  return colorize(text, 'ERROR');
}

export function command(text: string): string {
  return colorize(text, 'COMMAND');
}

export function argument(text: string): string {
  return colorize(text, 'ARGUMENT');
}

export function value(text: string): string {
  return colorize(text, 'VALUE');
}

export function muted(text: string): string {
  return colorize(text, 'TEXT_MUTED');
}

export function dim(text: string): string {
  return colorize(text, 'TEXT_DIM');
}
