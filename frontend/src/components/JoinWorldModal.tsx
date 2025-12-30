import { getConnection } from '../spacetimedb-connection';

interface JoinWorldModalProps {
  worldId: string;
  onJoin: () => void;
}

export default function JoinWorldModal({ worldId, onJoin }: JoinWorldModalProps) {
  const handleJoinWorld = () => {
    const connection = getConnection();
    if (!connection) return;

    const joinCode = `join_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    connection.reducers.joinWorld({ worldId, joinCode, passcode: '' });
    onJoin();
  };

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#2a152d',
      padding: '40px 60px',
      textAlign: 'center',
      color: '#e6eeed',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '18px',
      border: '4px solid #5a78b2',
      zIndex: 1000
    }}>
      <div style={{ fontSize: '32px', marginBottom: '20px', color: '#7396d5', fontWeight: 'bold' }}>
        Join World
      </div>
      <div style={{ fontSize: '16px', color: '#a9bcbf', marginBottom: '30px' }}>
        You don't have a tank in this world yet.
      </div>
      <button
        onClick={handleJoinWorld}
        style={{
          padding: '14px 28px',
          fontSize: '16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 'bold',
          color: '#fcfbf3',
          background: '#5a78b2',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#7396d5'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#5a78b2'}
      >
        Join World
      </button>
    </div>
  );
}
