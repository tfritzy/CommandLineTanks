import { useEffect, useState, useRef } from "react";
import { getConnection, getServerTime } from "../spacetimedb-connection";
import { PALETTE } from "../theme/colors.config";
import { createMultiTableSubscription, MultiTableSubscription } from "../utils/tableSubscription";
import ScoreRow from "../../module_bindings/score_type";
import GameRow from "../../module_bindings/game_type";

const COUNTDOWN_WARNING_SECONDS = 10;

const TEAM_COLORS = {
  0: { label: PALETTE.RED_MUTED, value: PALETTE.ORANGE_MEDIUM },
  1: { label: PALETTE.BLUE_INFO, value: PALETTE.BLUE_BRIGHT },
};

const TIME_COLORS = { label: PALETTE.YELLOW_MEDIUM, value: PALETTE.YELLOW_BRIGHT };

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
  gameId: string;
}

export default function GameHeader({ gameId }: GameHeaderProps) {
  const [team0Kills, setTeam0Kills] = useState(0);
  const [team1Kills, setTeam1Kills] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const subscriptionRef = useRef<MultiTableSubscription | null>(null);

  const connection = getConnection();
  const isRealGame = gameId.length === 4;

  useEffect(() => {
    if (!connection || !isRealGame) return;

    const updateFromDb = () => {
      const score = connection.db.score.GameId.find(gameId);
      if (score) {
        setTeam0Kills(score.kills[0] || 0);
        setTeam1Kills(score.kills[1] || 0);
      }

      const game = connection.db.game.Id.find(gameId);
      if (game && game.gameState.tag === "Playing") {
        const serverTimeMicros = BigInt(Math.floor(getServerTime() * 1000));
        const elapsedMicros = serverTimeMicros - game.gameStartedAt;
        const remainingMicros = game.gameDurationMicros - elapsedMicros;
        const remainingSeconds = Math.max(0, Math.floor(Number(remainingMicros) / 1_000_000));
        setTimeRemaining(remainingSeconds);
      } else {
        setTimeRemaining(null);
      }
    };

    subscriptionRef.current = createMultiTableSubscription()
      .add<typeof ScoreRow>({
        table: connection.db.score,
        loadInitialData: false,
        handlers: {
          onUpdate: (_ctx, _old, newScore) => {
            if (newScore.gameId === gameId) updateFromDb();
          }
        }
      })
      .add<typeof GameRow>({
        table: connection.db.game,
        loadInitialData: false,
        handlers: {
          onUpdate: (_ctx, _old, newGame) => {
            if (newGame.id === gameId) updateFromDb();
          }
        }
      });

    updateFromDb();
    const interval = setInterval(updateFromDb, 1000);

    return () => {
      clearInterval(interval);
      subscriptionRef.current?.unsubscribe();
    };
  }, [gameId, connection, isRealGame]);

  if (timeRemaining === null || !isRealGame) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const showCountdownWarning = timeRemaining <= COUNTDOWN_WARNING_SECONDS && timeRemaining > 0;

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
