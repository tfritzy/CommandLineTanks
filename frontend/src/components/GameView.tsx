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
import { getConnection } from "../spacetimedb-connection";
import { useWorldSwitcher } from "../hooks/useWorldSwitcher";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import {
  type EventContext,
  type SubscriptionHandle,
} from "../../module_bindings";

export default function GameView() {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const subscriptionRef = useRef<SubscriptionHandle | null>(null);
  const [isDead, setIsDead] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [worldNotFound, setWorldNotFound] = useState(false);

  const connection = getConnection();
  const isHomeworld = connection?.identity && worldId === connection.identity.toHexString();

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
        `SELECT * FROM smoke_cloud WHERE WorldId = '${worldId}'`,
        `SELECT * FROM kills WHERE WorldId = '${worldId}'`,
        `SELECT * FROM terrain_detail WHERE WorldId = '${worldId}'`,
        `SELECT * FROM world WHERE Id = '${worldId}'`,
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

    const handleTankInsert = (
      _ctx: EventContext,
      tank: Infer<typeof TankRow>
    ) => {
      if (tank.worldId !== worldId) return;

      if (!firstTankDataReceived) {
        firstTankDataReceived = true;
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
    };

    const handleTankUpdate = (
      _ctx: EventContext,
      _oldTank: Infer<typeof TankRow>,
      newTank: Infer<typeof TankRow>
    ) => {
      if (
        connection.identity &&
        newTank.owner.isEqual(connection.identity) &&
        newTank.worldId === worldId
      ) {
        setIsDead(newTank.health <= 0);
      }
    };

    const handleTankDelete = (
      _ctx: EventContext,
      tank: Infer<typeof TankRow>
    ) => {
      if (
        connection.identity &&
        tank.owner.isEqual(connection.identity) &&
        tank.worldId === worldId
      ) {
        setIsDead(false);
        setShowJoinModal(true);
      }
    };

    connection.db.tank.onInsert(handleTankInsert);
    connection.db.tank.onUpdate(handleTankUpdate);
    connection.db.tank.onDelete(handleTankDelete);

    const existingTanks = Array.from(connection.db.tank.iter()).filter(
      t => t.worldId === worldId
    );
    if (existingTanks.length > 0) {
      firstTankDataReceived = true;
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
      connection.db.tank.removeOnInsert(handleTankInsert);
      connection.db.tank.removeOnUpdate(handleTankUpdate);
      connection.db.tank.removeOnDelete(handleTankDelete);
    };
  }, [worldId]);

  useEffect(() => {
    if (!worldId) return;

    const connection = getConnection();
    if (!connection) return;

    const checkWorldExists = () => {
      const world = connection.db.world.Id.find(worldId);
      return world !== undefined;
    };

    const worldCheckTimeout = setTimeout(() => {
      const exists = checkWorldExists();
      setWorldNotFound(!exists);
    }, 1500);

    return () => {
      clearTimeout(worldCheckTimeout);
    };
  }, [worldId]);

  if (!worldId) {
    return null;
  }

  if (worldNotFound) {
    return <WorldNotFound worldId={worldId} />;
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
            backgroundColor: "#2e2e43",
          }}
        />
        {showJoinModal && (
          <JoinWorldModal
            worldId={worldId}
          />
        )}
        {!showJoinModal && isDead && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(46, 46, 67, 0.95)",
              backdropFilter: "blur(4px)",
              borderRadius: "8px",
              border: "2px solid rgba(112, 123, 137, 0.3)",
              padding: "40px 60px",
              fontFamily: "'JetBrains Mono', monospace",
              zIndex: 1000,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
              animation: "fadeIn 0.15s ease-out 1s both",
            }}
          >
            <style>{`
              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `}</style>

            <div
              style={{
                fontSize: "48px",
                fontWeight: 900,
                color: "#c06852",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: "24px",
                textShadow: "0 2px 12px rgba(192, 104, 82, 0.5)",
                lineHeight: 1,
                textAlign: "center",
              }}
            >
              ELIMINATED
            </div>

            <div
              style={{
                fontSize: "16px",
                color: "#e6eeed",
                marginBottom: "32px",
                letterSpacing: "0.05em",
                fontWeight: 300,
                textAlign: "center",
              }}
            >
              Type{" "}
              <span
                style={{
                  color: "#fceba8",
                  fontWeight: 500,
                  padding: "2px 8px",
                  background: "rgba(252, 235, 168, 0.1)",
                  borderRadius: "2px",
                }}
              >
                respawn
              </span>{" "}
              to rejoin the battle
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(112, 123, 137, 0.2)",
                paddingTop: "24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#a9bcbf",
                  marginBottom: "12px",
                  letterSpacing: "0.05em",
                  fontWeight: 300,
                }}
              >
                Invite your friends to this world
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    background: "rgba(42, 21, 45, 0.6)",
                    border: "1px solid rgba(112, 123, 137, 0.3)",
                    borderRadius: "4px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    color: "#e6eeed",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.02em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "400px",
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
                        button.style.background = "rgba(121, 150, 109, 0.4)";
                        setTimeout(() => {
                          button.textContent = originalText;
                          button.style.background =
                            "rgba(129, 54, 69, 0.6)";
                        }, 1500);
                      }
                    });
                  }}
                  style={{
                    background: "rgba(129, 54, 69, 0.6)",
                    border: "1px solid rgba(192, 104, 82, 0.4)",
                    borderRadius: "4px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    color: "#fcfbf3",
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(129, 54, 69, 0.8)";
                    e.currentTarget.style.borderColor =
                      "rgba(192, 104, 82, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    if (e.currentTarget.textContent !== "Copied!") {
                      e.currentTarget.style.background =
                        "rgba(129, 54, 69, 0.6)";
                      e.currentTarget.style.borderColor =
                        "rgba(192, 104, 82, 0.4)";
                    }
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
        <ResultsScreen worldId={worldId} />
      </div>
      <TerminalComponent worldId={worldId} />
    </div>
  );
}
