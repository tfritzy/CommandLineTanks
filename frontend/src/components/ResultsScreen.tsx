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
    const winnerText = winningTeam === 0 ? 'Team Red Wins!' : 'Team Blue Wins!';
    const winnerColor = winningTeam === 0 ? '#ff6666' : '#6666ff';

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            color: 'white',
            fontFamily: 'monospace'
        }}>
            <div style={{
                maxWidth: '800px',
                width: '90%',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: winnerColor,
                    marginBottom: '20px',
                    textShadow: `0 0 20px ${winnerColor}`
                }}>
                    {winnerText}
                </div>

                <div style={{
                    fontSize: '24px',
                    marginBottom: '40px',
                    color: '#ccc'
                }}>
                    Next round starts in {timeRemaining} seconds
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    gap: '40px'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: '#ff6666',
                            marginBottom: '20px',
                            borderBottom: '3px solid #ff6666',
                            paddingBottom: '10px'
                        }}>
                            Team Red ({team0Kills} kills)
                        </div>
                        {team0Tanks.map((tank, index) => (
                            <div key={tank.id} style={{
                                fontSize: '18px',
                                padding: '10px',
                                backgroundColor: index === 0 ? 'rgba(255, 102, 102, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                marginBottom: '5px',
                                borderRadius: '5px',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>{tank.name}</span>
                                <span style={{ fontWeight: 'bold' }}>{tank.kills} kills</span>
                            </div>
                        ))}
                        {team0Tanks.length === 0 && (
                            <div style={{ fontSize: '16px', color: '#888', fontStyle: 'italic' }}>
                                No tanks
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: '#6666ff',
                            marginBottom: '20px',
                            borderBottom: '3px solid #6666ff',
                            paddingBottom: '10px'
                        }}>
                            Team Blue ({team1Kills} kills)
                        </div>
                        {team1Tanks.map((tank, index) => (
                            <div key={tank.id} style={{
                                fontSize: '18px',
                                padding: '10px',
                                backgroundColor: index === 0 ? 'rgba(102, 102, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                marginBottom: '5px',
                                borderRadius: '5px',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>{tank.name}</span>
                                <span style={{ fontWeight: 'bold' }}>{tank.kills} kills</span>
                            </div>
                        ))}
                        {team1Tanks.length === 0 && (
                            <div style={{ fontSize: '16px', color: '#888', fontStyle: 'italic' }}>
                                No tanks
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
