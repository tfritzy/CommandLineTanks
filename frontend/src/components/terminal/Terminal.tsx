import { useState, useRef, useEffect } from 'react';
import { getConnection, setPendingJoinCode } from '../../spacetimedb-connection';
import { aim, drive, fire, help, respawn, stop, switchGun, target, join, smokescreen, overdrive, repair } from './commands';
import WorldVisibility from '../../../module_bindings/world_visibility_type';

interface TerminalComponentProps {
    worldId: string;
}

type CreationStep = 'name' | 'visibility' | 'passcode' | 'bots' | 'duration' | 'width' | 'height' | null;

interface CreationFlowState {
    step: CreationStep;
    name: string;
    visibility: 'public' | 'private';
    passcode: string;
    botCount: number;
    duration: number;
    width: number;
    height: number;
}

function TerminalComponent({ worldId }: TerminalComponentProps) {
    const [output, setOutput] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [creationFlow, setCreationFlow] = useState<CreationFlowState | null>(null);
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

            if (creationFlow) {
                handleCreationFlowInput(input.trim(), newOutput);
            } else {
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
                            startCreationFlow(newOutput);
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
        }

        if (newOutput.length > 0)
            newOutput.push('');

        setOutput(newOutput);
        setInput('');
    };

    const startCreationFlow = (newOutput: string[]) => {
        newOutput.push("Let's create a new world!");
        newOutput.push("");
        newOutput.push("What would you like to name your world?");
        setCreationFlow({
            step: 'name',
            name: '',
            visibility: 'public',
            passcode: '',
            botCount: 0,
            duration: 5,
            width: 40,
            height: 40
        });
        setOutput(newOutput);
    };

    const handleCreationFlowInput = (input: string, newOutput: string[]) => {
        if (!creationFlow) return;

        const trimmedInput = input.trim();

        switch (creationFlow.step) {
            case 'name':
                if (!trimmedInput) {
                    newOutput.push("World name cannot be empty. Please enter a name:");
                    setOutput(newOutput);
                    return;
                }
                newOutput.push("");
                newOutput.push("Would you like this world to be public or private? (public/private)");
                setCreationFlow({ ...creationFlow, name: trimmedInput, step: 'visibility' });
                break;

            case 'visibility':
                if (trimmedInput !== 'public' && trimmedInput !== 'private') {
                    newOutput.push("Please enter 'public' or 'private':");
                    setOutput(newOutput);
                    return;
                }
                const isPrivate = trimmedInput === 'private';
                if (isPrivate) {
                    newOutput.push("");
                    newOutput.push("Enter a passcode for your private world (or leave empty):");
                    setCreationFlow({ ...creationFlow, visibility: 'private', step: 'passcode' });
                } else {
                    newOutput.push("");
                    newOutput.push("How many AI bots would you like? (0-10, must be even)");
                    setCreationFlow({ ...creationFlow, visibility: 'public', step: 'bots' });
                }
                break;

            case 'passcode':
                newOutput.push("");
                newOutput.push("How many AI bots would you like? (0-10, must be even)");
                setCreationFlow({ ...creationFlow, passcode: trimmedInput, step: 'bots' });
                break;

            case 'bots':
                const botCount = parseInt(trimmedInput);
                if (isNaN(botCount) || botCount < 0 || botCount > 10 || botCount % 2 !== 0) {
                    newOutput.push("Please enter an even number between 0 and 10:");
                    setOutput(newOutput);
                    return;
                }
                newOutput.push("");
                newOutput.push("Game duration in minutes? (1-20)");
                setCreationFlow({ ...creationFlow, botCount, step: 'duration' });
                break;

            case 'duration':
                const duration = parseInt(trimmedInput);
                if (isNaN(duration) || duration < 1 || duration > 20) {
                    newOutput.push("Please enter a number between 1 and 20:");
                    setOutput(newOutput);
                    return;
                }
                newOutput.push("");
                newOutput.push("Map width? (1-200)");
                setCreationFlow({ ...creationFlow, duration, step: 'width' });
                break;

            case 'width':
                const width = parseInt(trimmedInput);
                if (isNaN(width) || width < 1 || width > 200) {
                    newOutput.push("Please enter a number between 1 and 200:");
                    setOutput(newOutput);
                    return;
                }
                newOutput.push("");
                newOutput.push("Map height? (1-200)");
                setCreationFlow({ ...creationFlow, width, step: 'height' });
                break;

            case 'height':
                const height = parseInt(trimmedInput);
                if (isNaN(height) || height < 1 || height > 200) {
                    newOutput.push("Please enter a number between 1 and 200:");
                    setOutput(newOutput);
                    return;
                }
                
                const connection = getConnection();
                if (!connection) {
                    newOutput.push("");
                    newOutput.push("Error: connection is currently not active");
                    setCreationFlow(null);
                    setOutput(newOutput);
                    return;
                }

                const joinCode = `join_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                setPendingJoinCode(joinCode);
                
                const gameDurationMicros = BigInt(creationFlow.duration * 60 * 1000000);
                const visibility = creationFlow.visibility === 'private' ? WorldVisibility.Private : WorldVisibility.CustomPublic;
                
                connection.reducers.createWorld({ 
                    joinCode,
                    worldName: creationFlow.name,
                    visibility, 
                    passcode: creationFlow.passcode || '',
                    botCount: creationFlow.botCount,
                    gameDurationMicros,
                    width: creationFlow.width,
                    height
                });

                const visibilityLabel = creationFlow.visibility === 'private' ? 'private' : 'public';
                newOutput.push("");
                newOutput.push(`Creating ${visibilityLabel} world "${creationFlow.name}"...`);
                newOutput.push(`Bots: ${creationFlow.botCount}, Duration: ${creationFlow.duration} min, Size: ${creationFlow.width}x${height}`);
                setCreationFlow(null);
                break;
        }

        setOutput(newOutput);
    };

    return (
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
    );
}

export default TerminalComponent;
