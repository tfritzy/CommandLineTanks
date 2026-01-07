import { useNavigate } from 'react-router-dom';
import { getConnection } from '../spacetimedb-connection';
import { COLORS } from '../theme/colors';

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
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: COLORS.TERRAIN.GROUND,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace",
      zIndex: 2000,
    }}>
      <div style={{
        fontSize: '48px',
        fontWeight: 700,
        color: '#c06852',
        letterSpacing: '0.05em',
        marginBottom: '24px',
        textTransform: 'uppercase',
      }}>
        World Not Found
      </div>

      <div style={{
        fontSize: '16px',
        color: '#a9bcbf',
        marginBottom: '26px',
        maxWidth: '500px',
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        The world you're trying to access doesn't exist.
      </div>

      <button
        onClick={handleGoHome}
        style={{
          padding: '14px 32px',
          fontSize: '16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          color: COLORS.UI.TEXT_PRIMARY,
          background: COLORS.TERMINAL.BORDER,
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          letterSpacing: '0.05em',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = COLORS.TERMINAL.INFO}
        onMouseLeave={(e) => e.currentTarget.style.background = COLORS.TERMINAL.BORDER}
      >
        GO HOME
      </button>
    </div>
  );
}
