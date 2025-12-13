import { UNIT_TO_PIXEL } from "../game";

type PathEntry = {
  position: { x: number; y: number };
  throttlePercent: number;
};

export class Tank {
  private x: number;
  private y: number;
  private bodyRotation: number;
  private targetBodyRotation: number;
  private turretRotation: number;
  private targetTurretRotation: number;
  private velocityX: number;
  private velocityY: number;
  private bodyAngularVelocity: number;
  private turretAngularVelocity: number;
  private path: PathEntry[];
  private name: string;
  private alliance: number;

  constructor(
    x: number,
    y: number,
    bodyRotation: number,
    targetBodyRotation: number,
    turretRotation: number,
    name: string,
    alliance: number,
    velocityX: number = 0,
    velocityY: number = 0,
    bodyAngularVelocity: number = 0,
    turretAngularVelocity: number = 0,
    path: PathEntry[] = []
  ) {
    this.x = x;
    this.y = y;
    this.bodyRotation = bodyRotation;
    this.targetBodyRotation = targetBodyRotation;
    this.turretRotation = turretRotation;
    this.targetTurretRotation = turretRotation;
    this.name = name;
    this.alliance = alliance;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.bodyAngularVelocity = bodyAngularVelocity;
    this.turretAngularVelocity = turretAngularVelocity;
    this.path = path;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const offset = UNIT_TO_PIXEL / 2;
    ctx.translate(this.x * UNIT_TO_PIXEL + offset, this.y * UNIT_TO_PIXEL + offset);
    ctx.rotate(this.bodyRotation);

    const bodyColor = this.alliance === 0 ? '#ff6666' : '#6666ff';
    const turretColor = this.alliance === 0 ? '#ff8888' : '#8888ff';
    const barrelColor = this.alliance === 0 ? '#cc5555' : '#5555cc';

    this.drawTrack(ctx, -25, -20, 50, 10);
    this.drawTrack(ctx, -25, 10, 50, 10);

    ctx.fillStyle = bodyColor;
    ctx.fillRect(-23, -15, 46, 30);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-23, -15, 46, 30);

    ctx.rotate(this.turretRotation - this.bodyRotation);
    
    ctx.fillStyle = turretColor;
    ctx.beginPath();
    ctx.roundRect(-15, -10, 30, 20, 5);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = barrelColor;
    ctx.fillRect(15, -3, 25, 6);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, -3, 25, 6);

    ctx.restore();

    ctx.save();
    ctx.translate(this.x * UNIT_TO_PIXEL + offset, this.y * UNIT_TO_PIXEL + offset);
    ctx.scale(1, -1);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, 0, -45);
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

  public setTargetBodyRotation(rotation: number) {
    this.targetBodyRotation = rotation;
  }

  public setTurretRotation(rotation: number) {
    this.turretRotation = rotation;
  }

  public setTargetTurretRotation(rotation: number) {
    this.targetTurretRotation = rotation;
  }

  public setVelocity(velocityX: number, velocityY: number) {
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  public setBodyAngularVelocity(bodyAngularVelocity: number) {
    this.bodyAngularVelocity = bodyAngularVelocity;
  }

  public setTurretAngularVelocity(turretAngularVelocity: number) {
    this.turretAngularVelocity = turretAngularVelocity;
  }

  public setPath(path: PathEntry[]) {
    this.path = path;
  }

  public update(deltaTime: number) {
    if (this.path.length > 0) {
      const target = this.path[0].position;
      
      if (this.velocityX !== 0 || this.velocityY !== 0) {
        const newX = this.x + this.velocityX * deltaTime;
        const newY = this.y + this.velocityY * deltaTime;
        
        const currentDistSq = (target.x - this.x) ** 2 + (target.y - this.y) ** 2;
        const newDistSq = (target.x - newX) ** 2 + (target.y - newY) ** 2;
        
        if (newDistSq > currentDistSq) {
          this.x = target.x;
          this.y = target.y;
          this.velocityX = 0;
          this.velocityY = 0;
        } else {
          this.x = newX;
          this.y = newY;
        }
      }
    }
    
    if (this.bodyAngularVelocity !== 0) {
      const newRotation = this.bodyRotation + this.bodyAngularVelocity * deltaTime;
      
      let currentDiff = this.targetBodyRotation - this.bodyRotation;
      while (currentDiff > Math.PI) currentDiff -= 2 * Math.PI;
      while (currentDiff < -Math.PI) currentDiff += 2 * Math.PI;
      
      let newDiff = this.targetBodyRotation - newRotation;
      while (newDiff > Math.PI) newDiff -= 2 * Math.PI;
      while (newDiff < -Math.PI) newDiff += 2 * Math.PI;
      
      if (Math.sign(currentDiff) !== Math.sign(newDiff)) {
        this.bodyRotation = this.targetBodyRotation;
        this.bodyAngularVelocity = 0;
      } else {
        this.bodyRotation = newRotation;
      }
    }

    if (this.turretAngularVelocity !== 0) {
      let currentDiff = this.targetTurretRotation - this.turretRotation;
      while (currentDiff > Math.PI) currentDiff -= 2 * Math.PI;
      while (currentDiff < -Math.PI) currentDiff += 2 * Math.PI;
      
      const rotationAmount = this.turretAngularVelocity * deltaTime;
      
      if (Math.abs(currentDiff) <= Math.abs(rotationAmount)) {
        this.turretRotation = this.targetTurretRotation;
        this.turretAngularVelocity = 0;
      } else {
        this.turretRotation += rotationAmount;
        while (this.turretRotation > Math.PI) this.turretRotation -= 2 * Math.PI;
        while (this.turretRotation < -Math.PI) this.turretRotation += 2 * Math.PI;
      }
    }
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
