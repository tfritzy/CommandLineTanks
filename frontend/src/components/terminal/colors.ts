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

export type ColorSegment = {
  text: string;
  color: string;
};

const COLOR_MARKER = "§";
const COLOR_END = "§r";

export function colorize(text: string, colorName: TerminalColorName): string {
  const color = TERMINAL_COLORS[colorName];
  return `${COLOR_MARKER}${color}${text}${COLOR_END}`;
}

export function parseColoredText(text: string): ColorSegment[] {
  const segments: ColorSegment[] = [];
  let currentColor: string = TERMINAL_COLORS.TEXT_DEFAULT;
  const chars: string[] = [];
  let i = 0;

  const flushText = () => {
    if (chars.length > 0) {
      segments.push({ text: chars.join(''), color: currentColor });
      chars.length = 0;
    }
  };

  while (i < text.length) {
    if (text[i] === COLOR_MARKER) {
      if (i + 1 < text.length && text.substring(i, i + 2) === COLOR_END) {
        flushText();
        currentColor = TERMINAL_COLORS.TEXT_DEFAULT;
        i += 2;
        continue;
      }
      
      const colorMatch = text.substring(i + 1).match(/^(#[0-9a-fA-F]{6})/);
      if (colorMatch) {
        flushText();
        currentColor = colorMatch[1];
        i += 1 + colorMatch[1].length;
        continue;
      }
    }
    
    chars.push(text[i]);
    i++;
  }

  flushText();

  return segments;
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
