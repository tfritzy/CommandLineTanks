import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Game } from "../game";
import TerminalComponent from "./terminal/Terminal";
import ResultsScreen from "./ResultsScreen";
import GameHeader from "./GameHeader";
import ScoreBoard from "./ScoreBoard";
import JoinWorldModal from "./JoinWorldModal";
import WorldNotFound from "./WorldNotFound";
import EliminatedModal from "./EliminatedModal";
import HomeworldOverlay from "./HomeworldOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { getConnection, getIdentityHex, isCurrentIdentity, areIdentitiesEqual, setPendingJoinCode } from "../spacetimedb-connection";
import { useWorldSwitcher } from "../hooks/useWorldSwitcher";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import { World } from "../../module_bindings";
import {
  type EventContext,
  type SubscriptionHandle,
} from "../../module_bindings";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

export default function GameView() {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const subscriptionRef = useRef<SubscriptionHandle | null>(null);
  const tankSubscriptionRef = useRef<TableSubscription<typeof TankRow> | null>(null);
  const joinModalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const worldCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDead, setIsDead] = useState(false);
  const [killerName, setKillerName] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [worldNotFound, setWorldNotFound] = useState(false);

  const myIdentity = getIdentityHex();
  const isHomeworld = myIdentity && worldId?.toLowerCase() === myIdentity.toLowerCase();

  const handleWorldChange = (newWorldId: string) => {
    if (newWorldId !== worldId) {
      console.log("Switch to", newWorldId);
      navigate(`/world/${newWorldId}`);
    }
  };

  useWorldSwitcher(handleWorldChange, worldId || null);

  useEffect(() => {
    if (!worldId) return;

    const connection = getConnection();
    if (!connection) return;

    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = connection
      .subscriptionBuilder()
      .onError((e) => console.error("Subscription error", e))
      .subscribe([
        `SELECT * FROM tank WHERE WorldId = '${worldId}'`,
        `SELECT * FROM tank_path WHERE WorldId = '${worldId}' AND Owner = '${connection.identity}'`,
        `SELECT * FROM tank_transform WHERE WorldId = '${worldId}'`,
        `SELECT * FROM projectile WHERE WorldId = '${worldId}'`,
        `SELECT * FROM projectile_transform WHERE WorldId = '${worldId}'`,
        `SELECT * FROM pickup WHERE WorldId = '${worldId}'`,
        `SELECT * FROM kills WHERE WorldId = '${worldId}'`,
        `SELECT * FROM tank_fire_state WHERE WorldId = '${worldId}'`,
        `SELECT * FROM terrain_detail WHERE WorldId = '${worldId}'`,
        `SELECT * FROM world WHERE Id = '${worldId}'`,
        `SELECT * FROM score WHERE WorldId = '${worldId}'`,
        `SELECT * FROM player WHERE Identity = '${connection.identity}'`,
      ]);

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [worldId]);

  useEffect(() => {
    if (!canvasRef.current || !worldId) return;

    gameRef.current?.destroy();
    gameRef.current = new Game(canvasRef.current, worldId);
    gameRef.current.start();

    return () => {
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [worldId]);

  useEffect(() => {
    if (!worldId) return;

    const connection = getConnection();
    if (!connection) return;

    let hasReceivedPlayerTankData = false;
    let firstTankDataReceived = false;
    let playerTankId: string | null = null;

    const checkForTank = () => {
      for (const tank of connection.db.tank.iter()) {
        if (
          isCurrentIdentity(tank.owner) &&
          tank.worldId === worldId
        ) {
          hasReceivedPlayerTankData = true;
          playerTankId = tank.id;
          setShowJoinModal(false);
          setIsDead(tank.health <= 0);
          return true;
        }
      }
      return false;
    };

    tankSubscriptionRef.current = subscribeToTable({
      table: connection.db.tank,
      handlers: {
        onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (tank.worldId !== worldId) return;

          if (!firstTankDataReceived) {
            firstTankDataReceived = true;
            if (joinModalTimeoutRef.current) {
              clearTimeout(joinModalTimeoutRef.current);
            }
            joinModalTimeoutRef.current = setTimeout(() => {
              if (!hasReceivedPlayerTankData) {
                if (!checkForTank()) {
                  setShowJoinModal(true);
                }
              }
            }, 500);
          }

          if (isCurrentIdentity(tank.owner)) {
            hasReceivedPlayerTankData = true;
            playerTankId = tank.id;
            setShowJoinModal(false);
            setIsDead(tank.health <= 0);
          }
        },
        onUpdate: (_ctx: EventContext, oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
          if (newTank.worldId !== worldId) return;
          if (playerTankId !== newTank.id) return;

          const wasDead = oldTank.health <= 0;
          const isNowDead = newTank.health <= 0;

          if (!wasDead && isNowDead && newTank.lastDamagedBy) {
            let killerNameFound: string | null = null;

            for (const t of connection.db.tank.iter()) {
              if (t.worldId === worldId && areIdentitiesEqual(t.owner, newTank.lastDamagedBy)) {
                killerNameFound = t.name;
                break;
              }
            }

            if (!killerNameFound) {
              for (const player of connection.db.player.iter()) {
                if (areIdentitiesEqual(player.identity, newTank.lastDamagedBy)) {
                  killerNameFound = player.name ?? null;
                  break;
                }
              }
            }

            setKillerName(killerNameFound);
          } else if (!isNowDead) {
            setKillerName(null);
          }

          setIsDead(isNowDead);
        },
        onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (
            isCurrentIdentity(tank.owner) &&
            tank.worldId === worldId
          ) {
            setIsDead(false);
            setShowJoinModal(true);
            playerTankId = null;
          }
        }
      }
    });

    const existingTanks = Array.from(connection.db.tank.iter()).filter(
      t => t.worldId === worldId
    );
    if (existingTanks.length > 0) {
      firstTankDataReceived = true;
      if (joinModalTimeoutRef.current) {
        clearTimeout(joinModalTimeoutRef.current);
      }
      joinModalTimeoutRef.current = setTimeout(() => {
        if (!hasReceivedPlayerTankData) {
          if (!checkForTank()) {
            setShowJoinModal(true);
          }
        }
      }, 500);
    }

    checkForTank();

    return () => {
      if (joinModalTimeoutRef.current) {
        clearTimeout(joinModalTimeoutRef.current);
      }
      if (tankSubscriptionRef.current) {
        tankSubscriptionRef.current.unsubscribe();
        tankSubscriptionRef.current = null;
      }
    };
  }, [worldId]);

  useEffect(() => {
    if (!worldId) return;

    const connection = getConnection();
    if (!connection) return;

    setWorldNotFound(false);

    const check = () => {
      const world = connection.db.world.Id.find(worldId);
      if (world) {
        setWorldNotFound(false);
      } else {
        setWorldNotFound(true);
      }
    };

    worldCheckTimeoutRef.current = setTimeout(check, 1500);

    const handleWorldInsert = (_ctx: EventContext, world: Infer<typeof World>) => {
      if (world.id === worldId) {
        setWorldNotFound(false);
      }
    };

    connection.db.world.onInsert(handleWorldInsert);

    return () => {
      if (worldCheckTimeoutRef.current) {
        clearTimeout(worldCheckTimeoutRef.current);
      }
      if (connection) {
        connection.db.world.removeOnInsert(handleWorldInsert);
      }
    };
  }, [worldId]);

  useEffect(() => {
    if (!worldId || !isHomeworld) return;

    const connection = getConnection();
    if (!connection) return;

    setPendingJoinCode(worldId);
    
    connection.reducers.ensureHomeworld({ worldId, joinCode: worldId });
    console.log(`Called ensureHomeworld for worldId: ${worldId}`);
  }, [worldId, isHomeworld]);

  if (!worldId) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen w-screen m-0 p-0 overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        <GameHeader worldId={worldId} />
        <ScoreBoard worldId={worldId} />
        {isHomeworld && <HomeworldOverlay />}
        <canvas
          ref={canvasRef}
          className="block m-0 p-0 w-full h-full bg-palette-ground-dark"
        />
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'radial-gradient(circle, transparent 50%, rgba(42, 21, 45, 0.2) 100%)'
          }}
        />
        {showJoinModal && (
          <JoinWorldModal
            worldId={worldId}
          />
        )}
        <AnimatePresence>
          {!showJoinModal && isDead && (
            <EliminatedModal killerName={killerName} worldId={worldId} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {worldNotFound && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[2000]"
            >
              <WorldNotFound worldId={worldId} />
            </motion.div>
          )}
        </AnimatePresence>
        <ResultsScreen worldId={worldId} />
      </div>
      <TerminalComponent worldId={worldId} />
    </div>
  );
}
