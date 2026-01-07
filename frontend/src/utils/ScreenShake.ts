export class ScreenShake {
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeElapsed: number = 0;
  private cachedOffset: { x: number; y: number } = { x: 0, y: 0 };

  public shake(intensity: number, duration: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  public update(deltaTime: number): { x: number; y: number } {
    if (this.shakeElapsed >= this.shakeDuration) {
      this.shakeIntensity = 0;
      this.cachedOffset.x = 0;
      this.cachedOffset.y = 0;
      return this.cachedOffset;
    }

    this.shakeElapsed += deltaTime;
    const progress = this.shakeElapsed / this.shakeDuration;
    const currentIntensity = this.shakeIntensity * (1 - progress);

    this.cachedOffset.x = (Math.random() - 0.5) * 2 * currentIntensity;
    this.cachedOffset.y = (Math.random() - 0.5) * 2 * currentIntensity;

    return this.cachedOffset;
  }

  public isShaking(): boolean {
    return this.shakeIntensity > 0 && this.shakeElapsed < this.shakeDuration;
  }
}
