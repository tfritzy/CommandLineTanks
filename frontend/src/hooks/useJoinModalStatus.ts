import { useEffect, useState, useRef } from "react";
import { getConnection, isCurrentIdentity } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import { type EventContext } from "../../module_bindings";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

type JoinModalStatus = "loading" | "no_tank" | "has_tank";

export function useJoinModalStatus(gameId: string | undefined): JoinModalStatus {
  const [status, setStatus] = useState<JoinModalStatus>("loading");
  const subscriptionRef = useRef<TableSubscription<typeof TankRow> | null>(null);
  const worldIdRef = useRef(gameId);

  useEffect(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    worldIdRef.current = gameId;

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
      if (worldIdRef.current === gameId) {
        setStatus(newStatus);
      }
    };

    subscriptionRef.current = subscribeToTable({
      table: connection.db.tank,
      handlers: {
        onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (tank.gameId !== gameId) return;

          if (isCurrentIdentity(tank.owner)) {
            setStatusIfCurrentGame("has_tank");
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

          setStatusIfCurrentGame("no_tank");
        },
      },
    });

    const existingTank = findPlayerTank();
    if (existingTank) {
      setStatus("has_tank");
      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      };
    }

    const timeout = setTimeout(() => {
      if (worldIdRef.current !== gameId) return;

      if (findPlayerTank()) {
        setStatus("has_tank");
      } else {
        setStatus("no_tank");
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [gameId]);

  return status;
}