import { getConnection } from "../spacetimedb-connection";
import { type EventContext } from "../../module_bindings";

export class SmokescreenHudManager {
  private cooldownEnd: bigint = 0n;
  private playerTankId: string | null = null;

  constructor(worldId: string) {
    this.subscribeToPlayerTank(worldId);
  }

  private subscribeToPlayerTank(worldId: string) {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to tank: connection not available");
      return;
    }

    connection.db.tank.onInsert((_ctx: EventContext, tank) => {
      if (connection.identity && tank.owner.isEqual(connection.identity) && tank.worldId === worldId) {
        this.playerTankId = tank.id;
        this.cooldownEnd = tank.smokescreenCooldownEnd;
      }
    });

    connection.db.tank.onUpdate((_ctx: EventContext, _oldTank, newTank) => {
      if (connection.identity && newTank.owner.isEqual(connection.identity) && newTank.worldId === worldId) {
        this.cooldownEnd = newTank.smokescreenCooldownEnd;
      }
    });

    connection.db.tank.onDelete((_ctx: EventContext, tank) => {
      if (this.playerTankId === tank.id) {
        this.playerTankId = null;
        this.cooldownEnd = 0n;
      }
    });
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    if (this.playerTankId === null) {
      return;
    }

    const currentTime = BigInt(Date.now() * 1000);
    const isReady = this.cooldownEnd <= currentTime;
    const cooldownRemaining = isReady ? 0 : Number(this.cooldownEnd - currentTime) / 1_000_000;

    const progress = isReady ? 1 : Math.max(0, 1 - (cooldownRemaining / 60));
    const cooldownText = isReady ? 'READY' : `${Math.ceil(cooldownRemaining)}s`;

    ctx.save();

    const width = 120;
    const height = 36;
    const x = canvasWidth / 2 - width / 2;
    const y = canvasHeight - height - 20;
    const radius = 8;

    ctx.fillStyle = '#34404f';
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#4a4b5b';
    ctx.lineWidth = 2;
    ctx.stroke();

    const progressBarWidth = width * progress;
    ctx.fillStyle = isReady ? 'rgba(90, 120, 178, 0.3)' : 'rgba(112, 123, 137, 0.3)';
    ctx.fillRect(x, y, progressBarWidth, height);

    ctx.fillStyle = isReady ? '#aaeeea' : '#a9bcbf';
    ctx.font = 'bold 14px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(`🌫️ ${cooldownText}`, x + width / 2, y + height / 2);
    ctx.fillText(`🌫️ ${cooldownText}`, x + width / 2, y + height / 2);

    ctx.restore();
  }
}
