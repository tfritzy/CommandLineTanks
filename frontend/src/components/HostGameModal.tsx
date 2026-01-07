import { useState, useMemo, useEffect } from 'react';
import { COLORS, PALETTE } from '../theme/colors';
import { motion } from 'framer-motion';
import { getConnection } from '../spacetimedb-connection';
import CopyBox from './CopyBox';

interface HostGameModalProps {
  onClose: () => void;
}

export default function HostGameModal({ onClose }: HostGameModalProps) {
  const [defaultWorldName, setDefaultWorldName] = useState('New World');
  const [name, setName] = useState('New World');
  const [passcode, setPasscode] = useState('');
  const [bots, setBots] = useState(0);
  const [duration, setDuration] = useState(10);
  const [width, setWidth] = useState(50);
  const [height, setHeight] = useState(50);

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

      if (player) {
        const worldName = `${player.name}'s game`;
        setDefaultWorldName(worldName);
        setName(worldName);
      }
    }
  }, []);

  const command = useMemo(() => {
    const parts = ['create'];

    if (name !== defaultWorldName) {
      parts.push(`--name "${name}"`);
    }

    if (passcode) {
      parts.push(`--passcode "${passcode}"`);
    }

    if (bots !== 0) {
      parts.push(`--bots ${bots}`);
    }

    if (duration !== 10) {
      parts.push(`--duration ${duration}`);
    }

    if (width !== 50) {
      parts.push(`--width ${width}`);
    }

    if (height !== 50) {
      parts.push(`--height ${height}`);
    }

    return parts.join(' ');
  }, [name, passcode, bots, duration, width, height, defaultWorldName]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `${PALETTE.BLACK_PURE}80`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          background: `${PALETTE.PURPLE_VOID}d9`,
          backdropFilter: 'blur(12px)',
          borderRadius: '4px',
          border: `1px solid ${PALETTE.WHITE_PURE}14`,
          padding: '32px 40px',
          fontFamily: "'JetBrains Mono', monospace",
          boxShadow: `0 8px 32px ${PALETTE.BLACK_PURE}99`,
          minWidth: '500px',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontSize: '32px',
            fontWeight: '900',
            color: PALETTE.RED_MUTED,
            letterSpacing: '0.1em',
            marginBottom: '24px',
            textAlign: 'center',
            textShadow: `0 0 20px ${PALETTE.RED_MUTED}4d`,
          }}
        >
          HOST GAME
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: COLORS.TERMINAL.TEXT_DEFAULT,
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              World Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13px',
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

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: COLORS.TERMINAL.TEXT_DEFAULT,
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              Passcode (optional)
            </label>
            <input
              type="text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Leave empty for no passcode"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13px',
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: COLORS.TERMINAL.TEXT_DEFAULT,
                  marginBottom: '6px',
                  fontWeight: '500',
                }}
              >
                Bots (0-10, even)
              </label>
              <input
                type="number"
                value={bots}
                onChange={(e) => {
                  let val = parseInt(e.target.value) || 0;
                  val = Math.max(0, Math.min(10, val));
                  if (val % 2 !== 0) {
                    val = Math.max(0, val - 1);
                  }
                  setBots(val);
                }}
                min="0"
                max="10"
                step="2"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
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

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: COLORS.TERMINAL.TEXT_DEFAULT,
                  marginBottom: '6px',
                  fontWeight: '500',
                }}
              >
                Duration (1-20 min)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setDuration(Math.max(1, Math.min(20, val)));
                }}
                min="1"
                max="20"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
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
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: COLORS.TERMINAL.TEXT_DEFAULT,
                  marginBottom: '6px',
                  fontWeight: '500',
                }}
              >
                Width (1-200)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setWidth(Math.max(1, Math.min(200, val)));
                }}
                min="1"
                max="200"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
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

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: COLORS.TERMINAL.TEXT_DEFAULT,
                  marginBottom: '6px',
                  fontWeight: '500',
                }}
              >
                Height (1-200)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setHeight(Math.max(1, Math.min(200, val)));
                }}
                min="1"
                max="200"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
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
          </div>
        </div>

        <div
          style={{
            marginTop: '32px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: COLORS.TERMINAL.TEXT_DEFAULT,
              marginBottom: '10px',
              fontWeight: '500',
            }}
          >
            Copy and run this command:
          </div>
          
          <CopyBox text={command} />
        </div>
      </motion.div>
    </div>
  );
}
