import { useEffect, useRef } from 'react';
import { Game } from '../Game';
import TerminalComponent from '../components/terminal/Terminal';

export default function GamePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<Game | null>(null);

    useEffect(() => {
        if (canvasRef.current && !gameRef.current) {
            gameRef.current = new Game(canvasRef.current);
            gameRef.current.start();
        }

        return () => {
            gameRef.current?.destroy();
            gameRef.current = null;
        };
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    margin: 0,
                    padding: 0,
                    width: '100vw',
                    height: '100vh'
                }}
            />
            <TerminalComponent />
        </>
    );
}
