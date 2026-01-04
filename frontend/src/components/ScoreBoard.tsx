import { useEffect, useState, useRef } from "react";
import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import { type EventContext } from "../../module_bindings";
import { COLORS } from "../theme/colors";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";
import { motion, AnimatePresence } from "framer-motion";

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

interface AnimatingScore {
  targetScore: number;
  startScore: number;
  startTime: number;
}

export default function ScoreBoard({ worldId }: ScoreBoardProps) {
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const [maxScore, setMaxScore] = useState(1);
  const connection = getConnection();
  const animatingScoresRef = useRef<Map<string, AnimatingScore>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const subscriptionRef = useRef<TableSubscription<typeof TankRow> | null>(null);

  const isHomeworld = connection?.identity
    ? connection.identity.toHexString().toLowerCase() === worldId
    : false;

  useEffect(() => {
    if (!connection || isHomeworld) return;

    const updatePlayerScores = () => {
      const playerMap = new Map<string, PlayerScore>();

      for (const tank of connection.db.tank.iter()) {
        if (tank.worldId !== worldId) continue;

        const existing = playerMap.get(tank.id);

        playerMap.set(tank.id, {
          id: tank.id,
          name: tank.name,
          kills: tank.kills,
          deaths: tank.deaths,
          killStreak: tank.killStreak,
          alliance: tank.alliance,
          displayScore: existing?.displayScore ?? tank.killStreak,
          owner: tank.owner.toString(),
        });

        if (!existing || existing.killStreak !== tank.killStreak) {
          animatingScoresRef.current.set(tank.id, {
            targetScore: tank.killStreak,
            startScore: existing?.displayScore ?? tank.killStreak,
            startTime: performance.now(),
          });
        }
      }

      const sorted = Array.from(playerMap.values()).sort(
        (a, b) => b.killStreak - a.killStreak
      );

      let maxAbsScore = 1;
      for (const player of sorted) {
        const absScore = Math.abs(player.killStreak);
        if (absScore > maxAbsScore) {
          maxAbsScore = absScore;
        }
      }
      setMaxScore(maxAbsScore);
      setPlayers(sorted);
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
          if (tank.worldId === worldId) {
            animatingScoresRef.current.delete(tank.id);
            updatePlayerScores();
          }
        }
      },
      loadInitialData: false
    });

    updatePlayerScores();

    const animate = (currentTime: number) => {
      let hasAnimations = false;
      const duration = 600;

      setPlayers((prevPlayers) => {
        const updated = prevPlayers.map((player) => {
          const anim = animatingScoresRef.current.get(player.id);
          if (!anim) return player;

          const elapsed = currentTime - anim.startTime;
          const progress = Math.min(elapsed / duration, 1);

          if (progress >= 1) {
            animatingScoresRef.current.delete(player.id);
            return { ...player, displayScore: anim.targetScore };
          }

          hasAnimations = true;
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          const displayScore = Math.round(
            anim.startScore +
              (anim.targetScore - anim.startScore) * easeOutCubic
          );

          return { ...player, displayScore };
        });

        return updated;
      });

      if (hasAnimations) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [worldId, connection, isHomeworld]);

  useEffect(() => {
    const animate = (currentTime: number) => {
      let hasAnimations = false;

      setPlayers((prevPlayers) => {
        const duration = 600;
        const updated = prevPlayers.map((player) => {
          const anim = animatingScoresRef.current.get(player.id);
          if (!anim) return player;

          const elapsed = currentTime - anim.startTime;
          const progress = Math.min(elapsed / duration, 1);

          if (progress >= 1) {
            animatingScoresRef.current.delete(player.id);
            return { ...player, displayScore: anim.targetScore };
          }

          hasAnimations = true;
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          const displayScore = Math.round(
            anim.startScore +
              (anim.targetScore - anim.startScore) * easeOutCubic
          );

          return { ...player, displayScore };
        });

        return updated;
      });

      if (hasAnimations) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    if (
      animatingScoresRef.current.size > 0 &&
      animationFrameRef.current === null
    ) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [players]);

  if (isHomeworld || players.length === 0) {
    return null;
  }

  const getTeamColor = (alliance: number) => {
    return alliance === 0
      ? "rgba(157, 67, 67, 0.8)"
      : "rgba(90, 120, 178, 0.8)";
  };

  const getBarColor = (player: PlayerScore) => {
    const currentPlayerIdentity = connection?.identity?.toString();
    const isOwnTank =
      currentPlayerIdentity && player.owner === currentPlayerIdentity;

    if (isOwnTank) {
      return getTeamColor(player.alliance);
    }
    return "rgba(112, 123, 137, 0.8)";
  };

  const currentPlayerIdentity = connection?.identity?.toString();
  const top3 = players.slice(0, 3);
  const currentPlayer = players.find((p) => p.owner === currentPlayerIdentity);
  const isPlayerInTop3 = top3.some((p) => p.owner === currentPlayerIdentity);

  const renderPlayerRow = (player: PlayerScore) => {
    const barWidthPercent = (Math.abs(player.displayScore) / maxScore) * 100;
    const isAnimating = animatingScoresRef.current.has(player.id);
    const radius = "11px";

    return (
      <motion.div
        key={player.id}
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{
          layout: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        style={{
          display: "flex",
          alignItems: "center",
          height: "22px",
          width: "220px",
          position: "relative",
          transform: isAnimating ? "scale(1.02)" : "scale(1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            height: "100%",
            width: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            borderRadius: radius,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "1.5px",
            top: "1.5px",
            height: "calc(100% - 3px)",
            width: `calc(${barWidthPercent}% - 3px)`,
            backgroundColor: getBarColor(player),
            borderRadius: "calc(" + radius + " - 1.5px)",
            transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <span
            style={{
              color: COLORS.UI.TEXT_PRIMARY,
              fontSize: "12px",
              fontFamily: "Poppins, sans-serif",
              fontWeight: "800",
              textShadow: "0 0 3px #000000, 0 0 3px #000000, 0 0 3px #000000",
            }}
          >
            {player.name} — {player.displayScore}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          color: COLORS.UI.TEXT_PRIMARY,
          fontSize: "12px",
          fontFamily: "Poppins, sans-serif",
          fontWeight: "900",
          letterSpacing: "0.1em",
          textShadow: "0 0 4px rgba(0,0,0,0.5)",
          marginBottom: "2px",
          marginLeft: "10px",
        }}
      >
        KILL STREAK
      </div>
      <AnimatePresence mode="popLayout">
        {top3.map(renderPlayerRow)}
        {currentPlayer && !isPlayerInTop3 && (
          <motion.div
            key="player-divider-group"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              width: "100%",
            }}
          >
            <div
              style={{
                height: "1px",
                width: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                margin: "5px 0",
              }}
            />
            {renderPlayerRow(currentPlayer)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
