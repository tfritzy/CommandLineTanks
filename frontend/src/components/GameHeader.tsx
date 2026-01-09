import { useEffect, useState, useMemo, useRef } from "react";
import { getConnection, getIdentityHex } from "../spacetimedb-connection";
import ScoreRow from "../../module_bindings/score_type";
import WorldRow from "../../module_bindings/world_type";
import { createMultiTableSubscription, MultiTableSubscription } from "../utils/tableSubscription";
import { ServerTimeSync } from "../utils/ServerTimeSync";

const COUNTDOWN_WARNING_SECONDS = 10;

const TEAM_COLORS = {
  0: { label: '#ff5555', value: '#c06852' },
  1: { label: '#7fbbdc', value: '#7396d5' },
};

const TIME_COLORS = { label: '#f5c47c', value: '#fceba8' };

const HeaderBox = ({
  label,
  value,
  labelColor,
  valueColor,
}: {
  label: string;
  value: string | number;
  labelColor?: string;
  valueColor?: string;
}) => (
  <div className="bg-palette-slate-darkest/80 backdrop-blur-md border border-palette-white-pure/10 rounded px-3.5 py-2 flex items-center gap-2 font-mono text-sm font-semibold leading-none tracking-wide shadow-lg h-7">
    <span 
      className={`inline-flex items-center ${!labelColor ? 'text-palette-slate-lighter' : ''}`}
      style={labelColor ? { color: labelColor } : undefined}
    >
      {label}
    </span>
    <span 
      className={`inline-flex items-center ${!valueColor ? 'text-palette-white-bright' : ''}`}
      style={valueColor ? { color: valueColor } : undefined}
    >
      {value}
    </span>
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
  const subscription = useRef<MultiTableSubscription>(null);

  const connection = getConnection();
  const isHomeworld = useMemo(() => {
    if (!connection?.identity) return false;
    return worldId === getIdentityHex();
  }, [connection, worldId]);

  useEffect(() => {
    setTeam0Kills(0);
    setTeam1Kills(0);
    setTimeRemaining(null);
    setIsVisible(false);

    if (!connection || isHomeworld) return;

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
        const currentTime = BigInt(Math.floor(ServerTimeSync.getInstance().getServerTime() * 1000));
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

    subscription.current = createMultiTableSubscription()
      .add<typeof ScoreRow>({
        table: connection.db.score,
        handlers: {
          onUpdate: (_ctx, _oldScore, newScore) => {
            if (newScore.worldId === worldId) {
              updateScores();
            }
          }
        }
      })
      .add<typeof WorldRow>({
        table: connection.db.world,
        handlers: {
          onUpdate: (_ctx, _oldWorld, newWorld) => {
            if (newWorld.id === worldId) {
              updateTimer();
            }
          }
        }
      });

    updateScores();
    updateTimer();

    const interval = setInterval(() => {
      updateTimer();
    }, 1000);

    return () => {
      clearInterval(interval);
      subscription.current?.unsubscribe();
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
      <div className="absolute top-[5px] left-1/2 -translate-x-1/2 flex gap-1 z-[1000]">
        <HeaderBox
          label="SCORE"
          value={team0Kills}
          labelColor={TEAM_COLORS[0].label}
          valueColor={TEAM_COLORS[0].value}
        />
        <HeaderBox
          label="TIME"
          value={timeString}
          labelColor={TIME_COLORS.label}
          valueColor={TIME_COLORS.value}
        />
        <HeaderBox
          label="SCORE"
          value={team1Kills}
          labelColor={TEAM_COLORS[1].label}
          valueColor={TEAM_COLORS[1].value}
        />
      </div>
      {showCountdownWarning && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2000] font-mono text-[32px] font-medium text-ui-text-primary text-center tracking-wide uppercase" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}>
          Game ending in {timeRemaining}
        </div>
      )}
    </>
  );
}
