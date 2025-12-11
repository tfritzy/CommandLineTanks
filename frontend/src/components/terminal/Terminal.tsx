import { useState, useRef, useEffect } from 'react';
import { getConnection } from '../../spacetimedb-connection';
import { drive, help } from './commands';

function TerminalComponent() {
    const [output, setOutput] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [output]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length === 0) return;

            const newIndex = historyIndex === -1
                ? commandHistory.length - 1
                : Math.max(0, historyIndex - 1);

            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex === -1) return;

            const newIndex = historyIndex + 1;

            if (newIndex >= commandHistory.length) {
                setHistoryIndex(-1);
                setInput('');
            } else {
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex]);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let newOutput = [...output];
        newOutput.push(`❯ ${input}`);

        if (input.trim()) {
            setCommandHistory([...commandHistory, input.trim()]);
            setHistoryIndex(-1);

            const [cmd, ...args] = input.trim().split(' ');
            const connection = getConnection();

            if (!connection?.isActive) {
                newOutput.push("Error: connection is currently not active");
            } else {
                switch (cmd.toLowerCase()) {
                    case 'drive':
                        const driveOutput = drive(connection, args);
                        newOutput.push(...driveOutput);
                        break;
                    case 'help':
                        const helpOutput = help(connection, args);
                        newOutput.push(...helpOutput);
                        break;
                    case 'clear':
                        newOutput = [];
                        break;
                    default:
                        newOutput.push(`Command not found: ${cmd}`);
                        break;
                }
            }
        }

        if (newOutput.length > 0)
            newOutput.push('');

        setOutput(newOutput);
        setInput('');
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '700px',
                maxWidth: '90vw',
                height: '400px',
                background: '#2b2d3a',
                color: '#d4d4d8',
                fontFamily: 'monospace',
                fontSize: '13px',
                padding: '10px',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                overflowY: 'auto',
                border: '1px solid #3a3d4d',
            }}
            onClick={() => inputRef.current?.focus()}
        >
            <div>
                {output.map((line, i) => (
                    <div key={i} style={{ minHeight: '1em', whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{line}</div>
                ))}
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
                <span style={{ marginRight: '1ch', color: '#7dd3fc' }}>❯ </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#d4d4d8',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                    }}
                />
            </form>
        </div>
    );
}

export default TerminalComponent;
