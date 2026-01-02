import { useState, useMemo, useRef, useEffect } from 'react';

interface JoinWorldModalProps {
  worldId: string;
}

const generateDefaultName = () => {
  const randomNumbers = Math.floor(1000 + Math.random() * 9000);
  return `guest${randomNumbers}`;
};

export default function JoinWorldModal({ worldId }: JoinWorldModalProps) {
  const [playerName, setPlayerName] = useState(() => generateDefaultName());
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sanitizedName = useMemo(() => {
    return playerName.replace(/[^\w\s-]/g, '').trim();
  }, [playerName]);

  const commands = useMemo(() => {
    return `name set ${sanitizedName}\njoin ${worldId}`;
  }, [sanitizedName, worldId]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyCommands = async () => {
    if (copyTimeoutRef.current !== null) {
      clearTimeout(copyTimeoutRef.current);
    }

    try {
      await navigator.clipboard.writeText(commands);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopied(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(46, 46, 67, 0.95)',
        backdropFilter: 'blur(4px)',
        borderRadius: '8px',
        border: '2px solid rgba(112, 123, 137, 0.3)',
        padding: '40px 60px',
        fontFamily: "'JetBrains Mono', monospace",
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        minWidth: '500px',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          fontWeight: 900,
          color: '#7396d5',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '24px',
          textShadow: '0 2px 12px rgba(115, 150, 213, 0.5)',
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        Join World
      </div>

      <div
        style={{
          fontSize: '15px',
          color: '#a9bcbf',
          marginBottom: '32px',
          lineHeight: 1.6,
          textAlign: 'center',
        }}
      >
        You don't have a tank in this world yet.
      </div>

      <div
        style={{
          marginBottom: '24px',
        }}
      >
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            color: '#e6eeed',
            marginBottom: '8px',
            fontWeight: 500,
          }}
        >
          Your Name
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          maxLength={15}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: "'JetBrains Mono', monospace",
            background: 'rgba(42, 21, 45, 0.6)',
            border: '1px solid rgba(112, 123, 137, 0.3)',
            borderRadius: '4px',
            color: '#e6eeed',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(90, 120, 178, 0.6)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(112, 123, 137, 0.3)'}
        />
      </div>

      <div
        style={{
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            color: '#a9bcbf',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          Run this command in the terminal below to join:
        </div>

        <div
          onClick={handleCopyCommands}
          style={{
            position: 'relative',
            background: 'rgba(42, 21, 45, 0.8)',
            border: copied ? '1px solid rgba(150, 220, 127, 0.5)' : '1px solid rgba(112, 123, 137, 0.3)',
            borderRadius: '4px',
            padding: '16px',
            fontSize: '13px',
            color: '#e6eeed',
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'pre',
            lineHeight: 1.6,
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.borderColor = 'rgba(90, 120, 178, 0.6)';
              e.currentTarget.style.background = 'rgba(42, 21, 45, 0.9)';
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.borderColor = 'rgba(112, 123, 137, 0.3)';
              e.currentTarget.style.background = 'rgba(42, 21, 45, 0.8)';
            }
          }}
        >
          {commands}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              fontSize: '11px',
              color: copied ? '#96dc7f' : '#707b89',
              fontWeight: 500,
              letterSpacing: '0.05em',
              transition: 'color 0.2s',
            }}
          >
            {copied ? '✓ COPIED' : 'CLICK TO COPY'}
          </div>
        </div>
      </div>
    </div>
  );
}
