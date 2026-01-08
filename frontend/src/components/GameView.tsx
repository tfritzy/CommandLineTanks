import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Game } from "../game";
import TerminalComponent from "./terminal/Terminal";
import ResultsScreen from "./ResultsScreen";
import GameHeader from "./GameHeader";
import ScoreBoard from "./ScoreBoard";
import JoinWorldModal from "./JoinWorldModal";
import WorldNotFound from "./WorldNotFound";
import HomeworldOverlay from "./HomeworldOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { getConnection } from "../spacetimedb-connection";
import { useWorldSwitcher } from "../hooks/useWorldSwitcher";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import { World } from "../../module_bindings";
import {
  type EventContext,
  type SubscriptionHandle,
} from "../../module_bindings";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";
import CopyBox from "./CopyBox";

export default function GameView() {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const subscriptionRef = useRef<SubscriptionHandle | null>(null);
  const tankSubscriptionRef = useRef<TableSubscription<typeof TankRow> | null>(null);
  const [isDead, setIsDead] = useState(false);
  const [killerName, setKillerName] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [worldNotFound, setWorldNotFound] = useState(false);

  const connection = getConnection();
  const isHomeworld = connection?.identity && worldId?.toLowerCase() === connection.identity.toHexString().toLowerCase();

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
        `SELECT * FROM tank_path WHERE WorldId = '${worldId}'`,
        `SELECT * FROM projectile WHERE WorldId = '${worldId}'`,
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
    let joinModalTimeout: ReturnType<typeof setTimeout> | null = null;

    const checkForTank = () => {
      for (const tank of connection.db.tank.iter()) {
        if (
          connection.identity &&
          tank.owner.isEqual(connection.identity) &&
          tank.worldId === worldId
        ) {
          hasReceivedPlayerTankData = true;
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
            if (joinModalTimeout) {
              clearTimeout(joinModalTimeout);
            }
            joinModalTimeout = setTimeout(() => {
              if (!hasReceivedPlayerTankData) {
                if (!checkForTank()) {
                  setShowJoinModal(true);
                }
              }
            }, 500);
          }

          if (
            connection.identity &&
            tank.owner.isEqual(connection.identity)
          ) {
            hasReceivedPlayerTankData = true;
            setShowJoinModal(false);
            setIsDead(tank.health <= 0);
          }
        },
        onUpdate: (_ctx: EventContext, oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
          if (
            connection.identity &&
            newTank.owner.isEqual(connection.identity) &&
            newTank.worldId === worldId
          ) {
            const wasDead = oldTank.health <= 0;
            const isNowDead = newTank.health <= 0;
            
            if (!wasDead && isNowDead && newTank.lastDamagedBy) {
              let killerName: string | null = null;
              
              for (const tank of connection.db.tank.iter()) {
                if (tank.worldId === worldId && tank.owner.isEqual(newTank.lastDamagedBy)) {
                  killerName = tank.name;
                  break;
                }
              }
              
              if (!killerName) {
                for (const player of connection.db.player.iter()) {
                  if (player.identity.isEqual(newTank.lastDamagedBy)) {
                    killerName = player.name;
                    break;
                  }
                }
              }
              
              setKillerName(killerName);
            } else if (!isNowDead) {
              setKillerName(null);
            }
            
            setIsDead(isNowDead);
          }
        },
        onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (
            connection.identity &&
            tank.owner.isEqual(connection.identity) &&
            tank.worldId === worldId
          ) {
            setIsDead(false);
            setShowJoinModal(true);
          }
        }
      },
      loadInitialData: false
    });

    const existingTanks = Array.from(connection.db.tank.iter()).filter(
      t => t.worldId === worldId
    );
    if (existingTanks.length > 0) {
      firstTankDataReceived = true;
      if (joinModalTimeout) {
        clearTimeout(joinModalTimeout);
      }
      joinModalTimeout = setTimeout(() => {
        if (!hasReceivedPlayerTankData) {
          if (!checkForTank()) {
            setShowJoinModal(true);
          }
        }
      }, 500);
    }

    checkForTank();

    return () => {
      if (joinModalTimeout) {
        clearTimeout(joinModalTimeout);
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

    const worldCheckTimeout = setTimeout(check, 1500);

    const handleWorldInsert = (_ctx: EventContext, world: Infer<typeof World>) => {
      if (world.id === worldId) {
        setWorldNotFound(false);
      }
    };

    connection.db.world.onInsert(handleWorldInsert);

    return () => {
      clearTimeout(worldCheckTimeout);
      if (connection) {
        connection.db.world.removeOnInsert(handleWorldInsert);
      }
    };
  }, [worldId]);

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
        {showJoinModal && (
          <JoinWorldModal
            worldId={worldId}
          />
        )}
        <AnimatePresence>
          {!showJoinModal && isDead && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
              transition={{ duration: 0.2, delay: 1, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 bg-palette-purple-void/85 backdrop-blur-xl rounded border border-palette-white-pure/[0.08] py-6 px-8 font-mono z-[1000] shadow-2xl flex flex-col items-center min-w-[320px]"
            >
              <div className="text-[32px] font-black text-palette-red-muted tracking-[0.1em] mb-5 text-center" style={{ textShadow: '0 0 20px rgba(192, 104, 82, 0.3)' }}>
                ELIMINATED
              </div>

              {killerName && (
                <div className="text-sm text-ui-text-dim mb-5 text-center">
                  Killed by {killerName}
                </div>
              )}

              <div className="text-[13px] text-terminal-text-default mb-6 text-center leading-relaxed">
                Run this command to rejoin:
                <div className="mt-3">
                  <CopyBox text="respawn" showDollar={true} activeColor="#e39764" />
                </div>
              </div>

              <div className="w-full border-t border-palette-white-pure/[0.05] pt-5 flex flex-col gap-3">
                <div className="text-[9px] text-ui-text-dim tracking-[0.1em] font-bold text-center opacity-60 uppercase">
                  Invite Reinforcements
                </div>
                <CopyBox text={`${window.location.origin}/world/${worldId}`} label="COPY LINK" />
              </div>
            </motion.div>
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
