import React, { useState } from "react";
import { COLORS, PALETTE } from "../theme/colors";
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
        <div
            style={{
                position: "absolute",
                top: "0px",
                left: "50%",
                transform: "translateX(-50%)",
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 10,
                width: "100%",
                maxWidth: "600px",
            }}
        >
            <div
                style={{
                    background: "rgba(46, 46, 67, 0.85)",
                    backdropFilter: "blur(8px)",
                    padding: "8px 20px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderTop: "none",
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                    animation: "fadeInDown 0.6s ease-out",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: "14px",
                        color: COLORS.UI.TEXT_PRIMARY,
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "0.03em",
                        textAlign: "center",
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                    }}
                >
                    When ready, call the{" "}
                    <code
                        style={{
                            color: COLORS.TERMINAL.WARNING,
                            background: "rgba(252, 235, 168, 0.15)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 600,
                        }}
                    >
                        join
                    </code>{" "}
                    command to find a match
                </p>
                <button
                    onClick={() => setShowHostModal(true)}
                    style={{
                        pointerEvents: "auto",
                        background: `${PALETTE.BLUE_LIGHT}33`,
                        border: `1px solid ${PALETTE.BLUE_LIGHT}66`,
                        borderRadius: "4px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        color: PALETTE.BLUE_LIGHT,
                        fontFamily: "'JetBrains Mono', monospace",
                        cursor: "pointer",
                        letterSpacing: "0.05em",
                        fontWeight: "700",
                        transition: "all 0.2s ease",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${PALETTE.BLUE_LIGHT}66`;
                        e.currentTarget.style.borderColor = `${PALETTE.BLUE_LIGHT}99`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${PALETTE.BLUE_LIGHT}33`;
                        e.currentTarget.style.borderColor = `${PALETTE.BLUE_LIGHT}66`;
                    }}
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
