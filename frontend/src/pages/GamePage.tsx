import { useEffect, useRef, useState } from 'react';
import { Game } from '../game';
import TerminalComponent from '../components/terminal/Terminal';
import ResultsScreen from '../components/ResultsScreen';
import { getConnection } from '../spacetimedb-connection';

interface GamePageProps {
    worldId: string;
    onWorldChange: (worldId: string) => void;
}

export default function GamePage({ worldId, onWorldChange }: GamePageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<Game | null>(null);
    const [isDead, setIsDead] = useState(false);

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

        const handleTankInsert = (_ctx: any, tank: any) => {
            if (connection.identity && tank.owner.isEqual(connection.identity)) {
                if (tank.worldId !== worldId) {
                    console.log(`Switching to new world: ${tank.worldId}`);
                    onWorldChange(tank.worldId);
                }
                setIsDead(tank.isDead);
            }
        };

        const handleTankUpdate = (_ctx: any, _oldTank: any, newTank: any) => {
            if (connection.identity && newTank.owner.isEqual(connection.identity)) {
                setIsDead(newTank.isDead);
            }
        };

        connection.db.tank.onUpdate(handleTankUpdate);
        connection.db.tank.onInsert(handleTankInsert);

        return () => {
            connection.db.tank.removeOnUpdate(handleTankUpdate);
            connection.db.tank.removeOnInsert(handleTankInsert);
        };
    }, [worldId, onWorldChange]);

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
                {isDead && (
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
                <ResultsScreen worldId={worldId} />
            </div>
            <TerminalComponent />
        </div>
    );
}
