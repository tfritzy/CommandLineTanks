/** @type {import('tailwindcss').Config} */
import { PALETTE, UI_COLORS, TERMINAL_COLORS, GAME_COLORS } from './src/theme/colors.config.js';

function kebabCase(str) {
  return str.replace(/_/g, '-').toLowerCase();
}

function transformColors(colors) {
  const result = {};
  for (const [key, value] of Object.entries(colors)) {
    result[kebabCase(key)] = value;
  }
  return result;
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        palette: transformColors(PALETTE),
        ui: transformColors(UI_COLORS),
        terminal: transformColors(TERMINAL_COLORS),
        game: transformColors(GAME_COLORS),
        primary: PALETTE.BLUE_CYAN,
        'primary-hover': PALETTE.BLUE_LIGHT,
        secondary: PALETTE.GREEN_SUCCESS,
        accent: PALETTE.YELLOW_BRIGHT,
        'background-base': PALETTE.GROUND_DARK,
        'card-dark': '#232334',
        'border-dark': '#42425a',
        'terminal-bg': PALETTE.PURPLE_VOID,
        'code-bg': '#151520',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, #42425a 1px, transparent 1px), linear-gradient(to bottom, #42425a 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
