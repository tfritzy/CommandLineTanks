import { getConnection } from "../spacetimedb-connection";
import { type EventContext } from "../../module_bindings";
import { drawAbilitySlot } from "../drawing/ui/ability-slot";
import { drawSmokescreenIcon } from "../drawing/ui/smokescreen-icon";
import { drawOverdriveIcon } from "../drawing/ui/overdrive-icon";
import { drawRepairIcon } from "../drawing/ui/repair-icon";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";

const MICROSECONDS_TO_SECONDS = 1_000_000;

interface Ability {
  drawIcon: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isReady: boolean) => void;
  remainingCooldownMicros: bigint;
  cooldownDuration: number;
}

export class AbilitiesBarManager {
  private remainingSmokescreenCooldownMicros: bigint = 0n;
  private remainingOverdriveCooldownMicros: bigint = 0n;
  private remainingRepairCooldownMicros: bigint = 0n;
  private playerTankId: string | null = null;
  private readonly SMOKESCREEN_COOLDOWN_SECONDS = 60;
  private readonly OVERDRIVE_COOLDOWN_SECONDS = 60;
  private readonly REPAIR_COOLDOWN_SECONDS = 60;
  private handleTankInsert: ((ctx: EventContext, tank: Infer<typeof TankRow>) => void) | null = null;
  private handleTankUpdate: ((ctx: EventContext, oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => void) | null = null;
  private handleTankDelete: ((ctx: EventContext, tank: Infer<typeof TankRow>) => void) | null = null;

  constructor(worldId: string) {
    this.subscribeToPlayerTank(worldId);
  }

  private subscribeToPlayerTank(worldId: string) {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to tank: connection not available");
      return;
    }

    this.handleTankInsert = (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
      if (tank.worldId !== worldId) return;
      if (connection.identity && tank.owner.isEqual(connection.identity)) {
        this.playerTankId = tank.id;
        this.remainingSmokescreenCooldownMicros = tank.remainingSmokescreenCooldownMicros;
        this.remainingOverdriveCooldownMicros = tank.remainingOverdriveCooldownMicros;
        this.remainingRepairCooldownMicros = tank.remainingRepairCooldownMicros;
      }
    };

    this.handleTankUpdate = (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
      if (newTank.worldId !== worldId) return;
      if (connection.identity && newTank.owner.isEqual(connection.identity)) {
        this.remainingSmokescreenCooldownMicros = newTank.remainingSmokescreenCooldownMicros;
        this.remainingOverdriveCooldownMicros = newTank.remainingOverdriveCooldownMicros;
        this.remainingRepairCooldownMicros = newTank.remainingRepairCooldownMicros;
      }
    };

    this.handleTankDelete = (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
      if (tank.worldId !== worldId) return;
      if (this.playerTankId === tank.id) {
        this.playerTankId = null;
        this.remainingSmokescreenCooldownMicros = 0n;
        this.remainingOverdriveCooldownMicros = 0n;
        this.remainingRepairCooldownMicros = 0n;
      }
    };

    connection.db.tank.onInsert(this.handleTankInsert);
    connection.db.tank.onUpdate(this.handleTankUpdate);
    connection.db.tank.onDelete(this.handleTankDelete);

    for (const tank of connection.db.tank.iter()) {
      if (tank.worldId === worldId && connection.identity && tank.owner.isEqual(connection.identity)) {
        this.playerTankId = tank.id;
        this.remainingSmokescreenCooldownMicros = tank.remainingSmokescreenCooldownMicros;
        this.remainingOverdriveCooldownMicros = tank.remainingOverdriveCooldownMicros;
        this.remainingRepairCooldownMicros = tank.remainingRepairCooldownMicros;
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, _canvasWidth: number, canvasHeight: number) {
    if (this.playerTankId === null) {
      return;
    }

    const abilities: Ability[] = [
      {
        drawIcon: drawSmokescreenIcon,
        remainingCooldownMicros: this.remainingSmokescreenCooldownMicros,
        cooldownDuration: this.SMOKESCREEN_COOLDOWN_SECONDS,
      },
      {
        drawIcon: drawOverdriveIcon,
        remainingCooldownMicros: this.remainingOverdriveCooldownMicros,
        cooldownDuration: this.OVERDRIVE_COOLDOWN_SECONDS,
      },
      {
        drawIcon: drawRepairIcon,
        remainingCooldownMicros: this.remainingRepairCooldownMicros,
        cooldownDuration: this.REPAIR_COOLDOWN_SECONDS,
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
      
      const abilityIsReady = ability.remainingCooldownMicros <= 0n;
      const abilityCooldownRemaining = abilityIsReady ? 0 : Number(ability.remainingCooldownMicros) / MICROSECONDS_TO_SECONDS;
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

  public destroy() {
    const connection = getConnection();
    if (connection) {
      if (this.handleTankInsert) connection.db.tank.removeOnInsert(this.handleTankInsert);
      if (this.handleTankUpdate) connection.db.tank.removeOnUpdate(this.handleTankUpdate);
      if (this.handleTankDelete) connection.db.tank.removeOnDelete(this.handleTankDelete);
    }
  }
}
