import { useEffect, useState } from 'react';

interface Tank {
    id: string;
    name: string;
    alliance: number;
    kills: number;
}

interface ResultsScreenProps {
    worldId: string;
    countdownSeconds: number;
    winningTeam: number;
    tanks: Tank[];
}

export default function ResultsScreen({ countdownSeconds, winningTeam, tanks }: ResultsScreenProps) {
    const [timeRemaining, setTimeRemaining] = useState(countdownSeconds);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const team0Tanks = tanks.filter(t => t.alliance === 0).sort((a, b) => b.kills - a.kills);
    const team1Tanks = tanks.filter(t => t.alliance === 1).sort((a, b) => b.kills - a.kills);

    const team0Kills = team0Tanks.reduce((sum, t) => sum + t.kills, 0);
    const team1Kills = team1Tanks.reduce((sum, t) => sum + t.kills, 0);

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
