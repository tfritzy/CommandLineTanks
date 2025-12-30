import { useState, useRef, useEffect } from 'react';
import { getConnection } from '../../spacetimedb-connection';
import { type ProgramContext, Program } from './programs/Program';
import { RootProgram } from './programs/RootProgram';
import { CreateGameProgram } from './programs/CreateGameProgram';

interface TerminalComponentProps {
    worldId: string;
}

function TerminalComponent({ worldId }: TerminalComponentProps) {
    const [output, setOutput] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
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

    useEffect(() => {
        if (currentProgram) {
            currentProgram.onWorldIdChange(worldId);
        }
    }, [worldId, currentProgram]);

    useEffect(() => {
        if (!currentProgram) {
            const context: ProgramContext = {
                output,
                setOutput,
                setInput,
                exitProgram: () => setCurrentProgram(null),
                worldId
            };
            
            const connection = getConnection();
            const rootProgram = new RootProgram(
                context,
                worldId,
                connection,
                () => startProgram(new CreateGameProgram(context))
            );
            setCurrentProgram(rootProgram);
        }
    }, [currentProgram, output, worldId]);

    const startProgram = (program: Program) => {
        program.onEnter();
        setCurrentProgram(program);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (currentProgram && currentProgram.handleKeyDown(e)) {
            return;
        }

        if (e.ctrlKey && e.key === 'c' && currentProgram && !(currentProgram instanceof RootProgram)) {
            e.preventDefault();
            const newOutput = [...output, "", "^C", "Cancelled.", ""];
            setOutput(newOutput);
            setInput('');
            setCurrentProgram(null);
            return;
        }

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

            setOutput(newOutput);
            
            if (currentProgram) {
                currentProgram.handleInput(input.trim());
            }
            
            setInput('');
        } else {
            if (newOutput.length > 0)
                newOutput.push('');
            setOutput(newOutput);
            setInput('');
        }
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
