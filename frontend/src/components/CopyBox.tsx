import React, { useState, useRef, useEffect } from 'react';

interface CopyBoxProps {
    text: string;
    activeColor?: string;
    showDollar?: boolean;
}

const CopyBox: React.FC<CopyBoxProps> = ({
    text,
    activeColor = '#c06852',
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
            className={`group relative bg-palette-black-pure/30 ${copied
                ? 'border-palette-green-success/50'
                : 'border-palette-white-pure/[0.07] hover:border-palette-white-pure/20 hover:bg-palette-black-pure/40'
                } border rounded p-4 pr-16 text-[13px] text-palette-white-pure/70 font-mono cursor-pointer transition-all text-left leading-normal flex items-center overflow-x-auto`}
        >
            <div className="flex-shrink-0 whitespace-nowrap">
                {showDollar && (
                    <span className="mr-2 select-none" style={{ color: activeColor }}>$</span>
                )}
                {text}
            </div>

            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 pl-8 pointer-events-none bg-gradient-to-l from-palette-black-pure/30 via-palette-black-pure/30 to-transparent group-hover:from-palette-black-pure/40 group-hover:via-palette-black-pure/40 transition-all rounded-r">
                {copied ? (
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-palette-green-success"
                    >
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                ) : (
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-palette-white-pure/60 hover:text-palette-white-pure"
                    >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                )}
            </div>
        </div>
    );
};

export default CopyBox;
