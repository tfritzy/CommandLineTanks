import { useEffect, useRef, useState } from 'react';
import { Game } from '../game';
import TerminalComponent from '../components/terminal/Terminal';
import ResultsScreen from '../components/ResultsScreen';
import { getConnection } from '../spacetimedb-connection';

const WORLD_RESET_DELAY_SECONDS = 30;

interface GamePageProps {
    worldId: string;
}

interface Tank {
    id: string;
    name: string;
    alliance: number;
    kills: number;
}

export default function GamePage({ worldId }: GamePageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<Game | null>(null);
    const [isDead, setIsDead] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [winningTeam, setWinningTeam] = useState(0);
    const [tanks, setTanks] = useState<Tank[]>([]);
    const resultsStartTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (canvasRef.current && !gameRef.current) {
            gameRef.current = new Game(canvasRef.current, worldId);
            gameRef.current.start();
        }

        return () => {
            gameRef.current?.destroy();
            gameRef.current = null;
        };
    }, [worldId]);

    useEffect(() => {
        const connection = getConnection();
        if (!connection) return;

        connection.db.tank.onUpdate((_ctx, _oldTank, newTank) => {
            if (connection.identity && newTank.owner.isEqual(connection.identity)) {
                setIsDead(newTank.isDead);
            }
        });

        connection.db.tank.onInsert((_ctx, tank) => {
            if (connection.identity && tank.owner.isEqual(connection.identity)) {
                setIsDead(tank.isDead);
            }
        });

        connection
            .subscriptionBuilder()
            .onError((e) => console.error("World subscription error", e))
            .subscribe([`SELECT * FROM world WHERE id = '${worldId}'`]);

        connection.db.world.onUpdate((_ctx, oldWorld, newWorld) => {
            if (newWorld.id === worldId) {
                if (newWorld.gameState.tag === 'Results' && oldWorld.gameState.tag === 'Playing') {
                    resultsStartTimeRef.current = Date.now();
                    setShowResults(true);

                    const allTanks = Array.from(connection.db.tank.iter())
                        .filter(t => t.worldId === worldId)
                        .map(t => ({
                            id: t.id,
                            name: t.name,
                            alliance: t.alliance,
                            kills: t.kills
                        }));

                    setTanks(allTanks);

                    const score = connection.db.score.WorldId.find(worldId);
                    if (score) {
                        const team0Kills = score.kills[0] || 0;
                        const team1Kills = score.kills[1] || 0;
                        setWinningTeam(team0Kills > team1Kills ? 0 : 1);
                    }
                } else if (newWorld.gameState.tag === 'Playing' && oldWorld.gameState.tag === 'Results') {
                    setShowResults(false);
                    resultsStartTimeRef.current = null;
                }
            }
        });

        connection.db.world.onInsert((_ctx, world) => {
            if (world.id === worldId) {
                if (world.gameState.tag === 'Results') {
                    resultsStartTimeRef.current = Date.now();
                    setShowResults(true);

                    const allTanks = Array.from(connection.db.tank.iter())
                        .filter(t => t.worldId === worldId)
                        .map(t => ({
                            id: t.id,
                            name: t.name,
                            alliance: t.alliance,
                            kills: t.kills
                        }));

                    setTanks(allTanks);

                    const score = connection.db.score.WorldId.find(worldId);
                    if (score) {
                        const team0Kills = score.kills[0] || 0;
                        const team1Kills = score.kills[1] || 0;
                        setWinningTeam(team0Kills > team1Kills ? 0 : 1);
                    }
                }
            }
        });
    }, [worldId]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            margin: 0,
            padding: 0,
            overflow: 'hidden'
        }}>
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <canvas
                    ref={canvasRef}
                    style={{
                        display: 'block',
                        margin: 0,
                        padding: 0,
                        width: '100%',
                        height: '100%'
                    }}
                />
                {isDead && !showResults && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0, 0, 0, 0.8)',
                        padding: '40px 60px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        color: 'white',
                        fontFamily: 'monospace',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        border: '3px solid red',
                        zIndex: 1000
                    }}>
                        <div style={{ fontSize: '36px', marginBottom: '20px', color: 'red' }}>
                            YOU DIED
                        </div>
                        <div style={{ fontSize: '18px', color: '#ccc' }}>
                            Call the respawn command to respawn
                        </div>
                    </div>
                )}
                {showResults && (
                    <ResultsScreen
                        worldId={worldId}
                        countdownSeconds={WORLD_RESET_DELAY_SECONDS}
                        winningTeam={winningTeam}
                        tanks={tanks}
                    />
                )}
            </div>
            <TerminalComponent />
        </div>
    );
}
