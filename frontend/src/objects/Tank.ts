import { type Infer } from "spacetimedb";
import { UNIT_TO_PIXEL } from "../constants";
import Gun from "../../module_bindings/gun_type";
import { FLASH_DURATION } from "../utils/colors";
import { TEAM_COLORS } from "../constants";
import { drawTankShadow, drawTankBody, drawTankHealthBar, drawTankPath } from "../drawing/tanks/tank";

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
  private guns: Infer<typeof Gun>[];
  private selectedGunIndex: number;
  private flashTimer: number = 0;
  private hasShield: boolean = false;

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
    guns: Infer<typeof Gun>[] = [],
    selectedGunIndex: number = 0,
    hasShield: boolean = false
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
    this.hasShield = hasShield;
  }

  public getAllianceColor(): string {
    return this.alliance === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public drawHealthBar(ctx: CanvasRenderingContext2D) {
    drawTankHealthBar(ctx, this.x, this.y, this.health, this.maxHealth, this.getAllianceColor());
  }

  public drawShadow(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;
    drawTankShadow(ctx, this.x, this.y);
  }

  public drawBody(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;
    drawTankBody(ctx, {
      x: this.x,
      y: this.y,
      turretRotation: this.turretRotation,
      alliance: this.alliance,
      flashTimer: this.flashTimer,
      name: this.name,
      health: this.health,
      hasShield: this.hasShield,
    });
  }

  public drawPath(ctx: CanvasRenderingContext2D) {
    const lineColor = this.alliance === 0 ? TEAM_COLORS.RED + "66" : TEAM_COLORS.BLUE + "66";
    const dotColor = this.alliance === 0 ? TEAM_COLORS.RED + "ff" : TEAM_COLORS.BLUE + "ff";
    drawTankPath(ctx, this.x, this.y, this.path, lineColor, dotColor);
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

  public setGuns(guns: Infer<typeof Gun>[]) {
    this.guns = guns;
  }

  public setSelectedGunIndex(selectedGunIndex: number) {
    this.selectedGunIndex = selectedGunIndex;
  }

  public setHasShield(hasShield: boolean) {
    this.hasShield = hasShield;
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

  public getGuns(): Infer<typeof Gun>[] {
    return this.guns;
  }

  public getSelectedGunIndex(): number {
    return this.selectedGunIndex;
  }

  public getHealth(): number {
    return this.health;
  }
}
