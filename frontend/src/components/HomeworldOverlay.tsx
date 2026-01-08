import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import HostGameModal from "./HostGameModal";

const HomeworldOverlay: React.FC = () => {
    const [showHostModal, setShowHostModal] = useState(false);

    return (
        <>
        <AnimatePresence>
            {showHostModal && (
                <HostGameModal onClose={() => setShowHostModal(false)} />
            )}
        </AnimatePresence>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center z-10 w-full max-w-[600px]">
            <div className="bg-palette-ground-dark/85 backdrop-blur-md py-2 px-5 rounded-md border border-palette-white-pure/10 border-t-0 rounded-t-none shadow-lg animate-[fadeInDown_0.6s_ease-out] flex items-center gap-3">
                <p className="m-0 text-sm text-ui-text-primary font-mono tracking-wide text-center" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    When ready, call the{" "}
                    <code className="text-terminal-warning bg-palette-yellow-bright/15 px-1.5 py-0.5 rounded font-semibold">
                        join
                    </code>{" "}
                    command to find a match
                </p>
                <button
                    onClick={() => setShowHostModal(true)}
                    className="pointer-events-auto bg-palette-blue-light/20 hover:bg-palette-blue-light/40 border border-palette-blue-light/40 hover:border-palette-blue-light/60 rounded px-3 py-1.5 text-xs text-palette-blue-light font-mono cursor-pointer tracking-wide font-bold transition-all uppercase whitespace-nowrap"
                >
                    Host Game
                </button>
            </div>

            <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
        </>
    );
};

export default HomeworldOverlay;
