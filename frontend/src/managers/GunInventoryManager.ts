import { type Infer } from "spacetimedb";
import { getConnection, isCurrentIdentity } from "../spacetimedb-connection";
import Gun from "../../module_bindings/gun_type";
import { type EventContext } from "../../module_bindings";
import TankRow from "../../module_bindings/tank_type";
import TankGunRow from "../../module_bindings/tank_gun_table";
import { redTeamPickupTextureCache, blueTeamPickupTextureCache } from "../textures";
import { createMultiTableSubscription, type MultiTableSubscription } from "../utils/tableSubscription";
import { getTankGuns } from "../utils/tankHelpers";

export class GunInventoryManager {
  private guns: Infer<typeof Gun>[] = [];
  private selectedGunIndex: number = 0;
  private playerTankId: string | null = null;
  private playerAlliance: number = 0;
  private subscription: MultiTableSubscription | null = null;
  private gameId: string;

  constructor(gameId: string) {
    this.gameId = gameId;
    this.subscribeToPlayerTank(gameId);
  }

  private subscribeToPlayerTank(gameId: string) {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to tank: connection not available");
      return;
    }

    this.subscription = createMultiTableSubscription()
      .add<typeof TankRow>({
        table: connection.db.tank,
        handlers: {
          onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (tank.gameId !== gameId) return;
            if (isCurrentIdentity(tank.owner)) {
              this.playerTankId = tank.id;
              this.playerAlliance = tank.alliance;
              this.loadGuns(tank.id);
              this.selectedGunIndex = tank.selectedGunIndex;
            }
          },
          onUpdate: (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
            if (newTank.gameId !== this.gameId) return;
            if (this.playerTankId === newTank.id) {
              this.playerAlliance = newTank.alliance;
              this.selectedGunIndex = newTank.selectedGunIndex;
            }
          },
          onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (tank.gameId !== this.gameId) return;
            if (this.playerTankId === tank.id) {
              this.playerTankId = null;
              this.guns.length = 0;
              this.selectedGunIndex = 0;
            }
          }
        }
      })
      .add<typeof TankGunRow>({
        table: connection.db.tankGun,
        handlers: {
          onInsert: (_ctx: EventContext, tankGun: Infer<typeof TankGunRow>) => {
            if (tankGun.gameId !== this.gameId) return;
            if (this.playerTankId === tankGun.tankId) {
              this.loadGuns(tankGun.tankId);
            }
          },
          onUpdate: (_ctx: EventContext, _oldGun: Infer<typeof TankGunRow>, newGun: Infer<typeof TankGunRow>) => {
            if (newGun.gameId !== this.gameId) return;
            if (this.playerTankId === newGun.tankId) {
              this.loadGuns(newGun.tankId);
            }
          },
          onDelete: (_ctx: EventContext, tankGun: Infer<typeof TankGunRow>) => {
            if (tankGun.gameId !== this.gameId) return;
            if (this.playerTankId === tankGun.tankId) {
              this.loadGuns(tankGun.tankId);
            }
          }
        }
      });
  }

  private loadGuns(tankId: string) {
    const guns = getTankGuns(tankId);
    this.guns.length = 0;
    for (const gun of guns) {
      this.guns.push(gun);
    }
  }

  public destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.guns.length = 0;
    this.playerTankId = null;
  }

  private drawGunGraphic(
    ctx: CanvasRenderingContext2D,
    gun: Infer<typeof Gun>,
    x: number,
    y: number,
    size: number
  ) {
    ctx.save();
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    const textureCache = this.playerAlliance === 0 ? redTeamPickupTextureCache : blueTeamPickupTextureCache;

    textureCache.draw(ctx, gun.gunType.tag, centerX, centerY);

    ctx.restore();
  }

  private drawSlot(
    ctx: CanvasRenderingContext2D,
    gun: Infer<typeof Gun> | null,
    slotIndex: number,
    x: number,
    y: number,
    slotSize: number
  ) {
    const isSelected = this.selectedGunIndex === slotIndex && gun !== null;

    ctx.save();

    ctx.fillStyle = gun ? "#4a4b5b" : "#2a152d";
    ctx.globalAlpha = gun ? 0.8 : 0.3;

    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + slotSize - radius, y);
    ctx.quadraticCurveTo(x + slotSize, y, x + slotSize, y + radius);
    ctx.lineTo(x + slotSize, y + slotSize - radius);
    ctx.quadraticCurveTo(
      x + slotSize,
      y + slotSize,
      x + slotSize - radius,
      y + slotSize
    );
    ctx.lineTo(x + radius, y + slotSize);
    ctx.quadraticCurveTo(x, y + slotSize, x, y + slotSize - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isSelected ? "#fceba8" : "#4a4b5b";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
    ctx.stroke();

    if (gun) {
      this.drawGunGraphic(ctx, gun, x, y, slotSize);

      ctx.fillStyle = "#fcfbf3";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      if (gun.ammo != null) {
        ctx.fillText(gun.ammo.toString(), x + slotSize - 4, y + slotSize - 3);
      } else {
        ctx.fillText("∞", x + slotSize - 4, y + slotSize - 3);
      }
    }

    ctx.fillStyle = isSelected ? "#fceba8" : "#a9bcbf";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText((slotIndex + 1).toString(), x + 4, y + 4);

    ctx.restore();
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.guns.length === 0) {
      return;
    }

    ctx.save();

    const maxSlots = 3;
    const totalHeight = 150;
    const gap = 6;
    const slotSize = (totalHeight - gap * (maxSlots - 1)) / maxSlots;
    const miniMapMaxSize = 150;
    const miniMapMargin = 20;

    const startX = canvasWidth - miniMapMaxSize - miniMapMargin - slotSize - 12;
    const startY = canvasHeight - totalHeight - miniMapMargin;

    for (let i = 0; i < maxSlots; i++) {
      const slotX = startX;
      const slotY = startY + i * (slotSize + gap);
      const gun = i < this.guns.length ? this.guns[i] : null;
      this.drawSlot(ctx, gun, i, slotX, slotY, slotSize);
    }

    ctx.restore();
  }
}
