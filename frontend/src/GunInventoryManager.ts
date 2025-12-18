import { getConnection } from "./spacetimedb-connection";
import { type GunData } from "./types/gun";

export class GunInventoryManager {
  private guns: GunData[] = [];
  private selectedGunIndex: number = 0;
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

    connection.db.tank.onInsert((_ctx, tank) => {
      if (connection.identity && tank.owner.isEqual(connection.identity) && tank.worldId === worldId) {
        this.playerTankId = tank.id;
        this.guns = tank.guns;
        this.selectedGunIndex = tank.selectedGunIndex;
      }
    });

    connection.db.tank.onUpdate((_ctx, _oldTank, newTank) => {
      if (connection.identity && newTank.owner.isEqual(connection.identity) && newTank.worldId === worldId) {
        this.guns = newTank.guns;
        this.selectedGunIndex = newTank.selectedGunIndex;
      }
    });

    connection.db.tank.onDelete((_ctx, tank) => {
      if (this.playerTankId === tank.id) {
        this.playerTankId = null;
        this.guns = [];
        this.selectedGunIndex = 0;
      }
    });
  }

  private getGunColor(gun: GunData): string {
    switch (gun.gunType.tag) {
      case 'Base':
        return '#888888';
      case 'TripleShooter':
        return '#ff9900';
      case 'MissileLauncher':
        return '#ff0000';
      case 'Boomerang':
        return '#8b4513';
      default:
        return '#888888';
    }
  }

  private drawGunGraphic(ctx: CanvasRenderingContext2D, gun: GunData, x: number, y: number, size: number) {
    ctx.save();
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    switch (gun.gunType.tag) {
      case 'Base':
        ctx.fillRect(centerX - 15, centerY - 3, 25, 6);
        ctx.strokeRect(centerX - 15, centerY - 3, 25, 6);
        ctx.fillRect(centerX - 8, centerY - 6, 8, 12);
        ctx.strokeRect(centerX - 8, centerY - 6, 8, 12);
        break;
      case 'TripleShooter':
        for (let i = -1; i <= 1; i++) {
          const offsetY = i * 8;
          ctx.fillRect(centerX - 15, centerY + offsetY - 2, 25, 4);
          ctx.strokeRect(centerX - 15, centerY + offsetY - 2, 25, 4);
        }
        ctx.fillRect(centerX - 8, centerY - 6, 8, 12);
        ctx.strokeRect(centerX - 8, centerY - 6, 8, 12);
        break;
      case 'MissileLauncher':
        ctx.beginPath();
        ctx.moveTo(centerX + 10, centerY);
        ctx.lineTo(centerX - 5, centerY - 8);
        ctx.lineTo(centerX - 15, centerY - 8);
        ctx.lineTo(centerX - 15, centerY + 8);
        ctx.lineTo(centerX - 5, centerY + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(centerX - 8, centerY - 6, 8, 12);
        ctx.strokeRect(centerX - 8, centerY - 6, 8, 12);
        break;
      case 'Boomerang':
        ctx.beginPath();
        ctx.arc(centerX - 8, centerY - 5, 8, 0, Math.PI * 1.5);
        ctx.arc(centerX + 8, centerY + 5, 8, Math.PI, Math.PI * 2.5);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#654321';
        ctx.stroke();
        ctx.lineWidth = 2;
        break;
    }

    ctx.restore();
  }

  private drawSlot(
    ctx: CanvasRenderingContext2D,
    gun: GunData | null,
    slotIndex: number,
    x: number,
    y: number,
    slotSize: number
  ) {
    const isSelected = this.selectedGunIndex === slotIndex && gun !== null;

    ctx.save();

    ctx.strokeStyle = isSelected ? '#ffff00' : '#666666';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.fillStyle = gun ? this.getGunColor(gun) : '#333333';
    ctx.globalAlpha = gun ? 1 : 0.3;

    ctx.fillRect(x, y, slotSize, slotSize);
    ctx.strokeRect(x, y, slotSize, slotSize);

    ctx.globalAlpha = 1;

    if (gun) {
      this.drawGunGraphic(ctx, gun, x, y, slotSize);

      if (gun.ammo != null) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(gun.ammo.toString(), x + slotSize - 4, y + slotSize - 4);
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText((slotIndex + 1).toString(), x + 4, y + 4);

    ctx.restore();
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    if (this.guns.length === 0) {
      return;
    }

    ctx.save();

    const maxSlots = 3;
    const slotSize = 80;
    const gap = 8;
    const padding = 12;
    
    const totalWidth = (slotSize * maxSlots) + (gap * (maxSlots - 1)) + (padding * 2);
    const containerX = (canvasWidth - totalWidth) / 2;
    const containerY = canvasHeight - 100 - slotSize - padding * 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(containerX, containerY, totalWidth, slotSize + padding * 2);
    
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(containerX, containerY, totalWidth, slotSize + padding * 2);

    for (let i = 0; i < maxSlots; i++) {
      const slotX = containerX + padding + (i * (slotSize + gap));
      const slotY = containerY + padding;
      const gun = i < this.guns.length ? this.guns[i] : null;
      this.drawSlot(ctx, gun, i, slotX, slotY, slotSize);
    }

    ctx.restore();
  }
}
