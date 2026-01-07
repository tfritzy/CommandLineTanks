import { useEffect, useState, useRef } from 'react';
import { getConnection } from '../spacetimedb-connection';
import { type Infer } from 'spacetimedb';
import TankRow from '../../module_bindings/tank_type';
import ScoreRow from '../../module_bindings/score_type';
import WorldRow from '../../module_bindings/world_type';
import { type EventContext } from "../../module_bindings";
import { ServerTimeSync } from '../utils/ServerTimeSync';
import { COLORS, PALETTE } from '../theme/colors';
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
                                    connection.identity && t.owner.isEqual(connection.identity) && t.worldId === worldId
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
    const winnerColor = isDraw ? PALETTE.WHITE_BRIGHT : (winningTeam === 0 ? PALETTE.RED_MUTED : PALETTE.BLUE_INFO);

    const timeUntilReset = gameEndTime !== null
        ? Math.max(0, Math.ceil(Number(gameEndTime + BigInt(WORLD_RESET_DELAY_MICROS) - BigInt(Math.floor(ServerTimeSync.getInstance().getServerTime() * 1000))) / 1_000_000))
        : 0;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            fontFamily: "'JetBrains Mono', monospace"
        }}>
            <div style={{
                background: `${PALETTE.PURPLE_VOID}d9`,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${PALETTE.WHITE_PURE}14`,
                borderRadius: '4px',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '85vh',
                overflowY: 'auto',
                textAlign: 'center',
                padding: '48px 40px',
                boxShadow: `0 8px 32px ${PALETTE.BLACK_PURE}99`,
                animation: 'resultsFadeIn 0.4s ease-out'
            }}>
                <style>{`
                    @keyframes resultsFadeIn {
                        from { opacity: 0; transform: scale(0.98); }
                        to { opacity: 1; transform: scale(1); }
                    }
                `}</style>
                <div style={{
                    fontSize: '48px',
                    fontWeight: '900',
                    color: winnerColor,
                    marginBottom: '8px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textShadow: `0 0 20px ${winnerColor}4d`,
                }}>
                    {winnerText}
                </div>

                <div style={{
                    fontSize: '14px',
                    marginBottom: '60px',
                    color: COLORS.UI.TEXT_DIM,
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    opacity: 0.8
                }}>
                    Next round in {timeUntilReset} seconds
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '60px',
                    maxWidth: '750px',
                    margin: '0 auto'
                }}>
                    <div>
                        <div style={{
                            fontSize: '9px',
                            color: PALETTE.RED_MUTED,
                            marginBottom: '16px',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            fontWeight: '800',
                            borderBottom: `1px solid ${PALETTE.RED_MUTED}33`,
                            paddingBottom: '8px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 40px 40px 50px',
                            gap: '8px',
                            textAlign: 'right'
                        }}>
                            <span style={{ textAlign: 'left' }}>RED TEAM</span>
                            <span style={{ opacity: 0.5 }}>KDR</span>
                            <span style={{ opacity: 0.5 }}>D</span>
                            <span style={{ opacity: 0.5 }}>KILLS</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            {team0Tanks.map((tank) => {
                                const kdr = tank.deaths === 0 ? tank.kills.toFixed(1) : (tank.kills / tank.deaths).toFixed(1);
                                return (
                                    <div key={tank.id} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 40px 40px 50px',
                                        gap: '8px',
                                        alignItems: 'center',
                                        fontSize: '13px',
                                        color: COLORS.UI.TEXT_PRIMARY,
                                        padding: '4px 0',
                                        fontWeight: '500',
                                        textAlign: 'right'
                                    }}>
                                        <span style={{ opacity: 0.8, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tank.name}</span>
                                        <span style={{ opacity: 0.4 }}>{kdr}</span>
                                        <span style={{ opacity: 0.4 }}>{tank.deaths}</span>
                                        <span style={{ color: PALETTE.ORANGE_MEDIUM, fontWeight: '800', fontSize: '15px' }}>{tank.kills}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div style={{
                            fontSize: '9px',
                            color: PALETTE.BLUE_INFO,
                            marginBottom: '16px',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            fontWeight: '800',
                            borderBottom: `1px solid ${PALETTE.BLUE_INFO}33`,
                            paddingBottom: '8px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 40px 40px 50px',
                            gap: '8px',
                            textAlign: 'right'
                        }}>
                            <span style={{ textAlign: 'left' }}>BLUE TEAM</span>
                            <span style={{ opacity: 0.5 }}>KDR</span>
                            <span style={{ opacity: 0.5 }}>D</span>
                            <span style={{ opacity: 0.5 }}>KILLS</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            {team1Tanks.map((tank) => {
                                const kdr = tank.deaths === 0 ? tank.kills.toFixed(1) : (tank.kills / tank.deaths).toFixed(1);
                                return (
                                    <div key={tank.id} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 40px 40px 50px',
                                        gap: '8px',
                                        alignItems: 'center',
                                        fontSize: '13px',
                                        color: COLORS.UI.TEXT_PRIMARY,
                                        padding: '4px 0',
                                        fontWeight: '500',
                                        textAlign: 'right'
                                    }}>
                                        <span style={{ opacity: 0.8, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tank.name}</span>
                                        <span style={{ opacity: 0.4 }}>{kdr}</span>
                                        <span style={{ opacity: 0.4 }}>{tank.deaths}</span>
                                        <span style={{ color: PALETTE.BLUE_BRIGHT, fontWeight: '800', fontSize: '15px' }}>{tank.kills}</span>
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
