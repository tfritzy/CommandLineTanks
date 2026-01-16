import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import HostGameModal from "./HostGameModal";

const HomegameOverlay: React.FC = () => {
    const [showHostModal, setShowHostModal] = useState(false);

    return (
        <>
            <AnimatePresence>
                {showHostModal && (
                    <HostGameModal onClose={() => setShowHostModal(false)} />
                )}
            </AnimatePresence>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center z-10 w-full max-w-2xl px-4">
                <div className="bg-palette-purple-void/80 backdrop-blur-xl py-2 px-6 rounded-b-xl border border-palette-white-pure/[0.08] border-t-0 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] animate-[fadeInDown_0.6s_ease-out] flex items-center gap-2">
                    <p className="m-0 text-[13px] text-palette-white-pure/70 font-mono tracking-wide flex items-center whitespace-nowrap">
                        Enter <code className="mx-2 text-palette-yellow-bright bg-palette-yellow-bright/10 px-2 py-0.5 rounded border border-palette-yellow-bright/20 font-bold">join</code> to find a match, or
                    </p>

                    <button
                        onClick={() => setShowHostModal(true)}
                        className="pointer-events-auto group flex items-center gap-2 bg-palette-blue-light/10 hover:bg-palette-blue-light/20 border border-palette-blue-light/30 hover:border-palette-blue-light/50 rounded px-3 py-1 text-[11px] text-palette-blue-light font-mono cursor-pointer tracking-wider font-bold transition-all uppercase whitespace-nowrap"
                    >
                        Host Game
                        <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
};

export default HomegameOverlay;
