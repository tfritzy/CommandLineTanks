export interface ColorMapConfig {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hueShift?: number;
  vignette?: number;
  colorCurve?: (value: number) => number;
}

export type ColorMapPreset =
  | "none"
  | "vintage"
  | "noir"
  | "warm"
  | "cool"
  | "vibrant"
  | "muted";

const PRESETS: Record<ColorMapPreset, ColorMapConfig> = {
  none: {},
  vintage: {
    brightness: 0.1,
    contrast: 1.1,
    saturation: 0.8,
    hueShift: 10,
    vignette: 0.3,
  },
  noir: {
    brightness: -0.1,
    contrast: 1.4,
    saturation: 0,
    vignette: 0.5,
  },
  warm: {
    brightness: 0.05,
    saturation: 1.1,
    hueShift: 15,
  },
  cool: {
    brightness: -0.05,
    saturation: 1.05,
    hueShift: -15,
  },
  vibrant: {
    contrast: 1.2,
    saturation: 1.4,
  },
  muted: {
    saturation: 0.6,
    contrast: 0.9,
  },
};

export class ColorMapper {
  private config: ColorMapConfig = {};

  constructor(preset: ColorMapPreset = "none") {
    this.setPreset(preset);
  }

  setPreset(preset: ColorMapPreset): void {
    this.config = { ...PRESETS[preset] };
  }

  setConfig(config: ColorMapConfig): void {
    this.config = { ...config };
  }

  apply(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    if (this.isIdentity()) {
      return;
    }

    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (this.config.brightness !== undefined) {
        const brightness = this.config.brightness * 255;
        r = this.clamp(r + brightness);
        g = this.clamp(g + brightness);
        b = this.clamp(b + brightness);
      }

      if (this.config.contrast !== undefined) {
        const contrast = this.config.contrast;
        r = this.clamp((r - 128) * contrast + 128);
        g = this.clamp((g - 128) * contrast + 128);
        b = this.clamp((b - 128) * contrast + 128);
      }

      if (
        this.config.saturation !== undefined ||
        this.config.hueShift !== undefined
      ) {
        const hsv = this.rgbToHsv(r, g, b);

        if (this.config.saturation !== undefined) {
          hsv.s *= this.config.saturation;
          hsv.s = Math.max(0, Math.min(1, hsv.s));
        }

        if (this.config.hueShift !== undefined) {
          hsv.h += this.config.hueShift;
          while (hsv.h < 0) hsv.h += 360;
          while (hsv.h >= 360) hsv.h -= 360;
        }

        const rgb = this.hsvToRgb(hsv.h, hsv.s, hsv.v);
        r = rgb.r;
        g = rgb.g;
        b = rgb.b;
      }

      if (this.config.vignette !== undefined && this.config.vignette > 0) {
        const px = (i / 4) % width;
        const py = Math.floor(i / 4 / width);
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        const dist = Math.sqrt(
          (px - centerX) * (px - centerX) + (py - centerY) * (py - centerY)
        );
        const vignetteFactor = 1 - (dist / maxDist) * this.config.vignette;
        r *= vignetteFactor;
        g *= vignetteFactor;
        b *= vignetteFactor;
      }

      if (this.config.colorCurve) {
        r = this.config.colorCurve(r / 255) * 255;
        g = this.config.colorCurve(g / 255) * 255;
        b = this.config.colorCurve(b / 255) * 255;
      }

      data[i] = this.clamp(r);
      data[i + 1] = this.clamp(g);
      data[i + 2] = this.clamp(b);
    }

    ctx.putImageData(imageData, x, y);
  }

  applyToFullCanvas(ctx: CanvasRenderingContext2D): void {
    const canvas = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    this.apply(ctx, 0, 0, width, height);
  }

  private isIdentity(): boolean {
    return (
      !this.config.brightness &&
      !this.config.contrast &&
      !this.config.saturation &&
      !this.config.hueShift &&
      !this.config.vignette &&
      !this.config.colorCurve &&
      this.config.brightness !== 0 &&
      this.config.contrast !== 1 &&
      this.config.saturation !== 1 &&
      this.config.hueShift !== 0 &&
      this.config.vignette !== 0
    );
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  private rgbToHsv(
    r: number,
    g: number,
    b: number
  ): { h: number; s: number; v: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    const s = max === 0 ? 0 : diff / max;
    const v = max;

    if (diff !== 0) {
      if (max === r) {
        h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
      } else if (max === g) {
        h = ((b - r) / diff + 2) * 60;
      } else {
        h = ((r - g) / diff + 4) * 60;
      }
    }

    return { h, s, v };
  }

  private hsvToRgb(
    h: number,
    s: number,
    v: number
  ): { r: number; g: number; b: number } {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0,
      g = 0,
      b = 0;

    if (h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    return {
      r: (r + m) * 255,
      g: (g + m) * 255,
      b: (b + m) * 255,
    };
  }
}
