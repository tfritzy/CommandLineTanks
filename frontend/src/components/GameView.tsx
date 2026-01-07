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
import { COLORS, PALETTE } from "../theme/colors";
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
              const killerTank = Array.from(connection.db.tank.iter()).find(
                t => t.owner.isEqual(newTank.lastDamagedBy!)
              );
              if (killerTank) {
                setKillerName(killerTank.name);
              } else {
                const killerPlayer = Array.from(connection.db.player.iter()).find(
                  p => p.identity.isEqual(newTank.lastDamagedBy!)
                );
                if (killerPlayer) {
                  setKillerName(killerPlayer.name);
                } else {
                  setKillerName(null);
                }
              }
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <GameHeader worldId={worldId} />
        <ScoreBoard worldId={worldId} />
        {isHomeworld && <HomeworldOverlay />}
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            margin: 0,
            padding: 0,
            width: "100%",
            height: "100%",
            backgroundColor: COLORS.TERRAIN.GROUND,
          }}
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
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                background: `${PALETTE.PURPLE_VOID}d9`,
                backdropFilter: "blur(12px)",
                borderRadius: "4px",
                border: `1px solid ${PALETTE.WHITE_PURE}14`,
                padding: "24px 32px",
                fontFamily: "'JetBrains Mono', monospace",
                zIndex: 1000,
                boxShadow: `0 8px 32px ${PALETTE.BLACK_PURE}99`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: "320px",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "900",
                  color: PALETTE.RED_MUTED,
                  letterSpacing: "0.1em",
                  marginBottom: "20px",
                  textAlign: "center",
                  textShadow: `0 0 20px ${PALETTE.RED_MUTED}4d`,
                }}
              >
                ELIMINATED
              </div>

              {killerName && (
                <div
                  style={{
                    fontSize: "14px",
                    color: COLORS.UI.TEXT_DIM,
                    marginBottom: "20px",
                    textAlign: "center",
                  }}
                >
                  Killed by {killerName}
                </div>
              )}

              <div
                style={{
                  fontSize: "13px",
                  color: COLORS.TERMINAL.TEXT_DEFAULT,
                  marginBottom: "24px",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                Type{" "}
                <span
                  style={{
                    color: PALETTE.ORANGE_MEDIUM,
                    fontWeight: "700",
                    padding: "2px 6px",
                    background: `${PALETTE.ORANGE_MEDIUM}1a`,
                    borderRadius: "2px",
                  }}
                >
                  respawn
                </span>{" "}
                in the terminal to rejoin the battle
              </div>

              <div
                style={{
                  width: "100%",
                  borderTop: `1px solid ${PALETTE.WHITE_PURE}0d`,
                  paddingTop: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "9px",
                    color: COLORS.UI.TEXT_DIM,
                    letterSpacing: "0.1em",
                    fontWeight: "700",
                    textAlign: "center",
                    opacity: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  Invite Reinforcements
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      background: `${PALETTE.BLACK_PURE}33`,
                      border: `1px solid ${PALETTE.WHITE_PURE}0d`,
                      borderRadius: "4px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      color: COLORS.TERMINAL.TEXT_DIM,
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {`${window.location.origin}/world/${worldId}`}
                  </div>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/world/${worldId}`;
                      navigator.clipboard.writeText(url).then(() => {
                        const button = document.activeElement as HTMLElement;
                        if (button) {
                          const originalText = button.textContent;
                          button.textContent = "Copied!";
                          button.style.background = `${PALETTE.GREEN_HEALTH}66`;
                          setTimeout(() => {
                            button.textContent = originalText;
                            button.style.background = `${PALETTE.RED_DARK}99`;
                          }, 1500);
                        }
                      });
                    }}
                    style={{
                      background: `${PALETTE.RED_DARK}99`,
                      border: `1px solid ${PALETTE.RED_MUTED}66`,
                      borderRadius: "4px",
                      padding: "8px 16px",
                      fontSize: "12px",
                      color: COLORS.UI.TEXT_PRIMARY,
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: "pointer",
                      letterSpacing: "0.05em",
                      fontWeight: "700",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${PALETTE.RED_DARK}cc`;
                      e.currentTarget.style.borderColor = `${PALETTE.RED_MUTED}99`;
                    }}
                    onMouseLeave={(e) => {
                      if (e.currentTarget.textContent !== "Copied!") {
                        e.currentTarget.style.background = `${PALETTE.RED_DARK}99`;
                        e.currentTarget.style.borderColor = `${PALETTE.RED_MUTED}66`;
                      }
                    }}
                  >
                    Copy
                  </button>
                </div>
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
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2000,
              }}
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
