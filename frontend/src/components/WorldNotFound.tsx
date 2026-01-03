import { useNavigate } from 'react-router-dom';
import { getConnection } from '../spacetimedb-connection';
import { TEAM_UI_COLORS, TEAM_SHIELD_COLORS } from '../constants';

interface WorldNotFoundProps {
  worldId: string;
}

export default function WorldNotFound({ worldId }: WorldNotFoundProps) {
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
      background: '#2e2e43',
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
        marginBottom: '12px',
        maxWidth: '500px',
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        The world you're trying to access doesn't exist.
      </div>

      <div style={{
        fontSize: '13px',
        color: '#707b89',
        marginBottom: '32px',
        fontFamily: "'JetBrains Mono', monospace",
        padding: '8px 16px',
        background: 'rgba(74, 75, 91, 0.3)',
        border: '1px solid rgba(112, 123, 137, 0.2)',
      }}>
        {worldId}
      </div>

      <button
        onClick={handleGoHome}
        style={{
          padding: '14px 32px',
          fontSize: '16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          color: '#fcfbf3',
          background: TEAM_UI_COLORS.BLUE,
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          letterSpacing: '0.05em',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = TEAM_SHIELD_COLORS.MAIN}
        onMouseLeave={(e) => e.currentTarget.style.background = TEAM_UI_COLORS.BLUE}
      >
        GO TO HOME WORLD
      </button>
    </div>
  );
}
