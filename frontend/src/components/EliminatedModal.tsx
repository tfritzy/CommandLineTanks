import { motion } from "framer-motion";
import CopyBox from "./CopyBox";

interface EliminatedModalProps {
  killerName: string | null;
  gameId: string;
}

export default function EliminatedModal({ killerName, gameId }: EliminatedModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
      animate={{
        opacity: 1,
        scale: 1,
        x: "-50%",
        y: "-50%",
        transition: { duration: 0.2, delay: 1, ease: "easeOut" }
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
        x: "-50%",
        y: "-50%",
        transition: { duration: 0.2, delay: 0, ease: "easeOut" }
      }}
      className="absolute top-1/2 left-1/2 bg-palette-purple-void/85 backdrop-blur-xl rounded border border-palette-white-pure/[0.08] py-6 px-8 font-mono z-[1000] shadow-2xl flex flex-col items-center min-w-[400px]"
    >
      <div className="flex flex-col items-center mb-10 select-none">
        <div className="text-[42px] font-black text-palette-red-muted tracking-[0.1em] leading-none mb-1" style={{ textShadow: '0 0 40px rgba(192, 104, 82, 0.4)' }}>
          ELIMINATED
        </div>
        {killerName && (
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-4 bg-palette-white-pure/10" />
            <div className="text-[12px] font-bold text-palette-white-pure/40 tracking-[0.3em] uppercase">
              By <span className="text-palette-white-pure/80 ml-1">{killerName}</span>
            </div>
            <div className="h-[1px] w-4 bg-palette-white-pure/10" />
          </div>
        )}
      </div>

      <div className="w-full space-y-2 mb-8">
        <div className="flex items-center gap-2">
          <div className="text-[11px] px-1 font-bold tracking-widest uppercase text-palette-white-pure/40">
            rejoin the battle
          </div>
        </div>
        <CopyBox text="respawn" showPrompt={true} />
      </div>

      <div className="w-full border-t border-palette-white-pure/[0.08] pt-6 flex flex-col gap-2">
        <div className="text-[10px] text-palette-white-pure/30 tracking-[0.25em] px-1 font-bold text-left uppercase">
          Invite reinforcements
        </div>
        <CopyBox text={`${window.location.origin}/game/${gameId}`} showPrompt={false} />
      </div>
    </motion.div>
  );
}
