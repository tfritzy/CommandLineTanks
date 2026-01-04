import React from "react";
import { COLORS, PALETTE } from "../theme/colors";

const HomeworldOverlay: React.FC = () => {
    return (
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
                    background: PALETTE.GROUND_DARK + "d9",
                    backdropFilter: "blur(8px)",
                    padding: "8px 20px",
                    borderRadius: "6px",
                    border: `1px solid ${PALETTE.WHITE_PURE + "1a"}`,
                    borderTop: "none",
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    boxShadow: `0 4px 20px ${PALETTE.BLACK_PURE + "66"}`,
                    animation: "fadeInDown 0.6s ease-out",
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
                        textShadow: `0 1px 2px ${PALETTE.BLACK_PURE + "80"}`,
                    }}
                >
                    When ready, call the{" "}
                    <code
                        style={{
                            color: COLORS.TERMINAL.WARNING,
                            background: PALETTE.YELLOW_BRIGHT + "26",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 600,
                        }}
                    >
                        join
                    </code>{" "}
                    command to find a match
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

export default HomeworldOverlay;
