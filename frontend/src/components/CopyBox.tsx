import React, { useState, useRef, useEffect } from 'react';
import { PALETTE } from '../theme/colors';

interface CopyBoxProps {
    text: string;
    label?: string;
    activeColor?: string;
    showDollar?: boolean;
}

const CopyBox: React.FC<CopyBoxProps> = ({ 
    text, 
    label = 'CLICK TO COPY', 
    activeColor = PALETTE.RED_MUTED,
    showDollar = true 
}) => {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleCopy = async () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            timeoutRef.current = setTimeout(() => {
                setCopied(false);
                timeoutRef.current = null;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div
            onClick={handleCopy}
            style={{
                position: 'relative',
                background: `${PALETTE.BLACK_PURE}4d`,
                border: copied ? `1px solid ${PALETTE.GREEN_SUCCESS}80` : `1px solid ${PALETTE.WHITE_PURE}11`,
                borderRadius: '4px',
                padding: '16px',
                fontSize: '13px',
                color: PALETTE.WHITE_PURE,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                wordBreak: 'break-all',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
            }}
            onMouseEnter={(e) => {
                if (!copied) {
                    e.currentTarget.style.borderColor = `${PALETTE.WHITE_PURE}33`;
                    e.currentTarget.style.background = `${PALETTE.BLACK_PURE}66`;
                }
            }}
            onMouseLeave={(e) => {
                if (!copied) {
                    e.currentTarget.style.borderColor = `${PALETTE.WHITE_PURE}11`;
                    e.currentTarget.style.background = `${PALETTE.BLACK_PURE}4d`;
                }
            }}
        >
            {showDollar && (
                <span style={{ color: activeColor, marginRight: '8px', userSelect: 'none' }}>$</span>
            )}
            {text}
            
            <div
                style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '10px',
                    fontSize: '9px',
                    background: copied ? PALETTE.GREEN_SUCCESS : activeColor,
                    color: copied ? PALETTE.SLATE_DARKEST : PALETTE.WHITE_BRIGHT,
                    padding: '2px 8px',
                    borderRadius: '2px',
                    fontWeight: 'bold',
                    letterSpacing: '0.05em',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 1,
                    pointerEvents: 'none',
                }}
            >
                {copied ? 'COPIED!' : label}
            </div>
        </div>
    );
};

export default CopyBox;
