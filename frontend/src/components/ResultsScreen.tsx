import { useEffect, useState, useRef } from 'react';
import { getConnection } from '../spacetimedb-connection';
import { type Infer } from 'spacetimedb';
import TankRow from '../../module_bindings/tank_type';
import ScoreRow from '../../module_bindings/score_type';
import WorldRow from '../../module_bindings/world_type';
import { type EventContext } from "../../module_bindings";
import { ServerTimeSync } from '../utils/ServerTimeSync';
import { COLORS } from '../theme/colors';
import { SoundManager } from '../managers/SoundManager';
import { createMultiTableSubscription, type MultiTableSubscription } from '../utils/tableSubscription';

const WORLD_RESET_DELAY_MICROS = 30_000_000;

interface ResultsScreenProps {
    worldId: string;
}

export default function ResultsScreen({ worldId }: ResultsScreenProps) {
    const [tanks, setTanks] = useState<Infer<typeof TankRow>[]>([]);
    const [team0Kills, setTeam0Kills] = useState(0);
    const [team1Kills, setTeam1Kills] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [gameEndTime, setGameEndTime] = useState<bigint | null>(null);
    const subscriptionRef = useRef<MultiTableSubscription | null>(null);

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
                                    const winningTeam = team0Kills > team1Kills ? 0 : 1;

                                    if (myTank.alliance === winningTeam) {
                                        SoundManager.getInstance().play('win');
                                    } else {
                                        SoundManager.getInstance().play('loss');
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

    const winningTeam = team0Kills > team1Kills ? 0 : 1;
    const winnerText = winningTeam === 0 ? 'Red Victory' : 'Blue Victory';
    const winnerColor = winningTeam === 0 ? '#c06852' : '#5a78b2';

    const timeUntilReset = gameEndTime !== null
        ? Math.ceil(Number(gameEndTime + BigInt(WORLD_RESET_DELAY_MICROS) - BigInt(Math.floor(ServerTimeSync.getInstance().getServerTime() * 1000))) / 1_000_000)
        : 0;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(46, 46, 67, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            fontFamily: "'JetBrains Mono', monospace"
        }}>
            <div style={{
                background: '#2a152d',
                border: '4px solid #813645',
                borderRadius: '8px',
                maxWidth: '900px',
                width: '90%',
                maxHeight: '85vh',
                overflowY: 'auto',
                textAlign: 'center',
                padding: '60px 40px',
                animation: 'fadeIn 0.5s ease-in'
            }}>
                <style>{`
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                `}</style>
                <div style={{
                    fontSize: '72px',
                    fontWeight: 300,
                    color: winnerColor,
                    marginBottom: '16px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                }}>
                    {winnerText}
                </div>

                <div style={{
                    fontSize: '18px',
                    marginBottom: '80px',
                    color: COLORS.TERMINAL.TEXT_MUTED,
                    fontWeight: 300,
                    letterSpacing: '0.02em'
                }}>
                    Next round in {timeUntilReset}s
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '80px',
                    maxWidth: '800px',
                    margin: '0 auto'
                }}>
                    <div>
                        <div style={{
                            fontSize: '14px',
                            color: '#c06852',
                            marginBottom: '24px',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            fontWeight: 500,
                            opacity: 0.9
                        }}>
                            Red · {team0Kills}
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {team0Tanks.map((tank, index) => (
                                <div key={tank.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '16px',
                                    color: index === 0 ? COLORS.UI.TEXT_PRIMARY : COLORS.TERMINAL.TEXT_MUTED,
                                    paddingBottom: '12px',
                                    borderBottom: '1px solid rgba(169, 188, 191, 0.1)',
                                    fontWeight: index === 0 ? 500 : 300
                                }}>
                                    <span style={{
                                        flex: 1,
                                        textAlign: 'left',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>{tank.name}</span>
                                    <span style={{
                                        marginLeft: '16px',
                                        color: index === 0 ? '#c06852' : '#707b89',
                                        fontSize: '14px'
                                    }}>{tank.kills} / {tank.deaths}</span>
                                </div>
                            ))}
                            {team0Tanks.length === 0 && (
                                <div style={{
                                    fontSize: '14px',
                                    color: '#707b89',
                                    fontStyle: 'italic',
                                    opacity: 0.5
                                }}>
                                    No combatants
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div style={{
                            fontSize: '14px',
                            color: '#5a78b2',
                            marginBottom: '24px',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            fontWeight: 500,
                            opacity: 0.9
                        }}>
                            Blue · {team1Kills}
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {team1Tanks.map((tank, index) => (
                                <div key={tank.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '16px',
                                    color: index === 0 ? COLORS.UI.TEXT_PRIMARY : COLORS.TERMINAL.TEXT_MUTED,
                                    paddingBottom: '12px',
                                    borderBottom: '1px solid rgba(169, 188, 191, 0.1)',
                                    fontWeight: index === 0 ? 500 : 300
                                }}>
                                    <span style={{
                                        flex: 1,
                                        textAlign: 'left',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>{tank.name}</span>
                                    <span style={{
                                        marginLeft: '16px',
                                        color: index === 0 ? '#5a78b2' : '#707b89',
                                        fontSize: '14px'
                                    }}>{tank.kills} / {tank.deaths}</span>
                                </div>
                            ))}
                            {team1Tanks.length === 0 && (
                                <div style={{
                                    fontSize: '14px',
                                    color: '#707b89',
                                    fontStyle: 'italic',
                                    opacity: 0.5
                                }}>
                                    No combatants
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
