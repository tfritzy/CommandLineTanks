import { useEffect, useState, useRef } from 'react';
import { getConnection, isCurrentIdentity } from '../spacetimedb-connection';
import { type Infer } from 'spacetimedb';
import TankRow from '../../module_bindings/tank_type';
import ScoreRow from '../../module_bindings/score_type';
import WorldRow from '../../module_bindings/world_type';
import { type EventContext } from "../../module_bindings";
import { ServerTimeSync } from '../utils/ServerTimeSync';
import { SoundManager } from '../managers/SoundManager';
import { createMultiTableSubscription, type MultiTableSubscription } from '../utils/tableSubscription';

const WORLD_RESET_DELAY_MICROS = 15_000_000;

interface ResultsScreenProps {
    worldId: string;
}

export default function ResultsScreen({ worldId }: ResultsScreenProps) {
    const [tanks, setTanks] = useState<Infer<typeof TankRow>[]>([]);
    const [team0Kills, setTeam0Kills] = useState(0);
    const [team1Kills, setTeam1Kills] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [gameEndTime, setGameEndTime] = useState<bigint | null>(null);
    const [, setTick] = useState(0);
    const subscriptionRef = useRef<MultiTableSubscription | null>(null);

    useEffect(() => {
        if (!showResults) return;
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [showResults]);

    useEffect(() => {
        const connection = getConnection();
        if (!connection) return;

        const updateTanks = () => {
            const allTanks = Array.from(connection.db.tank.iter())
                .filter(t => t.worldId === worldId);
            setTanks(allTanks);
        };

        const updateScores = () => {
            const score = connection.db.score.WorldId.find(worldId);
            if (score) {
                setTeam0Kills(score.kills[0] || 0);
                setTeam1Kills(score.kills[1] || 0);
            }
        };

        const updateVisibility = () => {
            const world = connection.db.world.Id.find(worldId);
            if (world && world.gameState.tag === 'Results') {
                setShowResults(true);
                const endTime = world.gameStartedAt + BigInt(world.gameDurationMicros);
                setGameEndTime(endTime);
            } else {
                setShowResults(false);
                setGameEndTime(null);
            }
        };

        subscriptionRef.current = createMultiTableSubscription()
            .add<typeof TankRow>({
                table: connection.db.tank,
                handlers: {
                    onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
                        if (tank.worldId === worldId) updateTanks();
                    },
                    onUpdate: (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
                        if (newTank.worldId === worldId) updateTanks();
                    },
                    onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
                        if (tank.worldId === worldId) updateTanks();
                    }
                },
                loadInitialData: false
            })
            .add<typeof ScoreRow>({
                table: connection.db.score,
                handlers: {
                    onInsert: (_ctx: EventContext, score: Infer<typeof ScoreRow>) => {
                        if (score.worldId === worldId) updateScores();
                    },
                    onUpdate: (_ctx: EventContext, _oldScore: Infer<typeof ScoreRow>, newScore: Infer<typeof ScoreRow>) => {
                        if (newScore.worldId === worldId) updateScores();
                    }
                },
                loadInitialData: false
            })
            .add<typeof WorldRow>({
                table: connection.db.world,
                handlers: {
                    onInsert: (_ctx: EventContext, world: Infer<typeof WorldRow>) => {
                        if (world.id === worldId && world.gameState.tag === 'Results') {
                            setShowResults(true);
                            const endTime = world.gameStartedAt + BigInt(world.gameDurationMicros);
                            setGameEndTime(endTime);
                            updateTanks();
                            updateScores();
                        }
                    },
                    onUpdate: (_ctx: EventContext, oldWorld: Infer<typeof WorldRow>, newWorld: Infer<typeof WorldRow>) => {
                        if (newWorld.id === worldId) {
                            if (newWorld.gameState.tag === 'Results' && oldWorld.gameState.tag === 'Playing') {
                                setShowResults(true);
                                const endTime = newWorld.gameStartedAt + BigInt(newWorld.gameDurationMicros);
                                setGameEndTime(endTime);
                                updateTanks();
                                updateScores();

                                const score = connection.db.score.WorldId.find(worldId);
                                const myTank = Array.from(connection.db.tank.iter()).find(t =>
                                    isCurrentIdentity(t.owner) && t.worldId === worldId
                                );

                                if (score && myTank) {
                                    const team0Kills = score.kills[0] || 0;
                                    const team1Kills = score.kills[1] || 0;

                                    if (team0Kills === team1Kills) {
                                        SoundManager.getInstance().play('loss');
                                    } else {
                                        const winningTeam = team0Kills > team1Kills ? 0 : 1;
                                        if (myTank.alliance === winningTeam) {
                                            SoundManager.getInstance().play('win');
                                        } else {
                                            SoundManager.getInstance().play('loss');
                                        }
                                    }
                                }
                            } else if (newWorld.gameState.tag === 'Playing' && oldWorld.gameState.tag === 'Results') {
                                setShowResults(false);
                                setGameEndTime(null);
                            }
                        }
                    }
                },
                loadInitialData: false
            });

        updateTanks();
        updateScores();
        updateVisibility();

        return () => {
            subscriptionRef.current?.unsubscribe();
            subscriptionRef.current = null;
        };
    }, [worldId]);

    if (!showResults) {
        return null;
    }

    const team0Tanks = tanks.filter(t => t.alliance === 0).sort((a, b) => b.kills - a.kills);
    const team1Tanks = tanks.filter(t => t.alliance === 1).sort((a, b) => b.kills - a.kills);

    const isDraw = team0Kills === team1Kills;
    const winningTeam = team0Kills > team1Kills ? 0 : 1;
    const winnerText = isDraw ? 'DRAW' : (winningTeam === 0 ? 'RED VICTORY' : 'BLUE VICTORY');
    const winnerColor = isDraw ? '#fcfbf3' : (winningTeam === 0 ? '#c06852' : '#7396d5');

    const timeUntilReset = gameEndTime !== null
        ? Math.max(0, Math.ceil(Number(gameEndTime + BigInt(WORLD_RESET_DELAY_MICROS) - BigInt(Math.floor(ServerTimeSync.getInstance().getServerTime() * 1000))) / 1_000_000))
        : 0;

    return (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-[2000] font-mono">
            <div className="bg-palette-purple-void/85 backdrop-blur-xl border border-palette-white-pure/[0.08] rounded max-w-[800px] w-[90%] max-h-[85vh] overflow-y-auto text-center py-12 px-10 shadow-2xl animate-[resultsFadeIn_0.4s_ease-out]">
                <style>{`
                    @keyframes resultsFadeIn {
                        from { opacity: 0; transform: scale(0.98); }
                        to { opacity: 1; transform: scale(1); }
                    }
                `}</style>
                <div className="text-5xl font-black mb-2 tracking-[0.1em] uppercase" style={{ color: winnerColor, textShadow: `0 0 20px ${winnerColor}30` }}>
                    {winnerText}
                </div>

                <div className="text-sm mb-[60px] text-ui-text-dim font-bold tracking-[0.1em] uppercase opacity-80">
                    Next round in {timeUntilReset} seconds
                </div>

                <div className="grid grid-cols-2 gap-[60px] max-w-[750px] mx-auto">
                    <div>
                        <div className="text-[9px] text-palette-red-muted mb-4 tracking-[0.2em] uppercase font-extrabold border-b border-palette-red-muted/20 pb-2 grid grid-cols-[1fr_40px_40px_50px] gap-2 text-right">
                            <span className="text-left">RED TEAM</span>
                            <span className="opacity-50">KDR</span>
                            <span className="opacity-50">D</span>
                            <span className="opacity-50">KILLS</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            {team0Tanks.map((tank) => {
                                const kdr = tank.deaths === 0 ? tank.kills.toFixed(1) : (tank.kills / tank.deaths).toFixed(1);
                                return (
                                    <div key={tank.id} className="grid grid-cols-[1fr_40px_40px_50px] gap-2 items-center text-[13px] text-ui-text-primary py-1 font-medium text-right">
                                        <span className="opacity-80 text-left overflow-hidden text-ellipsis whitespace-nowrap">{tank.name}</span>
                                        <span className="opacity-40">{kdr}</span>
                                        <span className="opacity-40">{tank.deaths}</span>
                                        <span className="text-palette-orange-medium font-extrabold text-[15px]">{tank.kills}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div className="text-[9px] text-palette-blue-info mb-4 tracking-[0.2em] uppercase font-extrabold border-b border-palette-blue-info/20 pb-2 grid grid-cols-[1fr_40px_40px_50px] gap-2 text-right">
                            <span className="text-left">BLUE TEAM</span>
                            <span className="opacity-50">KDR</span>
                            <span className="opacity-50">D</span>
                            <span className="opacity-50">KILLS</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            {team1Tanks.map((tank) => {
                                const kdr = tank.deaths === 0 ? tank.kills.toFixed(1) : (tank.kills / tank.deaths).toFixed(1);
                                return (
                                    <div key={tank.id} className="grid grid-cols-[1fr_40px_40px_50px] gap-2 items-center text-[13px] text-ui-text-primary py-1 font-medium text-right">
                                        <span className="opacity-80 text-left overflow-hidden text-ellipsis whitespace-nowrap">{tank.name}</span>
                                        <span className="opacity-40">{kdr}</span>
                                        <span className="opacity-40">{tank.deaths}</span>
                                        <span className="text-palette-blue-bright font-extrabold text-[15px]">{tank.kills}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
