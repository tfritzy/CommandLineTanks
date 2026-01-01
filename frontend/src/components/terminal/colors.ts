export const TERMINAL_COLORS = {
  BACKGROUND: "#2a152d",
  BORDER: "#5a78b2",
  
  TEXT_DEFAULT: "#e6eeed",
  TEXT_MUTED: "#a9bcbf",
  TEXT_DIM: "#707b89",
  
  PROMPT: "#96dc7f",
  
  SUCCESS: "#96dc7f",
  INFO: "#7396d5",
  WARNING: "#fceba8",
  ERROR: "#c06852",
  
  COMMAND: "#7fbbdc",
  ARGUMENT: "#d5f893",
  VALUE: "#fceba8",
  
  DIRECTION_SYMBOL: "#7396d5",
  TANK_CODE: "#aaeeea",
  
  COOLDOWN: "#e39764",
  HEALTH: "#9d4343",
  
  HEADER_TEXT: "#e6eeed",
  SEPARATOR: "#4a4b5b",
} as const;

export type TerminalColorName = keyof typeof TERMINAL_COLORS;

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

export function colorize(text: string, colorName: TerminalColorName): string {
  const color = TERMINAL_COLORS[colorName];
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
