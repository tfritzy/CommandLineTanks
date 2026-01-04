import { useEffect, useState, useMemo } from "react";
import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import ScoreRow from "../../module_bindings/score_type";
import WorldRow from "../../module_bindings/world_type";
import { type EventContext } from "../../module_bindings";
import { COLORS } from "../theme/colors";

const COUNTDOWN_WARNING_SECONDS = 10;

interface GameHeaderProps {
  worldId: string;
}

export default function GameHeader({ worldId }: GameHeaderProps) {
  const [team0Kills, setTeam0Kills] = useState(0);
  const [team1Kills, setTeam1Kills] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const connection = getConnection();
  const isHomeworld = useMemo(() => {
    if (!connection?.identity) return false;
    const identityString = connection.identity.toHexString().toLowerCase();
    return identityString === worldId;
  }, [connection, worldId]);

  useEffect(() => {
    if (!connection || isHomeworld) return;

    const subscriptionHandle = connection
      .subscriptionBuilder()
      .onError((e) => console.error("Game header subscription error", e))
      .subscribe([
        `SELECT * FROM score WHERE WorldId = '${worldId}'`,
        `SELECT * FROM world WHERE Id = '${worldId}'`,
      ]);

    const updateScores = () => {
      const score = connection.db.score.WorldId.find(worldId);
      if (score) {
        setTeam0Kills(score.kills[0] || 0);
        setTeam1Kills(score.kills[1] || 0);
      }
    };

    const updateTimer = () => {
      const world = connection.db.world.Id.find(worldId);
      if (world && world.gameState.tag === "Playing") {
        setIsVisible(true);
        const currentTime = BigInt(Date.now() * 1000);
        const gameElapsedMicros = Number(currentTime - world.gameStartedAt);
        const gameDurationMicros = Number(world.gameDurationMicros);
        const remainingMicros = Math.max(
          0,
          gameDurationMicros - gameElapsedMicros
        );
        const remainingSeconds = Math.floor(remainingMicros / 1_000_000);
        setTimeRemaining(remainingSeconds);
      } else {
        setIsVisible(false);
      }
    };

    updateScores();
    updateTimer();

    const interval = setInterval(() => {
      updateTimer();
    }, 1000);

    connection.db.score.onUpdate(
      (
        _ctx: EventContext,
        _oldScore: Infer<typeof ScoreRow>,
        newScore: Infer<typeof ScoreRow>
      ) => {
        if (newScore.worldId === worldId) {
          updateScores();
        }
      }
    );

    connection.db.world.onUpdate(
      (
        _ctx: EventContext,
        _oldWorld: Infer<typeof WorldRow>,
        newWorld: Infer<typeof WorldRow>
      ) => {
        if (newWorld.id === worldId) {
          updateTimer();
        }
      }
    );

    connection.db.world.onInsert(
      (_ctx: EventContext, world: Infer<typeof WorldRow>) => {
        if (world.id === worldId) {
          updateTimer();
        }
      }
    );

    return () => {
      clearInterval(interval);
      subscriptionHandle.unsubscribe();
    };
  }, [worldId, connection, isHomeworld]);

  if (!isVisible || timeRemaining === null || isHomeworld) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const showCountdownWarning =
    timeRemaining <= COUNTDOWN_WARNING_SECONDS && timeRemaining > 0;

  return (
    <>
      <div
        style={
          {
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            zIndex: 1000,
          } as React.CSSProperties
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            height: "26px",
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))",
          }}
        >
          <div
            style={{
              backgroundColor: COLORS.UI.TEAM_RED_DARK,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.UI.TEXT_PRIMARY,
              fontSize: "20px",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: "700",
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 8px 100%)",
              minWidth: "45px",
            }}
          >
            {team0Kills}
          </div>
          <div
            style={{
              backgroundColor: COLORS.UI.BACKGROUND_DARK,
              padding: "6px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.TERMINAL.TEXT_DEFAULT,
              fontSize: "13px",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: "600",
              minWidth: "50px",
            }}
          >
            {timeString}
          </div>
          <div
            style={{
              backgroundColor: COLORS.UI.TEAM_BLUE_DARK,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.UI.TEXT_PRIMARY,
              fontSize: "20px",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: "700",
              clipPath: "polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
              minWidth: "45px",
            }}
          >
            {team1Kills}
          </div>
        </div>
      </div>
      {showCountdownWarning && (
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2000,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "32px",
            fontWeight: 500,
            color: COLORS.UI.TEXT_PRIMARY,
            textAlign: "center",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
          }}
        >
          Game ending in {timeRemaining}
        </div>
      )}
    </>
  );
}
