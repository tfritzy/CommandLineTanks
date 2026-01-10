import { useNavigate } from 'react-router-dom';
import { getIdentityHex } from '../spacetimedb-connection';

interface GameNotFoundProps {
  gameId: string;
}

export default function GameNotFound({ gameId: _gameId }: GameNotFoundProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    const homeGameId = getIdentityHex();
    if (homeGameId) {
      navigate(`/game/${homeGameId}`);
    }
  };

  return (
    <div className="absolute inset-0 bg-palette-ground-dark flex flex-col items-center justify-center font-mono z-[2000]">
      <div className="text-5xl font-bold text-palette-red-muted tracking-wide mb-6 uppercase">
        Game Not Found
      </div>

      <div className="text-base text-palette-slate-lighter mb-[26px] max-w-[500px] text-center leading-relaxed">
        The game you're trying to access doesn't exist.
      </div>

      <button
        onClick={handleGoHome}
        className="px-8 py-3.5 text-base font-mono font-semibold text-ui-text-primary bg-terminal-border hover:bg-terminal-info border-none cursor-pointer transition-all tracking-wide"
      >
        GO HOME
      </button>
    </div>
  );
}
