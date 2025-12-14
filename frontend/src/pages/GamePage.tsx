import { useEffect, useRef, useState } from 'react';
import { Game } from '../game';
import TerminalComponent from '../components/terminal/Terminal';
import ResultsScreen from '../components/ResultsScreen';
import { getConnection } from '../spacetimedb-connection';

interface GamePageProps {
    worldId: string;
}

export default function GamePage({ worldId }: GamePageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<Game | null>(null);
    const [isDead, setIsDead] = useState(false);
    const [showResults, setShowResults] = useState(false);

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
                    setShowResults(true);
                } else if (newWorld.gameState.tag === 'Playing' && oldWorld.gameState.tag === 'Results') {
                    setShowResults(false);
                }
            }
        });

        connection.db.world.onInsert((_ctx, world) => {
            if (world.id === worldId) {
                if (world.gameState.tag === 'Results') {
                    setShowResults(true);
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
                    <ResultsScreen worldId={worldId} />
                )}
            </div>
            <TerminalComponent />
        </div>
    );
}
