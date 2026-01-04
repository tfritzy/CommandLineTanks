import React from "react";
import { UI_COLORS } from "../constants";
import { TERMINAL_COLORS } from "./terminal/colors";

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
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: "14px",
                        color: UI_COLORS.TEXT_BRIGHT,
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "0.03em",
                        textAlign: "center",
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                    }}
                >
                    When ready, call the{" "}
                    <code
                        style={{
                            color: TERMINAL_COLORS.WARNING,
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
