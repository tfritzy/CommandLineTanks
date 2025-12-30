import { useEffect, useState } from 'react';
import { getConnection } from '../spacetimedb-connection';
import type { Infer } from 'spacetimedb';
import Tank from '../../module_bindings/tank_type';
import { ServerTimeSync } from '../utils/ServerTimeSync';

const WORLD_RESET_DELAY_MICROS = 30_000_000;
const COUNTDOWN_MICROS = 10_000_000;

type TankType = Infer<typeof Tank>;

interface ResultsScreenProps {
    worldId: string;
}

export default function ResultsScreen({ worldId }: ResultsScreenProps) {
    const [countdownRemaining, setCountdownRemaining] = useState(COUNTDOWN_MICROS);
    const [tanks, setTanks] = useState<TankType[]>([]);
    const [team0Kills, setTeam0Kills] = useState(0);
    const [team1Kills, setTeam1Kills] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [gameEndTime, setGameEndTime] = useState<bigint | null>(null);
    const [countdownEndTime, setCountdownEndTime] = useState<number | null>(null);

    const calculateCountdownEndTime = (gameEndTimeMicros: bigint): number => {
        const serverTimeSync = ServerTimeSync.getInstance();
        const serverTimeMs = serverTimeSync.getServerTime();
        const clientTimeMs = Date.now();
        const gameEndTimeMs = Number(gameEndTimeMicros / 1000n);
        const countdownDurationMs = COUNTDOWN_MICROS / 1000;
        return clientTimeMs + (gameEndTimeMs - serverTimeMs) + countdownDurationMs;
    };

    useEffect(() => {
        const connection = getConnection();
        if (!connection) return;
        
        const interval = setInterval(() => {
            if (countdownEndTime !== null) {
                const now = Date.now();
                const timeUntilModal = countdownEndTime - now;
                
                setCountdownRemaining(Math.max(0, timeUntilModal * 1000));
                
                if (timeUntilModal <= 0 && !showModal) {
                    setShowModal(true);
                }
            }
        }, 100);

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
            if (world && (world.gameState.tag === 'Results' || world.gameState.tag === 'Countdown')) {
                setShowResults(true);
                const endTime = world.gameStartedAt + BigInt(world.gameDurationMicros);
                setGameEndTime(endTime);
                setCountdownEndTime(calculateCountdownEndTime(endTime));
                if (world.gameState.tag === 'Results') {
                    setShowModal(true);
                } else {
                    setShowModal(false);
                }
            } else {
                setShowResults(false);
                setShowModal(false);
                setGameEndTime(null);
                setCountdownEndTime(null);
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
                if ((newWorld.gameState.tag === 'Results' || newWorld.gameState.tag === 'Countdown') && oldWorld.gameState.tag === 'Playing') {
                    setShowResults(true);
                    const endTime = newWorld.gameStartedAt + BigInt(newWorld.gameDurationMicros);
                    setGameEndTime(endTime);
                    setCountdownEndTime(calculateCountdownEndTime(endTime));
                    setShowModal(false);
                    updateTanks();
                    updateScores();
                } else if (newWorld.gameState.tag === 'Results' && oldWorld.gameState.tag === 'Countdown') {
                    setShowModal(true);
                    updateTanks();
                    updateScores();
                } else if (newWorld.gameState.tag === 'Playing' && (oldWorld.gameState.tag === 'Results' || oldWorld.gameState.tag === 'Countdown')) {
                    setShowResults(false);
                    setShowModal(false);
                    setGameEndTime(null);
                    setCountdownEndTime(null);
                }
            }
        });

        connection.db.world.onInsert((_ctx, world) => {
            if (world.id === worldId && (world.gameState.tag === 'Results' || world.gameState.tag === 'Countdown')) {
                setShowResults(true);
                const endTime = world.gameStartedAt + BigInt(world.gameDurationMicros);
                setGameEndTime(endTime);
                setCountdownEndTime(calculateCountdownEndTime(endTime));
                if (world.gameState.tag === 'Results') {
                    setShowModal(true);
                } else {
                    setShowModal(false);
                }
                updateTanks();
                updateScores();
            }
        });

        return () => {
            clearInterval(interval);
            subscriptionHandle.unsubscribe();
        };
    }, [worldId, countdownEndTime]);

    if (!showResults) {
        return null;
    }

    const team0Tanks = tanks.filter(t => t.alliance === 0).sort((a, b) => b.kills - a.kills);
    const team1Tanks = tanks.filter(t => t.alliance === 1).sort((a, b) => b.kills - a.kills);

    const winningTeam = team0Kills > team1Kills ? 0 : 1;
    const winnerText = winningTeam === 0 ? 'Red Victory' : 'Blue Victory';
    const winnerColor = winningTeam === 0 ? '#c06852' : '#5a78b2';

    if (!showModal) {
        const secondsRemaining = Math.ceil(countdownRemaining / 1_000_000);
        return (
            <div style={{
                position: 'absolute',
                top: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2000,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '32px',
                fontWeight: 500,
                color: '#fcfbf3',
                textAlign: 'center',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
            }}>
                Game ending in {secondsRemaining}
            </div>
        );
    }

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
                    color: '#a9bcbf',
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
