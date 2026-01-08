import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getConnection, isCurrentIdentity } from '../spacetimedb-connection';
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
        if (isCurrentIdentity(p.identity)) {
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
      className="absolute inset-0 bg-palette-black-pure/50 flex items-center justify-center z-[2000]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-palette-purple-void/85 backdrop-blur-xl rounded border border-palette-white-pure/[0.08] p-8 px-10 font-mono shadow-2xl min-w-[500px] max-w-[600px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[32px] font-black text-palette-red-muted tracking-[0.1em] mb-6 text-center" style={{ textShadow: '0 0 20px rgba(192, 104, 82, 0.3)' }}>
          HOST GAME
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-terminal-text-default mb-1.5 font-medium">
              World Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-[13px] font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60"
            />
          </div>

          <div>
            <label className="block text-xs text-terminal-text-default mb-1.5 font-medium">
              Passcode (optional)
            </label>
            <input
              type="text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Leave empty for no passcode"
              className="w-full px-3 py-2.5 text-[13px] font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60 placeholder:text-palette-slate-light/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-terminal-text-default mb-1.5 font-medium">
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
                className="w-full px-3 py-2.5 text-[13px] font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60"
              />
            </div>

            <div>
              <label className="block text-xs text-terminal-text-default mb-1.5 font-medium">
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
                className="w-full px-3 py-2.5 text-[13px] font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-terminal-text-default mb-1.5 font-medium">
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
                className="w-full px-3 py-2.5 text-[13px] font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60"
              />
            </div>

            <div>
              <label className="block text-xs text-terminal-text-default mb-1.5 font-medium">
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
                className="w-full px-3 py-2.5 text-[13px] font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60"
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="text-xs text-terminal-text-default mb-2.5 font-medium">
            Copy and run this command:
          </div>

          <CopyBox text={command} />
        </div>
      </motion.div>
    </div>
  );
}
