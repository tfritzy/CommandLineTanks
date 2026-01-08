import { useNavigate } from 'react-router-dom';
import { getConnection } from '../spacetimedb-connection';

interface WorldNotFoundProps {
  worldId: string;
}

export default function WorldNotFound({ worldId: _worldId }: WorldNotFoundProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    const connection = getConnection();
    if (connection?.identity) {
      const homeWorldId = connection.identity.toHexString();
      navigate(`/world/${homeWorldId}`);
    }
  };

  return (
    <div className="absolute inset-0 bg-palette-ground-dark flex flex-col items-center justify-center font-mono z-[2000]">
      <div className="text-5xl font-bold text-palette-red-muted tracking-wide mb-6 uppercase">
        World Not Found
      </div>

      <div className="text-base text-palette-slate-lighter mb-[26px] max-w-[500px] text-center leading-relaxed">
        The world you're trying to access doesn't exist.
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
