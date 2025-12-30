import { useState, useRef, useEffect } from 'react';
import { getConnection, setPendingJoinCode } from '../../spacetimedb-connection';
import { aim, drive, fire, help, respawn, stop, switchGun, target, join, smokescreen, overdrive, repair, create } from './commands';
import GameCreationFlow from '../GameCreationFlow';
import WorldVisibility from '../../module_bindings/world_visibility_type';
import { type Infer } from "spacetimedb";

interface TerminalComponentProps {
    worldId: string;
}

function TerminalComponent({ worldId }: TerminalComponentProps) {
    const [output, setOutput] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showGameCreationFlow, setShowGameCreationFlow] = useState(false);
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

            const startIndex = historyIndex === -1
                ? commandHistory.length - 1
                : historyIndex - 1;

            if (startIndex < 0) return;

            const currentCommand = historyIndex === -1 ? input : commandHistory[historyIndex];
            let newIndex = startIndex;

            while (newIndex > 0 && commandHistory[newIndex] === currentCommand) {
                newIndex--;
            }

            if (newIndex === 0 && commandHistory[newIndex] === currentCommand) {
                return;
            }

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
                const currentCommand = commandHistory[historyIndex];
                let nextIndex = newIndex;

                while (nextIndex < commandHistory.length && commandHistory[nextIndex] === currentCommand) {
                    nextIndex++;
                }

                if (nextIndex >= commandHistory.length) {
                    setHistoryIndex(-1);
                    setInput('');
                } else {
                    setHistoryIndex(nextIndex);
                    setInput(commandHistory[nextIndex]);
                }
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
                    case 'd': {
                        const driveOutput = drive(connection, worldId, args);
                        newOutput.push(...driveOutput);
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
                    case 'switch':
                    case 'w': {
                        const switchOutput = switchGun(connection, worldId, args);
                        newOutput.push(...switchOutput);
                        break;
                    }
                    case 'smokescreen':
                    case 'sm': {
                        const smokescreenOutput = smokescreen(connection, worldId, args);
                        newOutput.push(...smokescreenOutput);
                        break;
                    }
                    case 'overdrive':
                    case 'od': {
                        const overdriveOutput = overdrive(connection, worldId, args);
                        newOutput.push(...overdriveOutput);
                        break;
                    }
                    case 'repair':
                    case 'rep': {
                        const repairOutput = repair(connection, worldId, args);
                        newOutput.push(...repairOutput);
                        break;
                    }
                    case 'respawn': {
                        const respawnOutput = respawn(connection, worldId, args);
                        newOutput.push(...respawnOutput);
                        break;
                    }
                    case 'create': {
                        const createOutput = create(connection, args);
                        if (typeof createOutput === 'object' && 'type' in createOutput && createOutput.type === 'open_flow') {
                            setShowGameCreationFlow(true);
                        } else {
                            newOutput.push(...createOutput);
                        }
                        break;
                    }
                    case 'join': {
                        const joinOutput = join(connection, args);
                        newOutput.push(...joinOutput);
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

    const handleGameCreationComplete = (worldName: string, visibility: Infer<typeof WorldVisibility>, passcode: string, botCount: number, gameDurationMinutes: number) => {
        setShowGameCreationFlow(false);
        
        const connection = getConnection();
        if (!connection) {
            const newOutput = [...output, "Error: connection is currently not active", ""];
            setOutput(newOutput);
            return;
        }

        const joinCode = `join_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        setPendingJoinCode(joinCode);
        
        const gameDurationMicros = gameDurationMinutes * 60 * 1000000;
        
        connection.reducers.createWorld({ 
            joinCode,
            worldName,
            visibility, 
            passcode: passcode || '',
            botCount,
            gameDurationMicros
        });

        const visibilityLabel = visibility.tag === 'Private' ? 'private' : 'public';
        const newOutput = [
            ...output,
            `Creating ${visibilityLabel} game "${worldName}"...`,
            `Bots: ${botCount}, Duration: ${gameDurationMinutes} min`,
            ""
        ].filter(line => line !== '');
        setOutput(newOutput);
    };

    const handleGameCreationCancel = () => {
        setShowGameCreationFlow(false);
        const newOutput = [...output, "Game creation cancelled.", ""];
        setOutput(newOutput);
    };

    return (
        <>
            {showGameCreationFlow && (
                <GameCreationFlow 
                    onComplete={handleGameCreationComplete}
                    onCancel={handleGameCreationCancel}
                />
            )}
            <div
                style={{
                    width: '100%',
                    height: '500px',
                    maxHeight: '50vh',
                    background: '#2a152d',
                    borderTop: '1px solid #5a78b2',
                    display: 'flex',
                    justifyContent: 'center',
                }}
                onClick={() => inputRef.current?.focus()}
            >
                <div
                    ref={containerRef}
                    style={{
                        width: '100%',
                        maxWidth: '1200px',
                        color: '#e6eeed',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12px',
                        lineHeight: '1',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto',
                    }}
                >
                    <div>
                        {output.map((line, i) => (
                            <div key={i} style={{ minHeight: '1.5em', whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{line}</div>
                        ))}
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px', color: '#96dc7f', fontWeight: 'bold' }}>❯</span>
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
                                color: '#e6eeed',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '12px',
                                caretColor: '#96dc7f',
                            }}
                        />
                    </form>
                </div>
            </div>
        </>
    );
}

export default TerminalComponent;
