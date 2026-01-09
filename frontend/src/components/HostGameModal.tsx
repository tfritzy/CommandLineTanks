import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface HostGameModalProps {
  onClose: () => void;
}

export default function HostGameModal({ onClose }: HostGameModalProps) {
  const [bots, setBots] = useState(0);
  const [duration, setDuration] = useState(10);
  const [width, setWidth] = useState(50);
  const [height, setHeight] = useState(50);

  const command = useMemo(() => {
    const parts = ['create'];

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
  }, [bots, duration, width, height]);

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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-palette-white-pure/70 mb-2 font-medium uppercase tracking-wider">
                Bots
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
                className="w-full px-4 py-3 text-sm font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60 focus:ring-2 focus:ring-palette-blue-light/20"
              />
              <div className="mt-1 text-xs text-palette-white-pure/40">Even number, 0-10</div>
            </div>

            <div>
              <label className="block text-xs text-palette-white-pure/70 mb-2 font-medium uppercase tracking-wider">
                Duration (min)
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
                className="w-full px-4 py-3 text-sm font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60 focus:ring-2 focus:ring-palette-blue-light/20"
              />
              <div className="mt-1 text-xs text-palette-white-pure/40">Between 1-20 minutes</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-palette-white-pure/70 mb-2 font-medium uppercase tracking-wider">
                Width
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
                className="w-full px-4 py-3 text-sm font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60 focus:ring-2 focus:ring-palette-blue-light/20"
              />
              <div className="mt-1 text-xs text-palette-white-pure/40">Map width, 1-200</div>
            </div>

            <div>
              <label className="block text-xs text-palette-white-pure/70 mb-2 font-medium uppercase tracking-wider">
                Height
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
                className="w-full px-4 py-3 text-sm font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60 focus:ring-2 focus:ring-palette-blue-light/20"
              />
              <div className="mt-1 text-xs text-palette-white-pure/40">Map height, 1-200</div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-palette-white-pure/10">
          <div className="text-xs text-palette-white-pure/70 mb-3 font-medium uppercase tracking-wider">
            Command
          </div>

          <div className="relative">
            <div className="px-4 py-3 text-sm font-mono bg-palette-slate-darkest/80 border border-palette-slate-light/30 rounded text-terminal-text-default break-all">
              {command}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(command)}
              className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium bg-palette-blue-light/20 hover:bg-palette-blue-light/30 text-palette-blue-light border border-palette-blue-light/30 rounded transition-colors"
            >
              Copy
            </button>
          </div>
          <div className="mt-2 text-xs text-palette-white-pure/40 text-center">
            Copy this command and paste it into the terminal
          </div>
        </div>
      </motion.div>
    </div>
  );
}
