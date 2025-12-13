import { useEffect, useRef } from 'react';
import { Game } from '../game';
import TerminalComponent from '../components/terminal/Terminal';

interface GamePageProps {
    worldId: string;
}

export default function GamePage({ worldId }: GamePageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<Game | null>(null);

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
            <div style={{ flex: 1, overflow: 'hidden' }}>
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
            </div>
            <TerminalComponent />
        </div>
    );
}
