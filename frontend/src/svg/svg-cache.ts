import { getNormalizedDPR } from "../utils/dpr";

const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

export function svgToImage(svgString: string): HTMLImageElement | null {
  const cached = imageCache.get(svgString);
  if (cached) {
    return cached;
  }

  if (!loadingPromises.has(svgString)) {
    const promise = loadSvgAsImage(svgString);
    loadingPromises.set(svgString, promise);
    promise.then((img) => {
      imageCache.set(svgString, img);
      loadingPromises.delete(svgString);
    });
  }

  return null;
}

export async function svgToImageAsync(svgString: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(svgString);
  if (cached) {
    return cached;
  }

  if (loadingPromises.has(svgString)) {
    return loadingPromises.get(svgString)!;
  }

  const promise = loadSvgAsImage(svgString);
  loadingPromises.set(svgString, promise);

  const img = await promise;
  imageCache.set(svgString, img);
  loadingPromises.delete(svgString);

  return img;
}

function loadSvgAsImage(svgString: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };

    img.src = url;
  });
}

export interface SvgTexture {
  image: HTMLImageElement;
  width: number;
  height: number;
}

export interface TextureEntry {
  svg: string;
  width: number;
  height: number;
  image?: HTMLImageElement;
}

export class SvgTextureSheet {
  private textures: Map<string, TextureEntry> = new Map();
  private ready: boolean = false;
  private dpr: number;

  constructor() {
    this.dpr = getNormalizedDPR();
  }

  protected registerTexture(key: string, svg: string, width: number, height: number) {
    this.textures.set(key, { svg, width, height });
  }

  public async initialize(): Promise<void> {
    const entries = Array.from(this.textures.entries());
    await Promise.all(
      entries.map(async ([key, entry]) => {
        const img = await svgToImageAsync(entry.svg);
        entry.image = img;
        this.textures.set(key, entry);
      })
    );
    this.ready = true;
  }

  public isReady(): boolean {
    return this.ready;
  }

  public getTexture(key: string): TextureEntry | undefined {
    return this.textures.get(key);
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    scale: number = 1.0,
    rotation: number = 0
  ) {
    const texture = this.textures.get(key);
    if (!texture || !texture.image) return;

    const width = texture.width * scale;
    const height = texture.height * scale;

    ctx.save();
    ctx.translate(x, y);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    ctx.drawImage(
      texture.image,
      -width / 2,
      -height / 2,
      width,
      height
    );
    ctx.restore();
  }

  public drawWithOffset(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    offsetX: number,
    offsetY: number,
    scale: number = 1.0,
    rotation: number = 0
  ) {
    const texture = this.textures.get(key);
    if (!texture || !texture.image) return;

    const width = texture.width * scale;
    const height = texture.height * scale;

    ctx.save();
    ctx.translate(x + offsetX, y + offsetY);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    ctx.drawImage(
      texture.image,
      -width / 2,
      -height / 2,
      width,
      height
    );
    ctx.restore();
  }

  public getDpr(): number {
    return this.dpr;
  }
}
