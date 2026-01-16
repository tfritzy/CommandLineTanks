import React from "react";

const TutorialOverlay: React.FC = () => {
    return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center z-10 w-full max-w-2xl px-4">
            <div className="bg-palette-purple-void/80 backdrop-blur-xl py-2 px-6 rounded-b-xl border border-palette-white-pure/[0.08] border-t-0 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] animate-[fadeInDown_0.6s_ease-out] flex items-center gap-2">
                <p className="m-0 text-[13px] text-palette-white-pure/70 font-mono tracking-wide flex items-center whitespace-nowrap">
                    Welcome to Command Line Tanks <span className="mx-2 text-palette-yellow-bright">|</span> <span className="text-palette-blue-bright font-bold">Crash course</span>
                </p>
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
    );
};

export default TutorialOverlay;
