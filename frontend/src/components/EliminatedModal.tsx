import { motion } from "framer-motion";
import CopyBox from "./CopyBox";

interface EliminatedModalProps {
  killerName: string | null;
  worldId: string;
}

export default function EliminatedModal({ killerName, worldId }: EliminatedModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
      animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
      exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
      transition={{ duration: 0.2, delay: 1, ease: "easeOut" }}
      className="absolute top-1/2 left-1/2 bg-palette-purple-void/85 backdrop-blur-xl rounded border border-palette-white-pure/[0.08] py-6 px-8 font-mono z-[1000] shadow-2xl flex flex-col items-center min-w-[320px]"
    >
      <div className="text-[32px] font-black text-palette-red-muted tracking-[0.1em] mb-5 text-center" style={{ textShadow: '0 0 20px rgba(192, 104, 82, 0.3)' }}>
        ELIMINATED
      </div>

      {killerName && (
        <div className="text-sm text-ui-text-dim mb-5 text-center">
          Killed by {killerName}
        </div>
      )}

      <div className="text-[13px] text-terminal-text-default mb-6 text-center leading-relaxed">
        Run this command to rejoin:
        <div className="mt-3">
          <CopyBox text="respawn" showDollar={true} activeColor="#e39764" />
        </div>
      </div>

      <div className="w-full border-t border-palette-white-pure/[0.05] pt-5 flex flex-col gap-3">
        <div className="text-[9px] text-ui-text-dim tracking-[0.1em] font-bold text-center opacity-60 uppercase">
          Invite Reinforcements
        </div>
        <CopyBox text={`${window.location.origin}/world/${worldId}`} label="COPY LINK" />
      </div>
    </motion.div>
  );
}
