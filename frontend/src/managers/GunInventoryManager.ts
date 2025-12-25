import { type Infer } from "spacetimedb";
import { getConnection } from "../spacetimedb-connection";
import Gun from "../../module_bindings/gun_type";
import { ProjectileTextureSheet } from "./ProjectileTextureSheet";
import { NormalProjectile } from "../objects/projectiles/NormalProjectile";
import { MissileProjectile } from "../objects/projectiles/MissileProjectile";
import { RocketProjectile } from "../objects/projectiles/RocketProjectile";
import { GrenadeProjectile } from "../objects/projectiles/GrenadeProjectile";
import { BoomerangProjectile } from "../objects/projectiles/BoomerangProjectile";
import { MoagProjectile } from "../objects/projectiles/MoagProjectile";
import { SpiderMineProjectile } from "../objects/projectiles/SpiderMineProjectile";
import { Projectile } from "../objects/projectiles/Projectile";

export class GunInventoryManager {
  private guns: Infer<typeof Gun>[] = [];
  private selectedGunIndex: number = 0;
  private playerTankId: string | null = null;
  private playerAlliance: number = 0;

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
      if (
        connection.identity &&
        tank.owner.isEqual(connection.identity) &&
        tank.worldId === worldId
      ) {
        this.playerTankId = tank.id;
        this.guns = [...tank.guns];
        this.selectedGunIndex = tank.selectedGunIndex;
        this.playerAlliance = tank.alliance;
      }
    });

    connection.db.tank.onUpdate((_ctx, _oldTank, newTank) => {
      if (
        connection.identity &&
        newTank.owner.isEqual(connection.identity) &&
        newTank.worldId === worldId
      ) {
        this.guns = [...newTank.guns];
        this.selectedGunIndex = newTank.selectedGunIndex;
        this.playerAlliance = newTank.alliance;
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

    const projectile = this.createProjectileForGun(gun);

    if (projectile) {
      ctx.save();
      ctx.translate(centerX, centerY);
      const scale = 1.2;
      ctx.scale(scale, scale);
      projectile.drawBody(ctx, ProjectileTextureSheet.getInstance());
      ctx.restore();
    } else {
      ctx.fillStyle = "#fcfbf3";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", centerX, centerY);
    }

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

      if (gun.ammo != null) {
        ctx.fillStyle = "#fcfbf3";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText(gun.ammo.toString(), x + slotSize - 4, y + slotSize - 3);
      }
    }

    ctx.fillStyle = isSelected ? "#fceba8" : "#a9bcbf";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText((slotIndex + 1).toString(), x + 4, y + 4);

    ctx.restore();
  }

  private createProjectileForGun(
    gun: Infer<typeof Gun>
  ): Projectile | undefined {
    const x = 0;
    const y = 0;
    let angle = -Math.PI / 2;

    if (
      gun.projectileType.tag === "Missile" ||
      gun.projectileType.tag === "Rocket"
    ) {
      angle = -Math.PI / 4;
    }

    const velocityX = Math.cos(angle);
    const velocityY = Math.sin(angle);
    const size = gun.projectileSize;
    const alliance = this.playerAlliance;

    switch (gun.projectileType.tag) {
      case "Normal":
        return new NormalProjectile(x, y, velocityX, velocityY, size, alliance);
      case "Missile":
        return new MissileProjectile(
          x,
          y,
          velocityX,
          velocityY,
          size,
          alliance
        );
      case "Rocket":
        return new RocketProjectile(x, y, velocityX, velocityY, size, alliance);
      case "Grenade":
        return new GrenadeProjectile(
          x,
          y,
          velocityX,
          velocityY,
          size,
          alliance
        );
      case "Boomerang":
        return new BoomerangProjectile(
          x,
          y,
          velocityX,
          velocityY,
          size,
          alliance
        );
      case "Moag":
        return new MoagProjectile(x, y, velocityX, velocityY, 0.25, alliance);
      case "SpiderMine":
        return new SpiderMineProjectile(
          x,
          y,
          velocityX,
          velocityY,
          size,
          alliance
        );
      default:
        return undefined;
    }
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
