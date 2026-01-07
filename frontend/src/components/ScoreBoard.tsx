import { useEffect, useState, useRef } from "react";
import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import { type EventContext } from "../../module_bindings";
import { COLORS, PALETTE } from "../theme/colors";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";
import { motion, AnimatePresence, animate } from "framer-motion";

interface PlayerScore {
  id: string;
  name: string;
  kills: number;
  deaths: number;
  killStreak: number;
  alliance: number;
  displayScore: number;
  owner: string;
}

interface ScoreBoardProps {
  worldId: string;
}

interface AnimatedScoreProps {
  value: number;
}

function AnimatedScore({ value }: AnimatedScoreProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let animation: { stop: () => void } | null = null;
    animation = animate(displayValue, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest: number) => setDisplayValue(Math.round(latest)),
    });
    return () => animation?.stop();
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function ScoreBoard({ worldId }: ScoreBoardProps) {
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const connection = getConnection();
  const subscriptionRef = useRef<TableSubscription<typeof TankRow> | null>(null);

  const isHomeworld = connection?.identity
    ? connection.identity.toHexString().toLowerCase() === worldId
    : false;

  useEffect(() => {
    if (!connection || isHomeworld) return;

    const updatePlayerScores = () => {
      const topTanks = Array.from(connection.db.tank.iter())
        .filter(t => t.worldId === worldId)
        .sort((a, b) => b.killStreak - a.killStreak);

      const mapped = topTanks.map(tank => ({
        id: tank.id,
        name: tank.name,
        kills: tank.kills,
        deaths: tank.deaths,
        killStreak: tank.killStreak,
        alliance: tank.alliance,
        displayScore: tank.killStreak,
        owner: tank.owner.toString(),
      }));

      setPlayers(mapped);
    };

    subscriptionRef.current = subscribeToTable({
      table: connection.db.tank,
      handlers: {
        onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (tank.worldId === worldId) updatePlayerScores();
        },
        onUpdate: (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
          if (newTank.worldId === worldId) updatePlayerScores();
        },
        onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (tank.worldId === worldId) updatePlayerScores();
        }
      },
      loadInitialData: false
    });

    updatePlayerScores();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [worldId, connection, isHomeworld]);


  if (isHomeworld || players.length === 0) {
    return null;
  }



  const currentPlayerIdentity = connection?.identity?.toString();
  const top3 = players.slice(0, 3);
  const currentPlayer = players.find((p) => p.owner === currentPlayerIdentity);
  const isPlayerInTop3 = top3.some((p) => p.owner === currentPlayerIdentity);
  const isRedTeam = currentPlayer?.alliance === 0;

  const renderPlayerLine = (player: PlayerScore, isLast: boolean = false) => {
    const teamColors = player.alliance === 0
      ? { label: PALETTE.RED_MUTED, value: PALETTE.ORANGE_MEDIUM }
      : { label: PALETTE.BLUE_INFO, value: PALETTE.BLUE_BRIGHT };

    return (
      <motion.div
        key={player.id}
        layout
        initial={{ opacity: 0, x: isRedTeam ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: isRedTeam ? 10 : -10 }}
        transition={{
          layout: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        style={{
          display: "flex",
          alignItems: "center",
          height: "20px",
          width: "100%",
          gap: "8px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          fontWeight: "700",
          transform: "scale(1)",
          marginBottom: isLast ? 0 : "2px",
        }}
      >
        <span
          style={{
            color: teamColors.label,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {player.name}
        </span>
        <span style={{ color: `${PALETTE.WHITE_PURE}1a` }}>—</span>
        <span
          style={{
            color: teamColors.value,
            fontWeight: "900",
            minWidth: "20px",
            textAlign: "right"
          }}
        >
          <AnimatedScore value={player.killStreak} />
        </span>
      </motion.div>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        ...(currentPlayer?.alliance === 0 ? { left: "10px" } : { right: "10px" }),
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        width: "180px",
      }}
    >
      <div
        style={{
          width: "100%",
          backgroundColor: `${PALETTE.PURPLE_VOID}d9`,
          backdropFilter: "blur(12px)",
          border: `1px solid ${PALETTE.WHITE_PURE}14`,
          borderRadius: "4px",
          padding: "8px 10px",
          boxShadow: `0 4px 16px ${PALETTE.BLACK_PURE}80`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            color: COLORS.UI.TEXT_DIM,
            fontSize: "9px",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: "700",
            letterSpacing: "0.15em",
            marginBottom: "6px",
            textAlign: "center",
            opacity: 0.6,
            borderBottom: `1px solid ${PALETTE.WHITE_PURE}0d`,
            paddingBottom: "4px",
          }}
        >
          TOP STREAKS
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <AnimatePresence mode="popLayout">
            {top3.map((player, idx) => renderPlayerLine(player, idx === top3.length - 1 && !currentPlayer))}

            {currentPlayer && !isPlayerInTop3 && (
              <motion.div
                key="divider-group"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ width: "100%" }}
              >
                <div
                  style={{
                    height: "1px",
                    width: "100%",
                    backgroundColor: `${PALETTE.WHITE_PURE}0d`,
                    margin: "4px 0",
                  }}
                />
                {renderPlayerLine(currentPlayer, true)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
