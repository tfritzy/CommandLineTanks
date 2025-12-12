import { Tank } from "./objects/Tank";
import { getConnection } from "./spacetimedb-connection";

export const UNIT_TO_PIXEL = 50;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private time: number = 0;
  private lastFrameTime: number = 0;
  private tanks: Map<string, Tank> = new Map();
  private playerTankId: string | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = ctx;

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    this.subscribeToTanks();
  }

  private subscribeToTanks() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("Ah fuck", e))
      .subscribe([`SELECT * FROM tank`]);

    connection.db.tank.onInsert((_ctx, tank) => {
      console.log(tank);
      const newTank = new Tank(
        tank.positionX,
        tank.positionY,
        tank.bodyRotation,
        tank.targetBodyRotation,
        tank.turretRotation,
        tank.targetTurretRotation,
        tank.velocity.x,
        tank.velocity.y,
        tank.bodyAngularVelocity,
        tank.turretAngularVelocity,
        tank.path
      );
      this.tanks.set(tank.id, newTank);
      
      if (connection.identity && tank.owner.isEqual(connection.identity)) {
        this.playerTankId = tank.id;
      }
    });

    connection.db.tank.onUpdate((_ctx, _oldTank, newTank) => {
      console.log(newTank);
      const tank = this.tanks.get(newTank.id);
      if (tank) {
        tank.setPosition(newTank.positionX, newTank.positionY);
        tank.setBodyRotation(newTank.bodyRotation);
        tank.setTargetBodyRotation(newTank.targetBodyRotation);
        tank.setTargetTurretRotation(newTank.targetTurretRotation);
        tank.setVelocity(newTank.velocity.x, newTank.velocity.y);
        tank.setBodyAngularVelocity(newTank.bodyAngularVelocity);
        tank.setTurretAngularVelocity(newTank.turretAngularVelocity);
        tank.setPath(newTank.path);
      }
    });

    connection.db.tank.onDelete((_ctx, tank) => {
      console.log(tank);
      this.tanks.delete(tank.id);
      if (this.playerTankId === tank.id) {
        this.playerTankId = null;
      }
    });
  }

  private resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    }
  }

  private drawGrid(cameraX: number, cameraY: number) {
    this.ctx.strokeStyle = "#dddddd";
    this.ctx.lineWidth = 1;

    const startX = Math.floor(cameraX / UNIT_TO_PIXEL) * UNIT_TO_PIXEL;
    const endX = cameraX + this.canvas.width;
    const startY = Math.floor(cameraY / UNIT_TO_PIXEL) * UNIT_TO_PIXEL;
    const endY = cameraY + this.canvas.height;

    for (let x = startX; x <= endX; x += UNIT_TO_PIXEL) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, cameraY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    for (let y = startY; y <= endY; y += UNIT_TO_PIXEL) {
      this.ctx.beginPath();
      this.ctx.moveTo(cameraX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }
  }

  private update(currentTime: number = 0) {
    const deltaTime =
      this.lastFrameTime === 0 ? 0 : (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    this.time += deltaTime;

    for (const tank of this.tanks.values()) {
      tank.update(deltaTime);
    }

    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(0, this.canvas.height);
    this.ctx.scale(1, -1);

    const playerTank = this.playerTankId ? this.tanks.get(this.playerTankId) : null;
    let cameraX = 0;
    let cameraY = 0;
    
    if (playerTank) {
      const playerPos = playerTank.getPosition();
      cameraX = playerPos.x * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2 - this.canvas.width / 2;
      cameraY = playerPos.y * UNIT_TO_PIXEL + UNIT_TO_PIXEL / 2 - this.canvas.height / 2;
    }

    this.ctx.translate(-cameraX, -cameraY);

    this.drawGrid(cameraX, cameraY);

    for (const tank of this.tanks.values()) {
      tank.draw(this.ctx);
    }

    this.ctx.restore();

    this.animationFrameId = requestAnimationFrame((time) => this.update(time));
  }

  public start() {
    if (!this.animationFrameId) {
      this.lastFrameTime = 0;
      this.update();
    }
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    window.removeEventListener("resize", () => this.resizeCanvas());
  }
}
