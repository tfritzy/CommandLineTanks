import { PALETTE as PALETTE_CONFIG, UI_COLORS, GAME_COLORS, TERMINAL_COLORS } from './colors.config.js';

export const PALETTE = PALETTE_CONFIG;

export const COLORS = {
  UI: UI_COLORS,

  GAME: {
    ...GAME_COLORS,
  },

  ABILITY: {
    OVERDRIVE_READY: PALETTE.YELLOW_MEDIUM,
    REPAIR_READY: PALETTE.GREEN_SUCCESS,
    SMOKESCREEN_READY: PALETTE.BLUE_CYAN_LIGHT,
    COOLDOWN: PALETTE.SLATE_LIGHT,
  },

  TERRAIN: {
    GROUND: PALETTE.GROUND_DARK,
    FARM_GROOVE: PALETTE.GROUND_MEDIUM,
    GRID: PALETTE.TRANSPARENT_GRID,
    CHECKER: PALETTE.TRANSPARENT_DARK,
    BLACK_CHECKER: PALETTE.SLATE_DARK,
    WHITE_CHECKER: PALETTE.SLATE_LIGHTEST,

    TREE_BASE: PALETTE.BLUE_DARK,
    TREE_FOLIAGE: PALETTE.BLUE_MEDIUM,

    DEAD_TREE_BASE: PALETTE.PURPLE_DARK,
    DEAD_TREE_FOLIAGE: PALETTE.PURPLE_MEDIUM,

    ROCK_BODY: PALETTE.SLATE_MEDIUM,
    ROCK_SHADOW: PALETTE.GROUND_SHADOW,
    ROCK_HIGHLIGHT: PALETTE.GROUND_HIGHLIGHT,
    ROCK_OUTLINE: PALETTE.GROUND_DARK,

    HAY_BALE_BODY: PALETTE.YELLOW_MEDIUM,
    HAY_BALE_RING: PALETTE.ORANGE_MEDIUM,

    FOUNDATION_BASE: PALETTE.SLATE_LIGHT,

    FENCE_RAIL: PALETTE.ORANGE_MEDIUM,
    FENCE_POST: PALETTE.RED_MUTED,

    TARGET_DUMMY_BODY: PALETTE.RED_DARK,
    TARGET_DUMMY_RIM: PALETTE.RED_MUTED,
    TARGET_DUMMY_CENTER: PALETTE.YELLOW_MEDIUM,

    MUSHROOM_CAP: PALETTE.PURPLE_DARK,
    MUSHROOM_SHADOW: PALETTE.TRANSPARENT_SHADOW,
  },

  TERMINAL: TERMINAL_COLORS,

  EFFECTS: {
    FIRE_RED: PALETTE.RED_MUTED,
    FIRE_ORANGE: PALETTE.ORANGE_MEDIUM,
    FIRE_YELLOW: PALETTE.YELLOW_MEDIUM,
    FIRE_BRIGHT: PALETTE.YELLOW_BRIGHT,
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
