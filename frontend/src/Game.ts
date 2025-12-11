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
        tank.turretRotation,
        tank.velocity.x,
        tank.velocity.y
      );
      this.tanks.set(tank.id, newTank);
    });

    connection.db.tank.onUpdate((_ctx, _oldTank, newTank) => {
      console.log(newTank);
      const tank = this.tanks.get(newTank.id);
      if (tank) {
        tank.setPosition(newTank.positionX, newTank.positionY);
        tank.setBodyRotation(newTank.bodyRotation);
        tank.setTurretRotation(newTank.turretRotation);
        tank.setVelocity(newTank.velocity.x, newTank.velocity.y);
      }
    });

    connection.db.tank.onDelete((_ctx, tank) => {
      console.log(tank);
      this.tanks.delete(tank.id);
    });
  }

  private resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private drawGrid() {
    this.ctx.strokeStyle = "#dddddd";
    this.ctx.lineWidth = 1;

    const offset = UNIT_TO_PIXEL / 2;

    for (let x = offset; x <= this.canvas.width; x += UNIT_TO_PIXEL) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = offset; y <= this.canvas.height; y += UNIT_TO_PIXEL) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
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

    this.drawGrid();

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
