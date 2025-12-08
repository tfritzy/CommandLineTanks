export class Tank {
  private x: number;
  private y: number;
  private bodyRotation: number;
  private turretRotation: number;

  constructor(x: number, y: number, bodyRotation: number, turretRotation: number) {
    this.x = x;
    this.y = y;
    this.bodyRotation = bodyRotation;
    this.turretRotation = turretRotation;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.bodyRotation);

    // Draw tank tracks (bottom)
    this.drawTrack(ctx, -30, -20, 60, 10);
    this.drawTrack(ctx, -30, 10, 60, 10);

    // Draw tank body (main rectangle)
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(-25, -15, 50, 30);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-25, -15, 50, 30);

    // Draw turret
    ctx.rotate(this.turretRotation - this.bodyRotation);
    
    // Turret base (rounded rectangle)
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.roundRect(-15, -10, 30, 20, 5);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Turret barrel
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(15, -3, 25, 6);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, -3, 25, 6);

    ctx.restore();
  }

  private drawTrack(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Draw track segments
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 8) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i, y + height);
      ctx.stroke();
    }
  }

  // Setters for updating tank state
  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public setBodyRotation(rotation: number) {
    this.bodyRotation = rotation;
  }

  public setTurretRotation(rotation: number) {
    this.turretRotation = rotation;
  }

  // Getters
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public getBodyRotation(): number {
    return this.bodyRotation;
  }

  public getTurretRotation(): number {
    return this.turretRotation;
  }
}
