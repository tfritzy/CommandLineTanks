import { FloatingLabel } from "../objects/FloatingLabel";

export class FloatingLabelManager {
  private labels: FloatingLabel[] = [];

  public spawnLabel(x: number, y: number, text: string): void {
    const label = new FloatingLabel(x, y, text);
    this.labels.push(label);
  }

  public update(deltaTime: number): void {
    for (const label of this.labels) {
      label.update(deltaTime);
    }

    this.labels = this.labels.filter((label) => !label.getIsDead());
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const label of this.labels) {
      label.draw(ctx);
    }
  }
}
