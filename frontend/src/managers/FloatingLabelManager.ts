import { FloatingLabel } from "../objects/FloatingLabel";

export class FloatingLabelManager {
  private labels: FloatingLabel[] = [];

  public spawnLabel(x: number, y: number, text: string): void {
    const label = new FloatingLabel(x, y, text);
    this.labels.push(label);
  }

  public update(deltaTime: number): void {
    for (let i = this.labels.length - 1; i >= 0; i--) {
      this.labels[i].update(deltaTime);
      if (this.labels[i].getIsDead()) {
        this.labels.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const label of this.labels) {
      label.draw(ctx);
    }
  }
}
