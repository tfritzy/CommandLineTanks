import { useState, useRef, useEffect } from 'react';
import { getConnection } from '../../spacetimedb-connection';
import { aim, drive, driveto, fire, help, respawn, reverse, stop, target, findGame } from './commands';

interface TerminalComponentProps {
    worldId: string;
}

function TerminalComponent({ worldId }: TerminalComponentProps) {
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
                    case 'aim':
                    case 'a': {
                        const aimOutput = aim(connection, worldId, args);
                        newOutput.push(...aimOutput);
                        break;
                    }
                    case 'target':
                    case 't': {
                        const targetOutput = target(connection, worldId, args);
                        newOutput.push(...targetOutput);
                        break;
                    }
                    case 'drive':
                    case 'd':
                    case 'dr': {
                        const driveOutput = drive(connection, worldId, args);
                        newOutput.push(...driveOutput);
                        break;
                    }
                    case 'driveto':
                    case 'dt': {
                        const drivetoOutput = driveto(connection, worldId, args);
                        newOutput.push(...drivetoOutput);
                        break;
                    }
                    case 'reverse':
                    case 'r': {
                        const reverseOutput = reverse(connection, worldId, args);
                        newOutput.push(...reverseOutput);
                        break;
                    }
                    case 'stop':
                    case 's': {
                        const stopOutput = stop(connection, worldId, args);
                        newOutput.push(...stopOutput);
                        break;
                    }
                    case 'fire':
                    case 'f': {
                        const fireOutput = fire(connection, worldId, args);
                        newOutput.push(...fireOutput);
                        break;
                    }
                    case 'respawn': {
                        const respawnOutput = respawn(connection, worldId, args);
                        newOutput.push(...respawnOutput);
                        break;
                    }
                    case 'findgame': {
                        const findGameOutput = findGame(connection, args);
                        newOutput.push(...findGameOutput);
                        break;
                    }
                    case 'help':
                    case 'h': {
                        const helpOutput = help(connection, args);
                        newOutput.push(...helpOutput);
                        break;
                    }
                    case 'clear':
                    case 'c':
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
                width: '100%',
                height: '500px',
                background: '#0f1419',
                color: '#e6edf3',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                lineHeight: '1.5',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                borderTop: '1px solid #10b981',
            }}
            onClick={() => inputRef.current?.focus()}
        >
            <div>
                {output.map((line, i) => (
                    <div key={i} style={{ minHeight: '1.5em', whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{line}</div>
                ))}
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '8px', color: '#10b981', fontWeight: 'bold' }}>❯</span>
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
                        color: '#e6edf3',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12px',
                        caretColor: '#10b981',
                    }}
                />
            </form>
        </div>
    );
}

export default TerminalComponent;
