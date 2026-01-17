import { UNIT_TO_PIXEL } from "../../constants";
import { FLASH_DURATION } from "../../utils/colors";
import { type TerrainDetailRow } from "../../../module_bindings";
import { type Infer } from "spacetimedb";
import { COLORS } from "../../theme/colors";

export abstract class TerrainDetailObject {
  public arrayIndex: number = -1;
  protected x: number;
  protected y: number;
  protected label: string | undefined;
  protected health: number | undefined;
  protected rotation: number;
  protected flashTimer: number = 0;

  public setData(data: Infer<typeof TerrainDetailRow>): void {
    this.x = data.positionX;
    this.y = data.positionY;
    this.label = data.label;
    this.setHealth(data.health);
    this.rotation = data.rotation;
  }

  protected getRadius(baseRadius: number, variation: number, seedX: number, seedY: number): number {
    const seed = this.x * seedX + this.y * seedY;
    const pseudoRandom = (Math.abs(Math.sin(seed) * 10000) % 1) * (variation * 2) - variation;
    return UNIT_TO_PIXEL * baseRadius * (1.0 + pseudoRandom);
  }

  constructor(x: number, y: number, label: string | undefined = undefined, health: number | undefined = undefined, rotation: number = 0) {
    this.x = x;
    this.y = y;
    this.label = label;
    this.health = health;
    this.rotation = rotation;
  }

  public update(deltaTime: number): void {
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - deltaTime);
    }
  }

  public setHealth(health: number | undefined): void {
    if (health !== undefined && this.health !== undefined && health < this.health) {
      this.flashTimer = FLASH_DURATION;
    }
    this.health = health;
  }

  public abstract draw(ctx: CanvasRenderingContext2D): void;

  public abstract drawShadow(ctx: CanvasRenderingContext2D): void;

  public abstract drawBody(ctx: CanvasRenderingContext2D): void;

  private parseLabel(label: string): { text: string; color?: string; isCode: boolean }[] {
    const segments: { text: string; color?: string; isCode: boolean }[] = [];
    const regex = /(\[color=#[0-9a-fA-F]{6}\]|\[\/color\]|`)/g;
    const parts = label.split(regex);

    let currentColor: string | undefined = undefined;
    let inCode = false;

    for (const part of parts) {
      if (!part) continue;

      if (part.startsWith("[color=")) {
        currentColor = part.substring(7, 14);
      } else if (part === "[/color]") {
        currentColor = undefined;
      } else if (part === "`") {
        inCode = !inCode;
      } else {
        segments.push({ text: part, color: currentColor, isCode: inCode });
      }
    }
    return segments;
  }

  public drawLabel(ctx: CanvasRenderingContext2D): void {
    if (!this.label) return;

    const segments = this.parseLabel(this.label);

    ctx.save();
    const x = this.getGameX();
    const y = this.getGameY();
    const labelY = y - 24;

    const fontSize = UNIT_TO_PIXEL * 0.26;
    const normalFont = `${fontSize}px monospace`;
    const codeFont = `bold ${fontSize}px monospace`;

    // Calculate total width
    let totalWidth = 0;
    const segmentSpacing = 1;
    const codePadding = 4;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      ctx.font = segment.isCode ? codeFont : normalFont;
      totalWidth += ctx.measureText(segment.text).width;
      if (segment.isCode) totalWidth += codePadding;
      if (i < segments.length - 1) totalWidth += segmentSpacing;
    }

    let currentX = x - totalWidth / 2;
    ctx.textBaseline = "alphabetic";

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      ctx.font = segment.isCode ? codeFont : normalFont;
      const textWidth = ctx.measureText(segment.text).width;

      if (segment.isCode) {
        currentX += codePadding / 2;
        ctx.save();
        ctx.fillStyle = "rgba(42, 21, 45, 0.85)"; // Near-black purple
        const paddingH = 5;
        const paddingV = 4;
        const bgW = textWidth + paddingH;
        const bgH = fontSize + paddingV;
        const bgX = currentX - paddingH / 2;
        const bgY = labelY - (fontSize * 0.85) - (paddingV / 2);
        
        ctx.beginPath();
        ctx.roundRect(bgX, bgY, bgW, bgH, 2);
        ctx.fill();
        
        ctx.strokeStyle = "rgba(252, 251, 243, 0.15)"; // Muted white
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Draw shadow for readability
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillStyle = segment.color || COLORS.UI.TEXT_PRIMARY;
      ctx.fillText(segment.text, currentX, labelY);
      
      // Reset shadow for next segments
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      currentX += textWidth + (segment.isCode ? codePadding / 2 : 0) + segmentSpacing;
    }

    ctx.restore();
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getRotation(): number {
    return this.rotation;
  }

  public getFlashTimer(): number {
    return this.flashTimer;
  }

  public getSizeScale(): number {
    return 1.0;
  }

  protected getGameX(): number {
    return this.x * UNIT_TO_PIXEL;
  }

  protected getGameY(): number {
    return this.y * UNIT_TO_PIXEL;
  }

  public abstract getType(): string;

  public abstract getTextureKey(): string;
}
