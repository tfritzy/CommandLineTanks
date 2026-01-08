import { type Infer } from "spacetimedb";
import { getConnection, isCurrentIdentity } from "../spacetimedb-connection";
import Gun from "../../module_bindings/gun_type";
import { type EventContext } from "../../module_bindings";
import TankRow from "../../module_bindings/tank_type";
import { redTeamPickupTextureSheet, blueTeamPickupTextureSheet } from "../texture-sheets/PickupTextureSheet";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

export class GunInventoryManager {
  private guns: Infer<typeof Gun>[] = [];
  private selectedGunIndex: number = 0;
  private playerTankId: string | null = null;
  private playerAlliance: number = 0;
  private subscription: TableSubscription<typeof TankRow> | null = null;
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToPlayerTank(worldId);
  }

  private subscribeToPlayerTank(worldId: string) {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to tank: connection not available");
      return;
    }

    this.subscription = subscribeToTable({
      table: connection.db.tank,
      handlers: {
        onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (tank.worldId !== worldId) return;
          if (isCurrentIdentity(tank.owner)) {
            this.playerTankId = tank.id;
            this.playerAlliance = tank.alliance;
            this.guns.length = 0;
            for (let i = 0; i < tank.guns.length; i++) {
              this.guns.push(tank.guns[i]);
            }
            this.selectedGunIndex = tank.selectedGunIndex;
          }
        },
        onUpdate: (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
          if (newTank.worldId !== this.worldId) return;
          if (this.playerTankId === newTank.id) {
            this.playerAlliance = newTank.alliance;
            this.guns.length = 0;
            for (let i = 0; i < newTank.guns.length; i++) {
              this.guns.push(newTank.guns[i]);
            }
            this.selectedGunIndex = newTank.selectedGunIndex;
          }
        },
        onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (tank.worldId !== this.worldId) return;
          if (this.playerTankId === tank.id) {
            this.playerTankId = null;
            this.guns.length = 0;
            this.selectedGunIndex = 0;
          }
        }
      }
    });
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

    const textureSheet = this.playerAlliance === 0 ? redTeamPickupTextureSheet : blueTeamPickupTextureSheet;

    textureSheet.draw(ctx, gun.gunType.tag, centerX, centerY);

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
