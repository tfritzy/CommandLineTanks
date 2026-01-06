import React from 'react';
import { useNavigate } from 'react-router-dom';

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
                        <div className="size-8 bg-primary rounded flex items-center justify-center text-white shadow-[0_0_10px_rgba(255,0,153,0.4)]">
                            <span className="material-symbols-outlined text-[20px]">keyboard</span>
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
                        className="hidden md:flex items-center justify-center rounded-lg h-9 px-5 bg-secondary text-background-base text-sm font-bold hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                    >
                        <span>&gt; Play In browser</span>
                    </button>
                    <div className="md:hidden text-white">
                        <span className="material-symbols-outlined">menu</span>
                    </div>
                </div>
            </header>

            <section className="relative min-h-[600px] flex items-center justify-center border-b border-border-dark overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, #42425a 1px, transparent 1px), linear-gradient(to bottom, #42425a 1px, transparent 1px)' }}></div>
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-background-base/0 via-background-base/80 to-background-base"></div>
                <div className="scanline"></div>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-16 items-center pt-10 pb-20">
                    <div className="flex flex-col gap-6 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/30 bg-secondary/10 w-fit">
                            <span className="material-symbols-outlined text-secondary text-xs animate-pulse">public</span>
                            <span className="text-xs font-mono text-secondary font-bold tracking-wide uppercase">Browser-Based PvP typing game</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tighter text-white">
                            TYPE FAST OR<br />
                            <span className="text-primary glow-text">DIE.</span>
                        </h1>
                        <p className="text-gray-300 text-lg lg:text-xl font-light leading-relaxed max-w-lg">
                            A competitive multiplayer tank game played entirely via the keyboard directly in your browser. Improve your typing accuracy and speed with this unconventional PvP tank typing game.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mt-6">
                            <button
                                onClick={handlePlay}
                                className="flex h-14 px-8 items-center justify-center rounded-lg bg-primary text-white text-base font-bold hover:bg-primary-hover hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,153,0.4)]"
                            >
                                <span className="mr-2 material-symbols-outlined">terminal</span>
                                Play in browser
                            </button>
                            <a className="flex h-14 px-8 items-center justify-center rounded-lg border border-border-dark bg-card-dark text-white text-base font-medium hover:border-secondary/50 hover:text-secondary transition-all" href="#docs">
                                <span className="mr-2 material-symbols-outlined">code</span>
                                View_Syntax
                            </a>
                        </div>
                    </div>

                    <div className="relative hidden lg:block perspective-1000">
                        <div className="absolute -inset-2 bg-gradient-to-tr from-primary via-purple-500 to-secondary rounded-xl blur opacity-30"></div>
                        <div className="relative rounded-lg border border-border-dark bg-terminal-bg shadow-2xl overflow-hidden font-mono text-sm leading-relaxed transform rotate-1 hover:rotate-0 transition-transform duration-500">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-border-dark bg-[#1a1a24]">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                                </div>
                                <div className="flex-1 mx-4 bg-[#0d0d12] rounded px-3 py-1 flex items-center text-gray-400 text-xs">
                                    <span className="material-symbols-outlined text-[12px] mr-2">lock</span>
                                    cltanks.io
                                </div>
                                <div className="w-6"></div>
                            </div>
                            <div className="p-6 text-gray-300 h-[380px] overflow-y-auto flex flex-col font-medium font-mono text-xs md:text-sm">
                                <div className="text-gray-500 mb-2"># Initializing tactical overlay...</div>
                                <div className="mb-4 text-white">
                                    &gt; Connection established with US-East-1.<br />
                                    &gt; [ID] Player connected as <span className="text-accent">Viper</span>.<br />
                                    &gt; Ready for input (type 'help' for commands).
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-secondary">viper@cltanks:~$</span>
                                    <span className="text-white">tanks</span>
                                </div>
                                <div className="text-gray-400 pb-2 pl-4 border-l border-gray-700 ml-1">
                                    &gt; Scanning local sector...<br />
                                    &gt; Found 3 active units:<br />
                                    &gt; [a4] Team 1 - Alpha (Dist: 45m)<br />
                                    &gt; [z2] Team 2 - Bravo (Dist: 120m)
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-secondary">viper@cltanks:~$</span>
                                    <span className="text-white">drive northeast 10</span>
                                </div>
                                <div className="text-gray-400 pb-2 pl-4 border-l border-gray-700 ml-1">
                                    &gt; Pathfinding to (10.0, -10.0)... <span className="text-green-500">Executing</span><br />
                                    &gt; Velocity: 4.5 m/s
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-secondary">viper@cltanks:~$</span>
                                    <span className="text-white">target a4</span>
                                </div>
                                <div className="text-gray-400 pb-2 pl-4 border-l border-gray-700 ml-1">
                                    &gt; Tracking unit [a4]... <span className="text-accent">LOCKED</span><br />
                                    &gt; Turret aligning...
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-secondary">viper@cltanks:~$</span>
                                    <span className="text-white">fire</span>
                                </div>
                                <div className="text-gray-400 pb-2 pl-4 border-l border-gray-700 ml-1">
                                    &gt; Main gun discharged.<br />
                                    &gt; <span className="text-accent">ENEMY UNIT [a4] DESTROYED.</span>
                                </div>
                                <div className="flex gap-2 items-center mt-2">
                                    <span className="text-secondary">viper@cltanks:~$</span>
                                    <span className="text-white">overdrive</span>
                                    <span className="terminal-cursor"></span>
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
                            COMMAND_SYNTAX
                        </h2>
                        <p className="text-gray-400 text-lg font-light leading-relaxed">
                            Victory requires memorization and muscle memory. Master the syntax to control your unit without ever leaving the home row.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                        <div className="group relative rounded-xl bg-card-dark border border-border-dark hover:border-primary/50 transition-all hover:-translate-y-1 overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">north_east</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">drive</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Navigate through the world using pathfinding. Can target areas or specific enemy codes.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">drive &lt;dir|code&gt; [dist]</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> drive north 10</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark hover:border-primary/50 transition-all hover:-translate-y-1 overflow-hidden shadow-lg">
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

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark hover:border-primary/50 transition-all hover:-translate-y-1 overflow-hidden shadow-lg">
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

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark hover:border-primary/50 transition-all hover:-translate-y-1 overflow-hidden shadow-lg">
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

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark hover:border-primary/50 transition-all hover:-translate-y-1 overflow-hidden shadow-lg">
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

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark hover:border-primary/50 transition-all hover:-translate-y-1 overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">cloud</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">smoke</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Deploy a smoke cloud at your position. Breaks lock-ons and obscures vision.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">smoke</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> smoke</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark hover:border-primary/50 transition-all hover:-translate-y-1 overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">electric_bolt</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">overdrive</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Temporarily push your engines beyond safety limits. 25% speed increase.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">overdrive</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> od</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark hover:border-primary/50 transition-all hover:-translate-y-1 overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-7xl text-white">build_circle</span>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-secondary font-mono text-xl font-bold">repair</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                                    Initiate field repairs. Regenerates health over time, but movement cancels it.
                                </p>
                                <div className="bg-code-bg rounded border border-white/5 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                    <div className="text-gray-500 mb-1"># Syntax</div>
                                    <div className="text-primary font-bold mb-3">repair</div>
                                    <div className="text-gray-500 mb-1"># Type this:</div>
                                    <div className="text-white"><span className="text-secondary">$</span> rep</div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative rounded-xl bg-card-dark border border-border-dark hover:border-primary/50 transition-all hover:-translate-y-1 overflow-hidden shadow-lg">
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
                    </div>
                </div>
            </section>


            <footer className="bg-[#1a1a24] py-10 border-t border-border-dark text-center md:text-left">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-white">
                            <span className="material-symbols-outlined text-primary">keyboard</span>
                            <span className="font-bold tracking-tight font-mono">CLTANKS</span>
                        </div>
                        <p className="text-gray-500 text-sm font-mono">© 2024 CLTanks</p>
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
