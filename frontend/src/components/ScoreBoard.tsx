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

  const renderPlayerLine = (player: PlayerScore, isLast: boolean) => {
    const teamColors =
      player.alliance === 0
        ? { label: COLORS.GAME.TEAM_RED_BRIGHT, value: PALETTE.RED_MUTED }
        : { label: COLORS.GAME.TEAM_BLUE_BRIGHT, value: PALETTE.BLUE_INFO };

    return (
      <motion.div
        key={player.id}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        style={{
          display: "flex",
          alignItems: "center",
          height: "24px",
          width: "100%",
          gap: "8px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "13px",
          fontWeight: "600",
          marginBottom: isLast ? 0 : "2px",
        }}
      >
        <span
          style={{
            color: COLORS.UI.TEXT_PRIMARY,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            opacity: 0.9
          }}
        >
          {player.name}
        </span>
        <span
          style={{
            color: teamColors.value,
            fontWeight: "800",
            minWidth: "24px",
            textAlign: "right",
            fontVariantNumeric: "tabular-nums"
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
        top: "5px",
        ...(currentPlayer?.alliance === 0 ? { left: "5px" } : { right: "5px" }),
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        width: "200px",
      }}
    >
      <div
        style={{
          width: "100%",
          backgroundColor: `${PALETTE.PURPLE_VOID}d9`,
          backdropFilter: "blur(12px)",
          border: `1px solid ${PALETTE.WHITE_PURE}14`,
          borderRadius: "4px",
          padding: "12px",
          boxShadow: `0 8px 32px ${PALETTE.BLACK_PURE}99`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            color: COLORS.UI.TEXT_DIM,
            fontSize: "10px",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: "800",
            letterSpacing: "0.2em",
            marginBottom: "10px",
            textAlign: "center",
            opacity: 0.8,
            borderBottom: `1px solid ${PALETTE.WHITE_PURE}14`,
            paddingBottom: "6px",
            textTransform: "uppercase"
          }}
        >
          Top Streaks
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
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
                    margin: "6px 0",
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
