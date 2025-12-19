import { UNIT_TO_PIXEL } from "../game";
import { type GunData } from "../types/gun";
import { FLASH_DURATION, getFlashColor } from "../utils/colors";

type PathEntry = {
  position: { x: number; y: number };
  throttlePercent: number;
};

export class Tank {
  public arrayIndex: number = -1;
  public readonly id: string;
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
  private flashTimer: number = 0;

  constructor(
    id: string,
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
    this.id = id;
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
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public drawShadow(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;

    ctx.save();
    ctx.translate(this.x * UNIT_TO_PIXEL, this.y * UNIT_TO_PIXEL);

    const shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.fillStyle = shadowColor;

    ctx.save();
    ctx.translate(-4, 4);
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 32, 5);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;

    ctx.save();
    ctx.translate(this.x * UNIT_TO_PIXEL, this.y * UNIT_TO_PIXEL);

    const allianceColor = this.alliance === 0 ? "#ff5555" : "#5555ff";
    const bodyColor = getFlashColor(allianceColor, this.flashTimer);
    const borderColor = getFlashColor(this.alliance === 0 ? "#330000" : "#000033", this.flashTimer);
    const selfShadowColor = "rgba(0, 0, 0, 0.35)";

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 32, 5);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = selfShadowColor;

    ctx.save();
    ctx.translate(-2, 2);
    ctx.rotate(this.turretRotation);
    ctx.beginPath();
    ctx.roundRect(0, -5, 24, 10, 3);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(-1.5, 1.5);
    ctx.rotate(this.turretRotation);
    ctx.beginPath();
    ctx.roundRect(-12, -12, 24, 24, 10);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.rotate(this.turretRotation);

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(0, -5, 24, 10, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-12, -12, 24, 24, 10);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    ctx.save();
    ctx.translate(this.x * UNIT_TO_PIXEL, this.y * UNIT_TO_PIXEL);
    ctx.font = "14px monospace";
    ctx.fillStyle = "#f5c47c";
    ctx.textAlign = "center";
    ctx.fillText(this.name, 0, -30);
    ctx.restore();
  }

  public drawPath(ctx: CanvasRenderingContext2D) {
    if (this.path.length === 0) return;

    const lineColor = this.alliance === 0 ? "#ff555566" : "#5555ff66";
    const dotColor = this.alliance === 0 ? "#ff5555ff" : "#5555ffff";
    const dotRadius = 5;

    ctx.save();

    if (this.path.length > 0) {
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const startX = this.x * UNIT_TO_PIXEL;
      const startY = this.y * UNIT_TO_PIXEL;
      ctx.moveTo(startX, startY);

      for (const pathEntry of this.path) {
        const worldX = pathEntry.position.x * UNIT_TO_PIXEL;
        const worldY = pathEntry.position.y * UNIT_TO_PIXEL;
        ctx.lineTo(worldX, worldY);
      }

      ctx.stroke();

      const lastEntry = this.path[this.path.length - 1];
      const endX = lastEntry.position.x * UNIT_TO_PIXEL;
      const endY = lastEntry.position.y * UNIT_TO_PIXEL;

      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(endX, endY, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }

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
    if (health < this.health && this.health > 0) {
      this.flashTimer = FLASH_DURATION;
    }
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
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - deltaTime);
    }

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

  public getHealth(): number {
    return this.health;
  }
}
