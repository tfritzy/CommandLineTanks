import { getConnection } from "../spacetimedb-connection";
import { type EventContext } from "../../module_bindings";
import { drawAbilitySlot } from "../drawing/ui/ability-slot";
import { drawSmokescreenIcon } from "../drawing/ui/smokescreen-icon";

const MICROSECONDS_TO_SECONDS = 1_000_000;

interface Ability {
  drawIcon: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isReady: boolean) => void;
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

  public draw(ctx: CanvasRenderingContext2D, _canvasWidth: number, canvasHeight: number) {
    if (this.playerTankId === null) {
      return;
    }

    const currentTime = BigInt(Date.now() * 1000);

    const abilities: Ability[] = [
      {
        drawIcon: drawSmokescreenIcon,
        cooldownEnd: this.cooldownEnd,
        cooldownDuration: this.SMOKESCREEN_COOLDOWN_SECONDS,
      },
    ];

    const slotSize = 48;
    const gap = 8;
    const margin = 20;
    const startX = margin;
    const startY = canvasHeight - slotSize - margin;

    abilities.forEach((ability, index) => {
      const slotX = startX + index * (slotSize + gap);
      const slotY = startY;
      
      const abilityIsReady = ability.cooldownEnd <= currentTime;
      const abilityCooldownRemaining = abilityIsReady ? 0 : Number(ability.cooldownEnd - currentTime) / MICROSECONDS_TO_SECONDS;
      const abilityProgress = abilityIsReady ? 1 : Math.max(0, 1 - (abilityCooldownRemaining / ability.cooldownDuration));

      drawAbilitySlot(
        ctx,
        slotX,
        slotY,
        slotSize,
        ability.drawIcon,
        abilityProgress,
        abilityCooldownRemaining
      );
    });
  }
}
