import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import CopyBox from './CopyBox';

interface HostGameModalProps {
  onClose: () => void;
}

export default function HostGameModal({ onClose }: HostGameModalProps) {
  const [bots, setBots] = useState<number | ''>(0);
  const [duration, setDuration] = useState<number | ''>(10);
  const [width, setWidth] = useState<number | ''>(50);
  const [height, setHeight] = useState<number | ''>(50);

  const command = useMemo(() => {
    const parts = ['create'];

    parts.push(`--bots ${bots}`);
    parts.push(`--duration ${duration}`);
    parts.push(`--width ${width}`);
    parts.push(`--height ${height}`);

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
        className="bg-palette-purple-void/85 backdrop-blur-xl rounded border border-palette-white-pure/[0.08] p-8 px-10 font-mono shadow-2xl w-[550px] max-w-[90vw] max-h-[90vh] overflow-y-auto"
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
                  if (e.target.value === '') {
                    setBots('');
                    return;
                  }
                  let val = parseInt(e.target.value);
                  if (isNaN(val)) return;
                  val = Math.max(0, Math.min(10, val));
                  setBots(val);
                }}
                onBlur={() => {
                  if (bots === '') setBots(0);
                }}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => {
                  if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                min="0"
                max="10"
                className="w-full px-4 py-3 text-sm font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60 focus:ring-2 focus:ring-palette-blue-light/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="mt-1 text-xs text-palette-white-pure/40">0-10</div>
            </div>

            <div>
              <label className="block text-xs text-palette-white-pure/70 mb-2 font-medium uppercase tracking-wider">
                Duration (min)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => {
                  if (e.target.value === '') {
                    setDuration('');
                    return;
                  }
                  const val = parseInt(e.target.value);
                  if (isNaN(val)) return;
                  setDuration(Math.max(1, Math.min(20, val)));
                }}
                onBlur={() => {
                  if (duration === '') setDuration(10);
                }}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => {
                  if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                min="1"
                max="20"
                className="w-full px-4 py-3 text-sm font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60 focus:ring-2 focus:ring-palette-blue-light/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                  if (e.target.value === '') {
                    setWidth('');
                    return;
                  }
                  const val = parseInt(e.target.value);
                  if (isNaN(val)) return;
                  setWidth(val);
                }}
                onBlur={() => {
                  if (width === '' || width < 10) {
                    setWidth(50);
                  } else if (width > 200) {
                    setWidth(200);
                  }
                }}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => {
                  if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                min="10"
                max="200"
                className="w-full px-4 py-3 text-sm font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60 focus:ring-2 focus:ring-palette-blue-light/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="mt-1 text-xs text-palette-white-pure/40">Map width, 10-200</div>
            </div>

            <div>
              <label className="block text-xs text-palette-white-pure/70 mb-2 font-medium uppercase tracking-wider">
                Height
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => {
                  if (e.target.value === '') {
                    setHeight('');
                    return;
                  }
                  const val = parseInt(e.target.value);
                  if (isNaN(val)) return;
                  setHeight(val);
                }}
                onBlur={() => {
                  if (height === '' || height < 10) {
                    setHeight(50);
                  } else if (height > 200) {
                    setHeight(200);
                  }
                }}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => {
                  if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                min="10"
                max="200"
                className="w-full px-4 py-3 text-sm font-mono bg-palette-slate-darkest/60 border border-palette-slate-light/30 rounded text-terminal-text-default outline-none transition-colors focus:border-palette-blue-light/60 focus:ring-2 focus:ring-palette-blue-light/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="mt-1 text-xs text-palette-white-pure/40">Map height, 10-200</div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-palette-white-pure/10">
          <div className="text-xs text-palette-white-pure/70 mb-3 font-medium uppercase tracking-wider">
            Command
          </div>

          <CopyBox text={command} />
        </div>
      </motion.div>
    </div>
  );
}
