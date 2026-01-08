import React, { useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const TerminalMock: React.FC = () => {
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (terminalRef.current) {
            const term = new Terminal({
                fontFamily: '"Fira Code", monospace',
                fontSize: 13,
                lineHeight: 1.2,
                cursorBlink: true,
                cursorStyle: 'bar',
                allowTransparency: false,
                disableStdin: true,
                theme: {
                    background: '#1a1a24',
                    foreground: '#D4D4D4',
                    cursor: '#ff0099',
                    selectionBackground: '#ff009940',
                    black: '#000000',
                    red: '#EF4444',
                    green: '#22C55E',
                    yellow: '#EAB308',
                    blue: '#00f0ff',
                    magenta: '#ff0099',
                    cyan: '#00f0ff',
                    white: '#F9FAFB',
                    brightBlack: '#6B7280',
                    brightRed: '#EF4444',
                    brightGreen: '#22C55E',
                    brightYellow: '#EAB308',
                    brightBlue: '#00f0ff',
                    brightMagenta: '#ff0099',
                    brightCyan: '#00f0ff',
                    brightWhite: '#F9FAFB',
                },
            });

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);

            term.open(terminalRef.current);
            fitAddon.fit();

            // Mock session content
            const prompt = '\x1b[1m\x1b[32m❯\x1b[0m ';
            const writeDelayed = async (text: string, delay: number) => {
                return new Promise<void>(resolve => {
                    setTimeout(() => {
                        term.write(text);
                        resolve();
                    }, delay);
                });
            };

            const typeCommand = async (command: string) => {
                for (const char of command) {
                    await writeDelayed(char, Math.random() * 50 + 30);
                }
                await writeDelayed('\r\n', 100);
            };

            const runSequence = async () => {
                // Initial state
                term.write(prompt);
                await new Promise(r => setTimeout(r, 800));

                // Command 1: help
                await typeCommand("help");
                const helpText = [
                    "Available commands:",
                    "  \x1b[36mdrive\x1b[0m      Move unit: drive <dir> [dist]",
                    "  \x1b[36mfire\x1b[0m       Fire main weapon",
                    "  \x1b[36maim\x1b[0m        Aim turret: aim <degrees|dir>",
                    "  \x1b[36mtarget\x1b[0m     Lock on target: target <id>",
                    "  \x1b[36mswitch\x1b[0m     Switch weapon: switch <slot>",
                ];

                for (const line of helpText) {
                    term.writeln(line);
                }
                term.writeln("");

                term.write(prompt);
                await new Promise(r => setTimeout(r, 1000));

                // Command 2: drive
                await typeCommand("drive northeast 20");
                term.writeln("Driving 20 units \x1b[36m↗\x1b[0m northeast at full throttle");
                term.writeln("");

                term.write(prompt);
                await new Promise(r => setTimeout(r, 1000));

                // Command 3: target
                await typeCommand("target a4");
                term.writeln("Targeting tank \x1b[35ma4\x1b[0m (Alpha)");
                term.writeln("");

                term.write(prompt);
                await new Promise(r => setTimeout(r, 1000));

                // Command 4: stop
                await typeCommand("stop");
                term.writeln("Tank stopped.");
                term.writeln("");

                term.write(prompt);
                await new Promise(r => setTimeout(r, 1000));

                // Command 5: fire (x3)
                for (let i = 0; i < 3; i++) {
                    await typeCommand("fire");
                    term.writeln("Projectile fired.");
                    term.writeln("");
                    term.write(prompt);
                    await new Promise(r => setTimeout(r, 400));
                }

                await new Promise(r => setTimeout(r, 1000));

                // Command 6: clear
                await typeCommand("clear");
                term.write('\x1b[2J\x1b[3J\x1b[H'); // Full ANSI clear: clear screen, clear scrollback, move cursor home

                term.write(prompt);
            };

            runSequence();

            const handleResize = () => {
                fitAddon.fit();
            };

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                term.dispose();
            };
        }
    }, []);

    return (
        <div className="w-full h-full relative p-2 pointer-events-none select-none bg-[#1a1a24]">
            <div ref={terminalRef} className="w-full h-full" />
        </div>
    );
};

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const handlePlay = () => {
        navigate('/deploy');
    };

    return (
        <div className="min-h-screen bg-background-base selection:bg-primary/30">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border-dark bg-background-base/90 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-primary rounded flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-[20px]">terminal</span>
                        </div>
                        <h2 className="text-white text-xl font-bold tracking-tight font-mono">CL<span className="text-primary">TANKS</span></h2>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a className="text-gray-300 hover:text-primary transition-colors text-sm font-medium" href="#">Home</a>
                        <a className="text-gray-300 hover:text-primary transition-colors text-sm font-medium" href="#docs">Commands</a>
                        <a className="text-gray-300 hover:text-primary transition-colors text-sm font-medium" href="https://github.com/tfritzy/CommandLineTanks">GitHub</a>
                    </div>
                    <button
                        onClick={handlePlay}
                        className="hidden md:flex items-center justify-center rounded-lg h-9 px-5 bg-secondary text-background-base text-sm font-bold hover:bg-white transition-all"
                    >
                        <span>&gt; Play In browser</span>
                    </button>
                    <div className="md:hidden text-white">
                        <span className="material-symbols-outlined">menu</span>
                    </div>
                </div>
            </header>

            <section className="relative min-h-[600px] flex items-center justify-center border-b border-border-dark overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-10 [background-size:40px_40px] bg-[linear-gradient(to_right,#42425a_1px,transparent_1px),linear-gradient(to_bottom,#42425a_1px,transparent_1px)]"></div>
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-background-base/0 via-background-base/80 to-background-base"></div>
                <div className="scanline"></div>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center pt-20 pb-32">
                    <div className="flex flex-col justify-center gap-8 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/30 bg-secondary/10 w-fit">
                            <span className="material-symbols-outlined text-secondary text-xs animate-pulse">public</span>
                            <span className="text-xs font-mono text-secondary font-bold tracking-wide uppercase">Browser-Based PvP typing game</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tighter text-white">
                            TYPE FAST OR<br />
                            <span className="text-primary">DIE.</span>
                        </h1>
                        <p className="text-gray-300 text-lg lg:text-xl font-light leading-relaxed max-w-lg">
                            A competitive multiplayer tank game played entirely via the keyboard directly in your browser. Improve your typing accuracy and speed with this unconventional PvP tank typing game.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mt-2">
                            <button
                                onClick={handlePlay}
                                className="flex h-14 px-8 items-center justify-center rounded-lg bg-primary text-white text-base font-bold hover:bg-primary-hover hover:translate-y-[-2px] transition-all shadow-xl shadow-primary/20"
                            >
                                <span className="mr-2 material-symbols-outlined">terminal</span>
                                Play in browser
                            </button>
                            <a className="flex h-14 px-8 items-center justify-center rounded-lg border border-border-dark bg-card-dark text-white text-base font-medium hover:bg-card-dark/80 hover:translate-y-[-2px] transition-all" href="#docs">
                                <span className="mr-2 material-symbols-outlined">code</span>
                                View_Syntax
                            </a>
                        </div>
                    </div>

                    <div className="relative hidden lg:block perspective-subtle">
                        <div className="relative transform transition-all duration-500 hover:scale-[1.01]">
                            {/* Window Shadow & Glow */}
                            <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-xl blur-sm opacity-50"></div>

                            {/* Main Window Container */}
                            <div className="relative rounded-xl bg-[#1a1a24] border border-white/10 shadow-2xl overflow-hidden ring-1 ring-black/5">
                                {/* Window Header */}
                                <div className="flex items-center px-4 py-3 bg-white/5 border-b border-white/5 gap-4">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-black/10"></div>
                                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-black/10"></div>
                                        <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-black/10"></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/40 border border-white/5 text-xs text-gray-400 font-mono w-full max-w-full text-left justify-start opacity-80 hover:opacity-100 transition-opacity cursor-text shadow-inner">
                                            <span className="material-symbols-outlined text-[10px] opacity-60">lock</span>
                                            <span className="text-gray-300">cltanks.io/world/LSJD</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Terminal Content */}
                                <div className="p-4 h-[420px] overflow-hidden relative">
                                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none"></div>
                                    <TerminalMock />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-[#1a1a24] relative border-t border-border-dark" id="docs">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center">
                    <div className="text-center mb-16 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 mb-4">
                            <span className="material-symbols-outlined text-primary text-xs">Menu_Book</span>
                            <span className="text-xs font-mono text-primary font-bold tracking-widest uppercase">Operations Manual</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
                            COMMAND SYNTAX
                        </h2>
                        <p className="text-gray-400 text-lg font-light leading-relaxed">
                            See the full list of available commands to control your tank.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">north_east</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">drive</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Navigate through the world using pathfinding by specifying a tactical direction and optional distance.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">drive &lt;dir&gt; [dist] [throttle]</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> drive north 10</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">adjust</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">fire</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Fire your primary or secondary weapon in the direction the turret is currently facing.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">fire [f]</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> fire</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">rotate_right</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">aim</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Rotate your turret assembly to a specific angle or cardinal direction.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">aim &lt;deg|dir&gt;</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> aim 180</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">track_changes</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">target</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Lock onto an enemy unit's ID code. Your turret will automatically track their movement.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">target &lt;id_code&gt;</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> target a4</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">swap_horiz</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">switch</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Switch to a specific weapon system slot (1, 2, or 3).
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">switch &lt;slot&gt;</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> switch 2</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">list</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">tanks</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    List all active units in the current world with their stats and team affiliation.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">tanks</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> tanks</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">front_hand</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">stop</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Immediately halt all movement and clear any active pathfinding routes.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">stop [s]</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> stop</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">restart_alt</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">respawn</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Re-deploy your unit at a safe location. Can only be used when destroyed.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">respawn</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> respawn</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">badge</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">name</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Update your callsign. This name will be visible to all other operators.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">name set &lt;new_name&gt;</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> name set Maverick</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">add_box</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">create</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Initialize a new world instance. Configure name, bots, dimensions, duration, and access control.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">create [-n name] [-b bots] [-w width] [-h height] [-d mins] [-p pass]</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> create -n "Battle" -b 4 -w 100</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">login</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">join</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Enter a specific world instance or join a random public match.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">join [world_id]</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> join ABCD</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">logout</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">exit</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Gracefully disconnect from the current world and return home.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">exit [e]</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> exit</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">mop</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">clear</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Wipe the terminal display history and reset the command prompt.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">clear [c]</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> clear</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark overflow-hidden transition-colors hover:border-primary/50">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">help</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">help</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Access terminal documentation for any command or view all operations.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">help [command]</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> help drive</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <footer className="bg-[#1a1a24] py-10 border-t border-border-dark text-center md:text-left">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-white">
                            <span className="material-symbols-outlined text-primary">terminal</span>
                            <span className="font-bold tracking-tight font-mono">CLTANKS</span>
                        </div>
                        <p className="text-gray-500 text-sm font-mono">© 2026 CLTanks "Everyone's a tankie"</p>
                    </div>
                    <div className="flex gap-8 text-sm font-medium text-gray-400 font-mono">
                        <a className="hover:text-primary transition-colors" href="#">Manual</a>
                        <a className="hover:text-primary transition-colors" href="https://github.com/tfritzy/CommandLineTanks">Source_Code</a>
                        <a className="hover:text-primary transition-colors" href="#">Community</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};



export default LandingPage;
