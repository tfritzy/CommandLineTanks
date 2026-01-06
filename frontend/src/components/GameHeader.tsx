import { useEffect, useState, useMemo } from "react";
import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import ScoreRow from "../../module_bindings/score_type";
import WorldRow from "../../module_bindings/world_type";
import { type EventContext } from "../../module_bindings";
import { COLORS, PALETTE } from "../theme/colors";

const COUNTDOWN_WARNING_SECONDS = 10;

const HeaderBox = ({
  label,
  labelColor,
  value,
  valueColor,
}: {
  label: string;
  labelColor: string;
  value: string | number;
  valueColor: string;
}) => (
  <div
    style={{
      backgroundColor: "rgba(42, 21, 45, 0.7)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "4px",
      padding: "4px 10px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "14px",
      fontWeight: "600",
      lineHeight: "1",
      letterSpacing: "0.05em",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      height: "28px",
    }}
  >
    <span style={{ color: labelColor, display: "inline-flex", alignItems: "center" }}>{label}</span>
    <span style={{ color: valueColor, display: "inline-flex", alignItems: "center" }}>{value}</span>
  </div>
);

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
            top: "10px",
            right: "10px",
            display: "flex",
            gap: "8px",
            zIndex: 1000,
          } as React.CSSProperties
        }
      >
        <HeaderBox
          label="SCORE"
          labelColor={PALETTE.RED_MUTED}
          value={team0Kills}
          valueColor={PALETTE.ORANGE_MEDIUM}
        />
        <HeaderBox
          label="TIME"
          labelColor={COLORS.UI.LABEL_YELLOW}
          value={timeString}
          valueColor={COLORS.UI.TEXT_PRIMARY}
        />
        <HeaderBox
          label="SCORE"
          labelColor={PALETTE.BLUE_INFO}
          value={team1Kills}
          valueColor={PALETTE.BLUE_BRIGHT}
        />
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
