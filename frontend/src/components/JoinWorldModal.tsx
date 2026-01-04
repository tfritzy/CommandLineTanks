import { useState, useMemo, useRef, useEffect } from 'react';
import { getConnection } from '../spacetimedb-connection';
import { COLORS } from '../theme/colors';

interface JoinWorldModalProps {
  worldId: string;
}

const generateDefaultName = () => {
  const randomNumbers = Math.floor(1000 + Math.random() * 9000);
  return `guest${randomNumbers}`;
};

const isDefaultGuestName = (name: string): boolean => {
  return /^guest\d{4}$/.test(name);
};

export default function JoinWorldModal({ worldId }: JoinWorldModalProps) {
  const [playerName, setPlayerName] = useState(() => generateDefaultName());
  const [copied, setCopied] = useState(false);
  const [hasCustomName, setHasCustomName] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const connection = getConnection();
    if (connection?.identity) {
      let player = null;
      for (const p of connection.db.player.iter()) {
        if (p.identity.isEqual(connection.identity)) {
          player = p;
          break;
        }
      }
      
      if (player && !isDefaultGuestName(player.name)) {
        setHasCustomName(true);
        setPlayerName(player.name);
      }
    }
  }, []);

  const sanitizedName = useMemo(() => {
    return playerName.replace(/[^\w\s-]/g, '').trim();
  }, [playerName]);

  const commands = useMemo(() => {
    if (hasCustomName) {
      return `join ${worldId}`;
    }
    const nameToUse = sanitizedName || generateDefaultName();
    return `name set ${nameToUse}\njoin ${worldId}`;
  }, [sanitizedName, worldId, hasCustomName]);

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
        background: COLORS.UI.OVERLAY_BG_OPAQUE,
        backdropFilter: 'blur(4px)',
        borderRadius: '8px',
        border: `2px solid ${COLORS.UI.BORDER_MEDIUM}`,
        padding: '40px 60px',
        fontFamily: "'JetBrains Mono', monospace",
        zIndex: 1000,
        boxShadow: `0 8px 32px ${COLORS.UI.SHADOW_MEDIUM}`,
        minWidth: '500px',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          fontWeight: 900,
          color: COLORS.TERMINAL.INFO,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '40px',
          textShadow: `0 2px 12px ${COLORS.UI.TEXT_SHADOW_INFO}`,
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        Join Game
      </div>

      {!hasCustomName && (
        <div
          style={{
            marginBottom: '24px',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              color: COLORS.TERMINAL.TEXT_DEFAULT,
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
              background: COLORS.UI.MODAL_BG,
              border: `1px solid ${COLORS.UI.BORDER_MEDIUM}`,
              borderRadius: '4px',
              color: COLORS.TERMINAL.TEXT_DEFAULT,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = COLORS.UI.BORDER_HOVER}
            onBlur={(e) => e.currentTarget.style.borderColor = COLORS.UI.BORDER_MEDIUM}
          />
        </div>
      )}

      <div
        style={{
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            color: COLORS.TERMINAL.TEXT_DEFAULT,
            marginBottom: '8px',
            fontWeight: 500,
          }}
        >
          Run this command in the terminal below to join:
        </div>

        <div
          onClick={handleCopyCommands}
          style={{
            position: 'relative',
            background: COLORS.UI.MODAL_BG_HOVER,
            border: copied ? `1px solid ${COLORS.UI.BORDER_SUCCESS}` : `1px solid ${COLORS.UI.BORDER_MEDIUM}`,
            borderRadius: '4px',
            padding: '16px',
            fontSize: '13px',
            color: COLORS.TERMINAL.TEXT_DEFAULT,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'pre',
            lineHeight: 1.6,
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.borderColor = COLORS.UI.BORDER_HOVER;
              e.currentTarget.style.background = COLORS.UI.MODAL_BG_FOCUS;
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.borderColor = COLORS.UI.BORDER_MEDIUM;
              e.currentTarget.style.background = COLORS.UI.MODAL_BG_HOVER;
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
              color: copied ? COLORS.TERMINAL.SUCCESS : COLORS.TERMINAL.TEXT_DIM,
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
