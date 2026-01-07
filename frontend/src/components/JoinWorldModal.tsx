import { useState, useMemo, useEffect } from 'react';
import { getConnection } from '../spacetimedb-connection';
import { COLORS, PALETTE } from '../theme/colors';
import CopyBox from './CopyBox';

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
  const [hasCustomName, setHasCustomName] = useState(false);

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

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: `${PALETTE.PURPLE_VOID}f2`,
        backdropFilter: 'blur(12px)',
        borderRadius: '4px',
        border: `1px solid ${PALETTE.WHITE_PURE}14`,
        padding: '40px 60px',
        fontFamily: "'JetBrains Mono', monospace",
        zIndex: 1000,
        boxShadow: `0 8px 32px ${PALETTE.BLACK_PURE}80`,
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
          textShadow: `0 2px 12px ${COLORS.TERMINAL.INFO}80`,
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
              background: `${PALETTE.SLATE_DARKEST}99`,
              border: `1px solid ${PALETTE.SLATE_LIGHT}4d`,
              borderRadius: '4px',
              color: COLORS.TERMINAL.TEXT_DEFAULT,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = `${PALETTE.BLUE_LIGHT}99`}
            onBlur={(e) => e.currentTarget.style.borderColor = `${PALETTE.SLATE_LIGHT}4d`}
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

        <CopyBox text={commands} showDollar={true} />
      </div>
    </div>
  );
}
