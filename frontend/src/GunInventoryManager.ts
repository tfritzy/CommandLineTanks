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

  private getGunLabel(gun: GunData): string {
    const gunTypeName = gun.gunType.tag;
    const ammoText = gun.ammo !== null && gun.ammo !== undefined ? ` (${gun.ammo})` : '';
    return gunTypeName + ammoText;
  }

  private getGunColor(gun: GunData): string {
    switch (gun.gunType.tag) {
      case 'Base':
        return '#888888';
      case 'TripleShooter':
        return '#ff9900';
      case 'MissileLauncher':
        return '#ff0000';
      default:
        return '#888888';
    }
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

    if (isSelected) {
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 10;
    }

    ctx.strokeStyle = isSelected ? '#ffff00' : '#666666';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.fillStyle = gun ? this.getGunColor(gun) : '#333333';
    ctx.globalAlpha = gun ? 1 : 0.3;

    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + slotSize - radius, y);
    ctx.quadraticCurveTo(x + slotSize, y, x + slotSize, y + radius);
    ctx.lineTo(x + slotSize, y + slotSize - radius);
    ctx.quadraticCurveTo(x + slotSize, y + slotSize, x + slotSize - radius, y + slotSize);
    ctx.lineTo(x + radius, y + slotSize);
    ctx.quadraticCurveTo(x, y + slotSize, x, y + slotSize - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    if (gun) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      const label = this.getGunLabel(gun);
      const words = label.split(' ');
      const centerY = y + slotSize / 2;
      
      if (words.length > 1) {
        ctx.fillText(words[0], x + slotSize / 2, centerY - 5);
        ctx.fillText(words[1], x + slotSize / 2, centerY + 5);
      } else {
        ctx.fillText(label, x + slotSize / 2, centerY);
      }

      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.fillStyle = gun ? '#ffffff' : '#666666';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = gun ? '#000000' : 'transparent';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText((slotIndex + 1).toString(), x + slotSize - 4, y + slotSize - 4);

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
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;

    const containerRadius = 8;
    ctx.beginPath();
    ctx.moveTo(containerX + containerRadius, containerY);
    ctx.lineTo(containerX + totalWidth - containerRadius, containerY);
    ctx.quadraticCurveTo(containerX + totalWidth, containerY, containerX + totalWidth, containerY + containerRadius);
    ctx.lineTo(containerX + totalWidth, containerY + slotSize + padding * 2 - containerRadius);
    ctx.quadraticCurveTo(containerX + totalWidth, containerY + slotSize + padding * 2, containerX + totalWidth - containerRadius, containerY + slotSize + padding * 2);
    ctx.lineTo(containerX + containerRadius, containerY + slotSize + padding * 2);
    ctx.quadraticCurveTo(containerX, containerY + slotSize + padding * 2, containerX, containerY + slotSize + padding * 2 - containerRadius);
    ctx.lineTo(containerX, containerY + containerRadius);
    ctx.quadraticCurveTo(containerX, containerY, containerX + containerRadius, containerY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < maxSlots; i++) {
      const slotX = containerX + padding + (i * (slotSize + gap));
      const slotY = containerY + padding;
      const gun = i < this.guns.length ? this.guns[i] : null;
      this.drawSlot(ctx, gun, i, slotX, slotY, slotSize);
    }

    ctx.restore();
  }
}
