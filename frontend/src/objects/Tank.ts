import { UNIT_TO_PIXEL } from "../game";
import { type GunData } from "../types/gun";

type PathEntry = {
  position: { x: number; y: number };
  throttlePercent: number;
};

export class Tank {
  private x: number;
  private y: number;
  private turretRotation: number;
  private targetTurretRotation: number;
  private velocityX: number;
  private velocityY: number;
  private turretAngularVelocity: number;
  private path: PathEntry[];
  private name: string;
  private alliance: number;
  private health: number;
  private maxHealth: number;
  private guns: GunData[];
  private selectedGunIndex: number;

  constructor(
    x: number,
    y: number,
    turretRotation: number,
    name: string,
    alliance: number,
    health: number,
    maxHealth: number = 100,
    velocityX: number = 0,
    velocityY: number = 0,
    turretAngularVelocity: number = 0,
    path: PathEntry[] = [],
    guns: GunData[] = [],
    selectedGunIndex: number = 0
  ) {
    this.x = x;
    this.y = y;
    this.turretRotation = turretRotation;
    this.targetTurretRotation = turretRotation;
    this.name = name;
    this.alliance = alliance;
    this.health = health;
    this.maxHealth = maxHealth;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.turretAngularVelocity = turretAngularVelocity;
    this.path = path;
    this.guns = guns;
    this.selectedGunIndex = selectedGunIndex;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x * UNIT_TO_PIXEL, this.y * UNIT_TO_PIXEL);

    const bodyColor = this.alliance === 0 ? "#ff5555ff" : "#5555ff";
    const turretColor = this.alliance === 0 ? "#ff5555ff" : "#5555ff";
    const barrelColor = this.alliance === 0 ? "#ff5555ff" : "#5555ff";
    const borderColor = this.alliance === 0 ? "#330000" : "#000033";

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowOffsetX = -5;
    ctx.shadowOffsetY = 5;

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 32, 5);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.rotate(this.turretRotation);

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowOffsetX = -12;
    ctx.shadowOffsetY = 12;

    ctx.fillStyle = barrelColor;
    ctx.beginPath();
    ctx.roundRect(0, -5, 24, 10, 3);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowOffsetX = -5;
    ctx.shadowOffsetY = 5;

    ctx.fillStyle = turretColor;
    ctx.beginPath();
    ctx.roundRect(-12, -12, 24, 24, 10);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.translate(this.x * UNIT_TO_PIXEL, this.y * UNIT_TO_PIXEL);

    ctx.font = "14px monospace";
    ctx.fillStyle = "#f5c47c";
    ctx.textAlign = "center";
    ctx.fillText(this.name, 0, -30);

    ctx.restore();
  }

  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
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

  public setTurretAngularVelocity(turretAngularVelocity: number) {
    this.turretAngularVelocity = turretAngularVelocity;
  }

  public setPath(path: PathEntry[]) {
    this.path = path;
  }

  public setHealth(health: number) {
    this.health = health;
  }

  public setAlliance(alliance: number) {
    this.alliance = alliance;
  }

  public setGuns(guns: GunData[]) {
    this.guns = guns;
  }

  public setSelectedGunIndex(selectedGunIndex: number) {
    this.selectedGunIndex = selectedGunIndex;
  }

  public update(deltaTime: number) {
    if (this.path.length > 0) {
      const target = this.path[0].position;

      if (this.velocityX !== 0 || this.velocityY !== 0) {
        const newX = this.x + this.velocityX * deltaTime;
        const newY = this.y + this.velocityY * deltaTime;

        const currentDistSq =
          (target.x - this.x) ** 2 + (target.y - this.y) ** 2;
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
        while (this.turretRotation > Math.PI)
          this.turretRotation -= 2 * Math.PI;
        while (this.turretRotation < -Math.PI)
          this.turretRotation += 2 * Math.PI;
      }
    }
  }

  // Getters
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public getTurretRotation(): number {
    return this.turretRotation;
  }

  public getGuns(): GunData[] {
    return this.guns;
  }

  public getSelectedGunIndex(): number {
    return this.selectedGunIndex;
  }
}
