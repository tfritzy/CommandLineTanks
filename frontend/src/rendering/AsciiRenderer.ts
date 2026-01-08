import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { PALETTE } from "../theme/colors";

const ASCII_CHARS = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

const ANSI_RESET = "\x1b[0m";

const TERMINAL_FONT_SIZE = 6;

export class AsciiRenderer {
  private terminal: Terminal;
  private fitAddon: FitAddon;
  private container: HTMLDivElement | null = null;
  private cols: number = 0;
  private rows: number = 0;
  private lastRenderedBuffer: string = "";
  private sourceCanvas: HTMLCanvasElement | null = null;

  constructor() {
    this.terminal = new Terminal({
      cursorBlink: false,
      disableStdin: true,
      fontSize: TERMINAL_FONT_SIZE,
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

  public setSourceCanvas(canvas: HTMLCanvasElement): void {
    this.sourceCanvas = canvas;
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
    this.sourceCanvas = null;
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
  }

  private luminanceToChar(luminance: number): string {
    const index = Math.floor(luminance * (ASCII_CHARS.length - 1));
    return ASCII_CHARS[Math.min(index, ASCII_CHARS.length - 1)];
  }

  private rgbToAnsi(r: number, g: number, b: number): string {
    return `\x1b[38;2;${r};${g};${b}m`;
  }

  public render(): void {
    if (!this.sourceCanvas || this.cols === 0 || this.rows === 0) {
      return;
    }

    const ctx = this.sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return;
    }

    const canvasWidth = this.sourceCanvas.width;
    const canvasHeight = this.sourceCanvas.height;

    if (canvasWidth === 0 || canvasHeight === 0) {
      return;
    }

    const cellWidth = canvasWidth / this.cols;
    const cellHeight = canvasHeight / this.rows;

    let imageData: ImageData;
    try {
      imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    } catch {
      return;
    }

    const data = imageData.data;
    let output = "\x1b[H";

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const centerX = Math.floor((col + 0.5) * cellWidth);
        const centerY = Math.floor((row + 0.5) * cellHeight);

        const sampleX = Math.min(centerX, canvasWidth - 1);
        const sampleY = Math.min(centerY, canvasHeight - 1);

        const pixelIndex = (sampleY * canvasWidth + sampleX) * 4;

        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];

        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        const char = this.luminanceToChar(luminance);

        output += this.rgbToAnsi(r, g, b);
        output += char;
      }
      if (row < this.rows - 1) {
        output += ANSI_RESET + "\r\n";
      }
    }
    output += ANSI_RESET;

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
}
