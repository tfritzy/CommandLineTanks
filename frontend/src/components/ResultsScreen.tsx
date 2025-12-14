import { useEffect, useState } from 'react';
import type { Tank } from '../types/tank';
import { getConnection } from '../spacetimedb-connection';

const WORLD_RESET_DELAY_SECONDS = 30;

interface ResultsScreenProps {
    worldId: string;
}

export default function ResultsScreen({ worldId }: ResultsScreenProps) {
    const [timeRemaining, setTimeRemaining] = useState(WORLD_RESET_DELAY_SECONDS);
    const [tanks, setTanks] = useState<Tank[]>([]);
    const [team0Kills, setTeam0Kills] = useState(0);
    const [team1Kills, setTeam1Kills] = useState(0);

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
                `SELECT * FROM tank WHERE worldId = '${worldId}'`,
                `SELECT * FROM score WHERE worldId = '${worldId}'`
            ]);

        const updateTanks = () => {
            const allTanks = Array.from(connection.db.tank.iter())
                .filter(t => t.worldId === worldId)
                .map(t => ({
                    id: t.id,
                    name: t.name,
                    alliance: t.alliance,
                    kills: t.kills
                }));
            setTanks(allTanks);
        };

        const updateScores = () => {
            const score = connection.db.score.WorldId.find(worldId);
            if (score) {
                setTeam0Kills(score.kills[0] || 0);
                setTeam1Kills(score.kills[1] || 0);
            }
        };

        updateTanks();
        updateScores();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleTankUpdate = (_ctx: any, _oldTank: any, newTank: any) => {
            if (newTank.worldId === worldId) {
                updateTanks();
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleTankInsert = (_ctx: any, tank: any) => {
            if (tank.worldId === worldId) {
                updateTanks();
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleTankDelete = (_ctx: any, tank: any) => {
            if (tank.worldId === worldId) {
                updateTanks();
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleScoreUpdate = (_ctx: any, _oldScore: any, newScore: any) => {
            if (newScore.worldId === worldId) {
                updateScores();
            }
        };

        connection.db.tank.onUpdate(handleTankUpdate);
        connection.db.tank.onInsert(handleTankInsert);
        connection.db.tank.onDelete(handleTankDelete);
        connection.db.score.onUpdate(handleScoreUpdate);

        return () => {
            clearInterval(interval);
            subscriptionHandle.unsubscribe();
            connection.db.tank.removeOnUpdate(handleTankUpdate);
            connection.db.tank.removeOnInsert(handleTankInsert);
            connection.db.tank.removeOnDelete(handleTankDelete);
            connection.db.score.removeOnUpdate(handleScoreUpdate);
        };
    }, [worldId]);

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
