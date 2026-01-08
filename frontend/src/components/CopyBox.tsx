import React, { useState, useRef, useEffect } from 'react';

interface CopyBoxProps {
    text: string;
    label?: string;
    activeColor?: string;
    showDollar?: boolean;
}

const CopyBox: React.FC<CopyBoxProps> = ({ 
    text, 
    label = 'CLICK TO COPY', 
    activeColor = '#c06852',
    showDollar = true 
}) => {
    const [copied, setCopied] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
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
            onMouseEnter={() => !copied && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative bg-palette-black-pure/30 ${
                copied 
                    ? 'border-palette-green-success/50' 
                    : isHovered 
                        ? 'border-palette-white-pure/20 bg-palette-black-pure/40' 
                        : 'border-palette-white-pure/[0.07]'
            } border rounded p-4 text-[13px] text-palette-white-pure font-mono cursor-pointer transition-all break-words text-left whitespace-pre-wrap leading-normal`}
        >
            {showDollar && (
                <span className="mr-2 select-none" style={{ color: activeColor }}>$</span>
            )}
            {text}
            
            <div
                className={`absolute -top-2.5 right-2.5 text-[9px] ${
                    copied 
                        ? 'bg-palette-green-success text-palette-slate-darkest' 
                        : 'text-palette-white-bright'
                } px-2 py-0.5 rounded-sm font-bold tracking-wide shadow-md z-10 pointer-events-none`}
                style={{ backgroundColor: copied ? undefined : activeColor }}
            >
                {copied ? 'COPIED!' : label}
            </div>
        </div>
    );
};

export default CopyBox;
