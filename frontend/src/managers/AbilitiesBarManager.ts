import { getConnection } from "../spacetimedb-connection";
import { type EventContext } from "../../module_bindings";
import { drawAbilitySlot } from "../drawing/ui/ability-slot";

interface Ability {
  icon: string;
  cooldownEnd: bigint;
  cooldownDuration: number;
}

export class AbilitiesBarManager {
  private cooldownEnd: bigint = 0n;
  private playerTankId: string | null = null;
  private readonly SMOKESCREEN_COOLDOWN_SECONDS = 60;

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

  public draw(ctx: CanvasRenderingContext2D, _canvasWidth: number, _canvasHeight: number) {
    if (this.playerTankId === null) {
      return;
    }

    const currentTime = BigInt(Date.now() * 1000);

    const abilities: Ability[] = [
      {
        icon: "🌫️",
        cooldownEnd: this.cooldownEnd,
        cooldownDuration: this.SMOKESCREEN_COOLDOWN_SECONDS,
      },
    ];

    const slotSize = 48;
    const gap = 8;
    const margin = 20;
    const startX = margin;
    const startY = margin;

    abilities.forEach((ability, index) => {
      const slotX = startX;
      const slotY = startY + index * (slotSize + gap);
      
      const abilityIsReady = ability.cooldownEnd <= currentTime;
      const abilityCooldownRemaining = abilityIsReady ? 0 : Number(ability.cooldownEnd - currentTime) / 1_000_000;
      const abilityProgress = abilityIsReady ? 1 : Math.max(0, 1 - (abilityCooldownRemaining / ability.cooldownDuration));

      drawAbilitySlot(
        ctx,
        slotX,
        slotY,
        slotSize,
        ability.icon,
        abilityProgress,
        abilityCooldownRemaining
      );
    });
  }
}
