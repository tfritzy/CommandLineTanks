import { useState, useMemo, useEffect } from 'react';
import { getConnection, isCurrentIdentity } from '../spacetimedb-connection';
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
        if (isCurrentIdentity(p.identity)) {
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
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-palette-purple-void/95 backdrop-blur-xl rounded border border-palette-white-pure/[0.08] py-10 px-[60px] font-mono z-[1000] shadow-2xl min-w-[500px]">
      <div className="text-5xl font-black text-terminal-info tracking-[0.15em] uppercase mb-10 leading-none text-center" style={{ textShadow: '0 2px 12px rgba(127, 187, 220, 0.5)' }}>
        Join Game
      </div>

      {!hasCustomName && (
        <div className="mb-6">
          <label className="block text-sm text-terminal-text-default mb-2 font-medium">
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={15}
            className="w-full px-4 py-3 text-sm font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60 placeholder:text-palette-slate-light/50"
          />
        </div>
      )}

      <div className="mb-4">
        <div className="text-sm text-terminal-text-default mb-2 font-medium">
          Run this command in the terminal below to join:
        </div>

        <CopyBox text={commands} showDollar={true} />
      </div>
    </div>
  );
}
