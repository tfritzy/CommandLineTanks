import { useEffect, useRef, useState, useMemo } from 'react';
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

    const isHomeworld = useMemo(() => {
        const connection = getConnection();
        return connection?.identity ? worldId === connection.identity.toHexString() : false;
    }, [worldId]);

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
                {isHomeworld && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '15px 30px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: 'white',
                        fontFamily: 'monospace',
                        fontSize: '18px',
                        zIndex: 1000,
                        border: '2px solid #10b981'
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '10px', fontWeight: 'bold' }}>
                            Welcome to Command Line Tanks
                        </div>
                        <div style={{ fontSize: '16px', color: '#ccc' }}>
                            When you're ready to find a game, call the find_game command
                        </div>
                    </div>
                )}
                <ResultsScreen worldId={worldId} />
            </div>
            <TerminalComponent />
        </div>
    );
}
