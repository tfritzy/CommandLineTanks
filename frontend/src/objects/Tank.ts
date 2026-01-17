import { FLASH_DURATION } from "../utils/colors";
import {
  drawTankShadow,
  drawTankBody,
  drawTankHealthBar,
  drawTankPath,
  drawTankNameLabel,
  drawTankTextLabel,
} from "../drawing/tanks/tank";
import { COLORS } from "../theme/colors";

export class Tank {
  public arrayIndex: number = -1;
  public readonly id: string;
  private x: number;
  private y: number;
  private serverX: number;
  private serverY: number;
  private turretRotation: number;
  private targetTurretRotation: number;
  private turretAngularVelocity: number;
  private path: Array<{ x: number; y: number }>;
  private pathIndex: number;
  private topSpeed: number;
  private name: string;
  private targetCode: string;
  private alliance: number;
  private health: number;
  private maxHealth: number;
  private flashTimer: number = 0;
  private hasShield: boolean = false;
  private remainingImmunityMicros: bigint = 0n;
  private message: string | null = null;
  private cachedPosition: { x: number; y: number } = { x: 0, y: 0 };
  private static readonly ARRIVAL_THRESHOLD = 0.1;
  private static readonly TELEPORT_THRESHOLD = 2.0;

  constructor(
    id: string,
    x: number,
    y: number,
    turretRotation: number,
    name: string,
    targetCode: string,
    alliance: number,
    health: number,
    maxHealth: number = 100,
    turretAngularVelocity: number = 0,
    path: Array<{ x: number; y: number }> = [],
    pathIndex: number = 0,
    hasShield: boolean = false,
    remainingImmunityMicros: bigint = 0n,
    topSpeed: number = 3.0
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.serverX = x;
    this.serverY = y;
    this.turretRotation = turretRotation;
    this.targetTurretRotation = turretRotation;
    this.name = name;
    this.targetCode = targetCode;
    this.alliance = alliance;
    this.health = health;
    this.maxHealth = maxHealth;
    this.turretAngularVelocity = turretAngularVelocity;
    this.path = path;
    this.pathIndex = pathIndex;
    this.hasShield = hasShield;
    this.remainingImmunityMicros = remainingImmunityMicros;
    this.topSpeed = topSpeed;
  }

  public getAllianceColor(): string {
    return this.alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT : COLORS.GAME.TEAM_BLUE_BRIGHT;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public drawHealthBar(ctx: CanvasRenderingContext2D) {
    drawTankHealthBar(
      ctx,
      this.x,
      this.y,
      this.health,
      this.maxHealth,
      this.getAllianceColor()
    );
  }

  public drawHealthBarAt(ctx: CanvasRenderingContext2D, x: number, y: number) {
    drawTankHealthBar(
      ctx,
      x,
      y,
      this.health,
      this.maxHealth,
      this.getAllianceColor()
    );
  }

  public drawNameLabel(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;
    drawTankNameLabel(ctx, this.x, this.y, this.targetCode, this.name);
  }

  public drawNameLabelWithoutTargetCode(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;
    drawTankNameLabel(ctx, this.x, this.y, "", this.name);
  }

  public drawMessageLabel(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;
    if (!this.message) return;
    drawTankTextLabel(ctx, this.x, this.y - 0.5, this.message);
  }

  public drawShadow(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;
    drawTankShadow(ctx, this.x, this.y);
  }

  public drawShadowAt(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (this.health <= 0) return;
    drawTankShadow(ctx, x, y);
  }

  public drawBody(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;
    const isImmune = this.remainingImmunityMicros > 0;
    drawTankBody(ctx, {
      x: this.x,
      y: this.y,
      turretRotation: this.turretRotation,
      alliance: this.alliance,
      flashTimer: this.flashTimer,
      name: this.name,
      health: this.health,
      hasShield: this.hasShield,
      isImmune: isImmune,
    });
  }

  public drawBodyAt(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (this.health <= 0) return;
    const isImmune = this.remainingImmunityMicros > 0;
    drawTankBody(ctx, {
      x: x,
      y: y,
      turretRotation: this.turretRotation,
      alliance: this.alliance,
      flashTimer: this.flashTimer,
      name: this.name,
      health: this.health,
      hasShield: this.hasShield,
      isImmune: isImmune,
    });
  }

  public drawPath(ctx: CanvasRenderingContext2D) {
    const lineColor =
      this.alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT + "66" : COLORS.GAME.TEAM_BLUE_BRIGHT + "66";
    const dotColor =
      this.alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT + "ff" : COLORS.GAME.TEAM_BLUE_BRIGHT + "ff";
    const remainingPath = this.path.slice(this.pathIndex);
    drawTankPath(ctx, this.x, this.y, remainingPath, lineColor, dotColor);
  }

  public drawPathFrom(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const lineColor =
      this.alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT + "66" : COLORS.GAME.TEAM_BLUE_BRIGHT + "66";
    const dotColor =
      this.alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT + "ff" : COLORS.GAME.TEAM_BLUE_BRIGHT + "ff";
    const remainingPath = this.path.slice(this.pathIndex);
    drawTankPath(ctx, x, y, remainingPath, lineColor, dotColor);
  }

  public setPosition(x: number, y: number) {
    this.serverX = x;
    this.serverY = y;

    const dx = this.serverX - this.x;
    const dy = this.serverY - this.y;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared > Tank.TELEPORT_THRESHOLD * Tank.TELEPORT_THRESHOLD) {
      this.x = this.serverX;
      this.y = this.serverY;
    }
  }

  public setTopSpeed(topSpeed: number) {
    this.topSpeed = topSpeed;
  }

  public setTurretRotation(rotation: number) {
    this.turretRotation = rotation;
  }

  public setTargetTurretRotation(rotation: number) {
    this.targetTurretRotation = rotation;
  }

  public setTurretAngularVelocity(turretAngularVelocity: number) {
    this.turretAngularVelocity = turretAngularVelocity;
  }

  public setPath(path: Array<{ x: number; y: number }>, pathIndex: number = 0) {
    this.path = path;
    this.pathIndex = pathIndex;
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

  public setHasShield(hasShield: boolean) {
    this.hasShield = hasShield;
  }

  public setRemainingImmunityMicros(remainingImmunityMicros: bigint) {
    this.remainingImmunityMicros = remainingImmunityMicros;
  }

  public setTargetCode(targetCode: string) {
    this.targetCode = targetCode;
  }

  public setName(name: string) {
    this.name = name;
  }

  public setMaxHealth(maxHealth: number) {
    this.maxHealth = maxHealth;
  }

  public setMessage(message: string | null) {
    this.message = message;
  }

  public update(deltaTime: number) {
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - deltaTime);
    }

    this.updatePathBasedMovement(deltaTime);

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

  private updatePathBasedMovement(deltaTime: number) {
    if (this.pathIndex >= this.path.length) return;

    const targetPos = this.path[this.pathIndex];
    const deltaX = targetPos.x - this.x;
    const deltaY = targetPos.y - this.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const moveSpeed = this.topSpeed;
    const moveDistance = moveSpeed * deltaTime;

    if (distance <= Tank.ARRIVAL_THRESHOLD || moveDistance >= distance) {
      const overshoot = moveDistance - distance;
      const newPathIndex = this.pathIndex + 1;

      if (newPathIndex < this.path.length) {
        const nextTarget = this.path[newPathIndex];
        const nextDeltaX = nextTarget.x - targetPos.x;
        const nextDeltaY = nextTarget.y - targetPos.y;
        const nextDistance = Math.sqrt(nextDeltaX * nextDeltaX + nextDeltaY * nextDeltaY);

        if (nextDistance > 0) {
          const nextDirX = nextDeltaX / nextDistance;
          const nextDirY = nextDeltaY / nextDistance;

          this.x = targetPos.x + nextDirX * Math.min(overshoot, nextDistance);
          this.y = targetPos.y + nextDirY * Math.min(overshoot, nextDistance);
        } else {
          this.x = targetPos.x;
          this.y = targetPos.y;
        }

        this.pathIndex = newPathIndex;
      } else {
        this.x = targetPos.x;
        this.y = targetPos.y;
      }
    } else {
      const dirX = deltaX / distance;
      const dirY = deltaY / distance;

      this.x += dirX * moveDistance;
      this.y += dirY * moveDistance;
    }
  }

  // Getters
  public getPosition(): { x: number; y: number } {
    this.cachedPosition.x = this.x;
    this.cachedPosition.y = this.y;
    return this.cachedPosition;
  }

  public getTurretRotation(): number {
    return this.turretRotation;
  }

  public getHealth(): number {
    return this.health;
  }

  public getAlliance(): number {
    return this.alliance;
  }

  public getMessage(): string | null {
    return this.message;
  }

  public getTargetCode(): string {
    return this.targetCode;
  }

  public getName(): string {
    return this.name;
  }
}
