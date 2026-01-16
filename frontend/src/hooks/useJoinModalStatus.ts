import { useEffect, useState, useRef } from "react";
import { getConnection, isCurrentIdentity } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import TerrainDetailRow from "../../module_bindings/terrain_detail_table";
import { type EventContext } from "../../module_bindings";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

type JoinModalStatus = "loading" | "no_tank" | "has_tank";

export function useJoinModalStatus(gameId: string | undefined): JoinModalStatus {
  const [status, setStatus] = useState<JoinModalStatus>("loading");
  const tankSubscriptionRef = useRef<TableSubscription<typeof TankRow> | null>(null);
  const terrainSubscriptionRef = useRef<TableSubscription<typeof TerrainDetailRow> | null>(null);
  const gameIdRef = useRef(gameId);
  const worldLoadedRef = useRef(false);

  useEffect(() => {
    if (tankSubscriptionRef.current) {
      tankSubscriptionRef.current.unsubscribe();
      tankSubscriptionRef.current = null;
    }
    if (terrainSubscriptionRef.current) {
      terrainSubscriptionRef.current.unsubscribe();
      terrainSubscriptionRef.current = null;
    }

    gameIdRef.current = gameId;
    worldLoadedRef.current = false;

    if (!gameId) {
      setStatus("loading");
      return;
    }

    const connection = getConnection();
    if (!connection) {
      setStatus("loading");
      return;
    }

    setStatus("loading");

    const findPlayerTank = (): Infer<typeof TankRow> | null => {
      for (const tank of connection.db.tank.iter()) {
        if (isCurrentIdentity(tank.owner) && tank.gameId === gameId) {
          return tank;
        }
      }
      return null;
    };

    const setStatusIfCurrentGame = (newStatus: JoinModalStatus) => {
      if (gameIdRef.current === gameId) {
        setStatus(newStatus);
      }
    };

    const updateStatusBasedOnTanks = () => {
      if (!worldLoadedRef.current) return;
      
      const playerTank = findPlayerTank();
      if (playerTank) {
        setStatusIfCurrentGame("has_tank");
      } else {
        setStatusIfCurrentGame("no_tank");
      }
    };

    terrainSubscriptionRef.current = subscribeToTable({
      table: connection.db.terrainDetail,
      handlers: {
        onInsert: (_ctx: EventContext, terrain: Infer<typeof TerrainDetailRow>) => {
          if (terrain.gameId !== gameId) return;
          if (!worldLoadedRef.current) {
            worldLoadedRef.current = true;
            updateStatusBasedOnTanks();
          }
        },
      },
    });

    tankSubscriptionRef.current = subscribeToTable({
      table: connection.db.tank,
      handlers: {
        onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (tank.gameId !== gameId) return;
          if (isCurrentIdentity(tank.owner)) {
            setStatusIfCurrentGame("has_tank");
          } else {
            updateStatusBasedOnTanks();
          }
        },
        onUpdate: (
          _ctx: EventContext,
          _oldTank: Infer<typeof TankRow>,
          newTank: Infer<typeof TankRow>
        ) => {
          if (newTank.gameId !== gameId) return;
          if (!isCurrentIdentity(newTank.owner)) return;
          setStatusIfCurrentGame("has_tank");
        },
        onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (tank.gameId !== gameId) return;
          if (!isCurrentIdentity(tank.owner)) return;
          updateStatusBasedOnTanks();
        },
      },
    });

    for (const terrain of connection.db.terrainDetail.iter()) {
      if (terrain.gameId === gameId) {
        worldLoadedRef.current = true;
        break;
      }
    }

    if (worldLoadedRef.current) {
      const existingTank = findPlayerTank();
      if (existingTank) {
        setStatus("has_tank");
      } else {
        setStatus("no_tank");
      }
    }

    return () => {
      if (tankSubscriptionRef.current) {
        tankSubscriptionRef.current.unsubscribe();
        tankSubscriptionRef.current = null;
      }
      if (terrainSubscriptionRef.current) {
        terrainSubscriptionRef.current.unsubscribe();
        terrainSubscriptionRef.current = null;
      }
    };
  }, [gameId]);

  return status;
}