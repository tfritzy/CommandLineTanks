import { useEffect, useState, useMemo, useRef } from "react";
import { getConnection, getIdentityHex } from "../spacetimedb-connection";
import ScoreRow from "../../module_bindings/score_type";
import GameRow from "../../module_bindings/game_type";
import { createMultiTableSubscription, MultiTableSubscription } from "../utils/tableSubscription";
import { type EventContext } from "../../module_bindings";
import { getEventTimestamp } from "../utils/eventHelpers";
import { PALETTE } from "../theme/colors.config";

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
  const [isVisible, setIsVisible] = useState(false);
  const subscription = useRef<MultiTableSubscription>(null);
  const gameStartTimeRef = useRef<number | null>(null);
  const gameDurationSecondsRef = useRef<number | null>(null);

  const connection = getConnection();
  const isHomegame = useMemo(() => {
    if (!connection?.identity) return false;
    return gameId === getIdentityHex();
  }, [connection, gameId]);

  useEffect(() => {
    setTeam0Kills(0);
    setTeam1Kills(0);
    setTimeRemaining(null);
    setIsVisible(false);
    gameStartTimeRef.current = null;
    gameDurationSecondsRef.current = null;

    if (!connection || isHomegame) return;

    const updateScores = () => {
      const score = connection.db.score.GameId.find(gameId);
      if (score) {
        setTeam0Kills(score.kills[0] || 0);
        setTeam1Kills(score.kills[1] || 0);
      }
    };

    const initializeTimer = (game: any, eventTimestampMicros?: bigint) => {
      if (game && game.gameState.tag === "Playing") {
        setIsVisible(true);
        gameStartTimeRef.current = performance.now();
        
        let gameElapsedMicros: number;
        if (eventTimestampMicros) {
          gameElapsedMicros = Number(eventTimestampMicros - game.gameStartedAt);
        } else {
          gameElapsedMicros = 0;
        }
        
        const gameDurationMicros = Number(game.gameDurationMicros);
        const remainingMicros = Math.max(0, gameDurationMicros - gameElapsedMicros);
        const remainingSeconds = Math.floor(remainingMicros / 1_000_000);
        gameDurationSecondsRef.current = remainingSeconds;
        setTimeRemaining(remainingSeconds);
      } else {
        setIsVisible(false);
        gameStartTimeRef.current = null;
        gameDurationSecondsRef.current = null;
      }
    };

    const updateTimerCountdown = () => {
      if (gameStartTimeRef.current !== null && gameDurationSecondsRef.current !== null) {
        const elapsedSeconds = Math.floor((performance.now() - gameStartTimeRef.current) / 1000);
        const remaining = Math.max(0, gameDurationSecondsRef.current - elapsedSeconds);
        setTimeRemaining(remaining);
      }
    };

    subscription.current = createMultiTableSubscription()
      .add<typeof ScoreRow>({
        table: connection.db.score,
        handlers: {
          onUpdate: (_ctx, _oldScore, newScore) => {
            if (newScore.gameId === gameId) {
              updateScores();
            }
          }
        }
      })
      .add<typeof GameRow>({
        table: connection.db.game,
        handlers: {
          onUpdate: (ctx: EventContext, _oldGame, newGame) => {
            if (newGame.id === gameId) {
              const eventTimestamp = getEventTimestamp(ctx);
              initializeTimer(newGame, eventTimestamp);
            }
          }
        }
      });

    updateScores();
    const initialGame = connection.db.game.Id.find(gameId);
    if (initialGame) {
      initializeTimer(initialGame);
    }

    const interval = setInterval(() => {
      updateTimerCountdown();
    }, 1000);

    return () => {
      clearInterval(interval);
      subscription.current?.unsubscribe();
    };
  }, [gameId, connection, isHomegame]);

  if (!isVisible || timeRemaining === null || isHomegame) {
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
