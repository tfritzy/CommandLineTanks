export interface Drawable {
  update(deltaTime: number): void;
  draw(ctx: CanvasRenderingContext2D, ...args: any[]): void;
  getIsDead(): boolean;
}
