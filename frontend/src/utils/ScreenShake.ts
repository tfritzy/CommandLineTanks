export class ScreenShake {
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeElapsed: number = 0;

  public shake(intensity: number, duration: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  public update(deltaTime: number): { x: number; y: number } {
    if (this.shakeElapsed >= this.shakeDuration) {
      this.shakeIntensity = 0;
      return { x: 0, y: 0 };
    }

    this.shakeElapsed += deltaTime;
    const progress = this.shakeElapsed / this.shakeDuration;
    const currentIntensity = this.shakeIntensity * (1 - progress);

    const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
    const offsetY = (Math.random() - 0.5) * 2 * currentIntensity;

    return { x: offsetX, y: offsetY };
  }

  public isShaking(): boolean {
    return this.shakeIntensity > 0 && this.shakeElapsed < this.shakeDuration;
  }
}
