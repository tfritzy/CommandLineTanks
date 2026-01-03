import { useEffect, useState, useRef } from "react";
import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import { type EventContext } from "../../module_bindings";
import { UI_COLORS } from "../constants";

interface PlayerScore {
  id: string;
  name: string;
  kills: number;
  deaths: number;
  score: number;
  alliance: number;
  displayScore: number;
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

  const isHomeworld = connection?.identity
    ? connection.identity.toHexString().toLowerCase() === worldId
    : false;

  useEffect(() => {
    if (!connection || isHomeworld) return;

    const updatePlayerScores = () => {
      const playerMap = new Map<string, PlayerScore>();

      for (const tank of connection.db.tank.iter()) {
        if (tank.worldId !== worldId) continue;

        const score = Math.max(0, tank.kills - tank.deaths);
        const existing = playerMap.get(tank.id);

        playerMap.set(tank.id, {
          id: tank.id,
          name: tank.name,
          kills: tank.kills,
          deaths: tank.deaths,
          score: score,
          alliance: tank.alliance,
          displayScore: existing?.displayScore ?? score,
        });

        if (!existing || existing.score !== score) {
          animatingScoresRef.current.set(tank.id, {
            targetScore: score,
            startScore: existing?.displayScore ?? score,
            startTime: performance.now(),
          });
        }
      }

      const sorted = Array.from(playerMap.values()).sort(
        (a, b) => b.score - a.score
      );

      let maxAbsScore = 1;
      for (const player of sorted) {
        const absScore = Math.abs(player.score);
        if (absScore > maxAbsScore) {
          maxAbsScore = absScore;
        }
      }
      setMaxScore(maxAbsScore);
      setPlayers(sorted);
    };

    const handleTankInsert = (
      _ctx: EventContext,
      tank: Infer<typeof TankRow>
    ) => {
      if (tank.worldId === worldId) updatePlayerScores();
    };

    const handleTankUpdate = (
      _ctx: EventContext,
      _oldTank: Infer<typeof TankRow>,
      newTank: Infer<typeof TankRow>
    ) => {
      if (newTank.worldId === worldId) updatePlayerScores();
    };

    const handleTankDelete = (
      _ctx: EventContext,
      tank: Infer<typeof TankRow>
    ) => {
      if (tank.worldId === worldId) {
        animatingScoresRef.current.delete(tank.id);
        updatePlayerScores();
      }
    };

    connection.db.tank.onInsert(handleTankInsert);
    connection.db.tank.onUpdate(handleTankUpdate);
    connection.db.tank.onDelete(handleTankDelete);

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
      connection.db.tank.removeOnInsert(handleTankInsert);
      connection.db.tank.removeOnUpdate(handleTankUpdate);
      connection.db.tank.removeOnDelete(handleTankDelete);

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
      }}
    >
      {players.map((player) => {
        const barWidthPercent =
          (Math.abs(player.displayScore) / maxScore) * 100;
        const isAnimating = animatingScoresRef.current.has(player.id);
        const radius = "13px";

        return (
          <div
            key={player.id}
            style={{
              display: "flex",
              alignItems: "center",
              height: "26px",
              width: "250px",
              position: "relative",
              transform: isAnimating ? "scale(1.02)" : "scale(1)",
              transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
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
                backgroundColor: getTeamColor(player.alliance),
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
                  color: UI_COLORS.TEXT_BRIGHT,
                  fontSize: "14px",
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: "800",
                  textShadow:
                    "0 0 3px #000000, 0 0 3px #000000, 0 0 3px #000000",
                }}
              >
                {player.name} — {player.displayScore}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
