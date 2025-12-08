import { useEffect, useRef } from 'react';
import { Game } from './Game';
import TerminalComponent from './components/terminal/Terminal';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vc = useRef<Game | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      vc.current = new Game(canvasRef.current);
      vc.current.start();

      return () => {
        vc.current?.destroy();
      };
    }
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

export default App;
