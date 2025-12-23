export interface TankIndicator {
  update(deltaTime: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
  getIsDead(): boolean;
}
