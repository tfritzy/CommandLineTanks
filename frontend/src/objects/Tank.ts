import { type Infer } from "spacetimedb";
import Gun from "../../module_bindings/gun_type";
import { FLASH_DURATION } from "../utils/colors";
import { TEAM_COLORS, INTERPOLATION_DELAY, BUFFER_DURATION } from "../constants";
import {
  drawTankShadow,
  drawTankBody,
  drawTankHealthBar,
  drawTankPath,
  drawTankNameLabel,
} from "../drawing/tanks/tank";

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
  private remainingImmunityMicros: bigint = 0n;
  private isPlayerTank: boolean = false;
  private message: string | null | undefined = null;
  private positionBuffer: Array<{ x: number; y: number; serverTimestampMs: number }> =
    [];

  constructor(
    id: string,
    x: number,
    y: number,
    turretRotation: number,
    name: string,
    alliance: number,
    health: number,
    maxHealth: number = 100,
    turretAngularVelocity: number = 0,
    path: PathEntry[] = [],
    guns: Infer<typeof Gun>[] = [],
    selectedGunIndex: number = 0,
    hasShield: boolean = false,
    remainingImmunityMicros: bigint = 0n
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
    this.turretAngularVelocity = turretAngularVelocity;
    this.path = path;
    this.guns = guns;
    this.selectedGunIndex = selectedGunIndex;
    this.hasShield = hasShield;
    this.remainingImmunityMicros = remainingImmunityMicros;
  }

  public getAllianceColor(): string {
    return this.alliance === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;
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

  public drawNameLabel(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;
    drawTankNameLabel(ctx, this.x, this.y, this.name);
  }

  public drawMessageLabel(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;
    if (!this.message) return;
    drawTankNameLabel(ctx, this.x, this.y - 0.5, this.message);
  }

  public drawShadow(ctx: CanvasRenderingContext2D) {
    if (this.health <= 0) return;
    drawTankShadow(ctx, this.x, this.y);
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

  public drawPath(ctx: CanvasRenderingContext2D) {
    const lineColor =
      this.alliance === 0 ? TEAM_COLORS.RED + "66" : TEAM_COLORS.BLUE + "66";
    const dotColor =
      this.alliance === 0 ? TEAM_COLORS.RED + "ff" : TEAM_COLORS.BLUE + "ff";
    drawTankPath(ctx, this.x, this.y, this.path, lineColor, dotColor);
  }

  public setPosition(x: number, y: number, serverTimestampMicros: bigint) {
    const serverTimestampMs = Number(serverTimestampMicros / 1000n);

    this.positionBuffer.push({
      x,
      y,
      serverTimestampMs,
    });

    const cutoffTime = serverTimestampMs - BUFFER_DURATION;
    this.positionBuffer = this.positionBuffer.filter(
      (p) => p.serverTimestampMs > cutoffTime
    );
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

  public setRemainingImmunityMicros(remainingImmunityMicros: bigint) {
    this.remainingImmunityMicros = remainingImmunityMicros;
  }

  public setIsPlayerTank(isPlayerTank: boolean) {
    this.isPlayerTank = isPlayerTank;
  }

  public setMessage(message: string | null | undefined) {
    this.message = message;
  }

  public getMessage(): string | null | undefined {
    return this.message;
  }

  public update(deltaTime: number) {
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - deltaTime);
    }

    if (this.positionBuffer.length === 0) return;

    if (this.positionBuffer.length === 1) {
      this.x = this.positionBuffer[0].x;
      this.y = this.positionBuffer[0].y;
      return;
    }

    const latestServerTime = this.positionBuffer[this.positionBuffer.length - 1].serverTimestampMs;
    const renderTime = latestServerTime - INTERPOLATION_DELAY;

    let prev = this.positionBuffer[0];
    let next = this.positionBuffer[1];

    for (let i = 0; i < this.positionBuffer.length - 1; i++) {
      if (this.positionBuffer[i + 1].serverTimestampMs > renderTime) {
        prev = this.positionBuffer[i];
        next = this.positionBuffer[i + 1];
        break;
      }
    }

    if (
      renderTime >=
      this.positionBuffer[this.positionBuffer.length - 1].serverTimestampMs
    ) {
      const last = this.positionBuffer[this.positionBuffer.length - 1];
      this.x = last.x;
      this.y = last.y;
      return;
    }

    const total = next.serverTimestampMs - prev.serverTimestampMs;
    const elapsed = renderTime - prev.serverTimestampMs;
    const t = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 1;

    this.x = prev.x + (next.x - prev.x) * t;
    this.y = prev.y + (next.y - prev.y) * t;
    // }

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

  public getAlliance(): number {
    return this.alliance;
  }
}
