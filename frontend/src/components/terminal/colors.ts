import { COLORS, colorize as themeColorize, type TerminalColorKey } from "../../theme/colors";

export const TERMINAL_COLORS = {
  BACKGROUND: COLORS.TERMINAL.BACKGROUND,
  BORDER: COLORS.TERMINAL.BORDER,
  
  TEXT_DEFAULT: COLORS.TERMINAL.TEXT_DEFAULT,
  TEXT_MUTED: COLORS.TERMINAL.TEXT_MUTED,
  TEXT_DIM: COLORS.TERMINAL.TEXT_DIM,
  
  PROMPT: COLORS.TERMINAL.PROMPT,
  
  SUCCESS: COLORS.TERMINAL.SUCCESS,
  INFO: COLORS.TERMINAL.INFO,
  WARNING: COLORS.TERMINAL.WARNING,
  ERROR: COLORS.TERMINAL.ERROR,
  
  COMMAND: COLORS.TERMINAL.COMMAND,
  ARGUMENT: COLORS.TERMINAL.ARGUMENT,
  VALUE: COLORS.TERMINAL.VALUE,
  
  DIRECTION_SYMBOL: COLORS.TERMINAL.DIRECTION_SYMBOL,
  TANK_CODE: COLORS.TERMINAL.TANK_CODE,
  
  COOLDOWN: COLORS.TERMINAL.COOLDOWN,
  HEALTH: COLORS.TERMINAL.HEALTH,
  
  HEADER_TEXT: COLORS.TERMINAL.HEADER_TEXT,
  SEPARATOR: COLORS.TERMINAL.SEPARATOR,
} as const;

export type TerminalColorName = keyof typeof TERMINAL_COLORS;

export function colorize(text: string, colorName: TerminalColorName): string {
  return themeColorize(text, colorName as TerminalColorKey);
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

