import { useEffect, useState } from 'react';
import { getConnection } from '../spacetimedb-connection';
import type { Infer } from 'spacetimedb';
import Tank from '../../module_bindings/tank_type';

const WORLD_RESET_DELAY_SECONDS = 30;

type TankType = Infer<typeof Tank>;

interface ResultsScreenProps {
    worldId: string;
}

export default function ResultsScreen({ worldId }: ResultsScreenProps) {
    const [timeRemaining, setTimeRemaining] = useState(WORLD_RESET_DELAY_SECONDS);
    const [tanks, setTanks] = useState<TankType[]>([]);
    const [team0Kills, setTeam0Kills] = useState(0);
    const [team1Kills, setTeam1Kills] = useState(0);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const connection = getConnection();
        if (!connection) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => Math.max(0, prev - 1));
        }, 1000);

        const subscriptionHandle = connection
            .subscriptionBuilder()
            .onError((e) => console.error("Results subscription error", e))
            .subscribe([
                `SELECT * FROM tank WHERE WorldId = '${worldId}'`,
                `SELECT * FROM score WHERE WorldId = '${worldId}'`,
                `SELECT * FROM world WHERE Id = '${worldId}'`
            ]);

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
                setTimeRemaining(WORLD_RESET_DELAY_SECONDS);
            } else {
                setShowResults(false);
            }
        };

        updateTanks();
        updateScores();
        updateVisibility();

        connection.db.tank.onUpdate((_ctx, _oldTank, newTank) => {
            if (newTank.worldId === worldId) {
                updateTanks();
            }
        });

        connection.db.tank.onInsert((_ctx, tank) => {
            if (tank.worldId === worldId) {
                updateTanks();
            }
        });

        connection.db.tank.onDelete((_ctx, tank) => {
            if (tank.worldId === worldId) {
                updateTanks();
            }
        });

        connection.db.score.onUpdate((_ctx, _oldScore, newScore) => {
            if (newScore.worldId === worldId) {
                updateScores();
            }
        });

        connection.db.world.onUpdate((_ctx, oldWorld, newWorld) => {
            if (newWorld.id === worldId) {
                if (newWorld.gameState.tag === 'Results' && oldWorld.gameState.tag === 'Playing') {
                    setShowResults(true);
                    setTimeRemaining(WORLD_RESET_DELAY_SECONDS);
                    updateTanks();
                    updateScores();
                } else if (newWorld.gameState.tag === 'Playing' && oldWorld.gameState.tag === 'Results') {
                    setShowResults(false);
                }
            }
        });

        connection.db.world.onInsert((_ctx, world) => {
            if (world.id === worldId && world.gameState.tag === 'Results') {
                setShowResults(true);
                setTimeRemaining(WORLD_RESET_DELAY_SECONDS);
                updateTanks();
                updateScores();
            }
        });

        return () => {
            clearInterval(interval);
            subscriptionHandle.unsubscribe();
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

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(42, 21, 45, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            fontFamily: "'JetBrains Mono', monospace"
        }}>
            <div style={{
                maxWidth: '900px',
                width: '90%',
                textAlign: 'center',
                padding: '60px 40px'
            }}>
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
                    color: '#a9bcbf',
                    fontWeight: 300,
                    letterSpacing: '0.02em'
                }}>
                    Next round in {timeRemaining}s
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
                                    color: index === 0 ? '#fcfbf3' : '#a9bcbf',
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
                                    color: index === 0 ? '#fcfbf3' : '#a9bcbf',
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
