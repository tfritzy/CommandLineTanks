import { useEffect, useState, useRef } from 'react';
import { Game } from './game';
import TerminalComponent from './components/terminal/Terminal';
import ResultsScreen from './components/ResultsScreen';
import GunInventory from './components/GunInventory';
import { connectToSpacetimeDB, getConnection } from './spacetimedb-connection';
import { useWorldSwitcher } from './hooks/useWorldSwitcher';
import { type Infer } from 'spacetimedb';
import TankRow from '../module_bindings/tank_type';
import { type EventContext } from '../module_bindings';

function App() {
  const [isSpacetimeConnected, setIsSpacetimeConnected] = useState(false);
  const [worldId, setWorldId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [isDead, setIsDead] = useState(false);
  const [playerGuns, setPlayerGuns] = useState<Infer<typeof TankRow>['guns']>([]);
  const [playerSelectedGunIndex, setPlayerSelectedGunIndex] = useState<number>(0);

  const handleWorldChange = (newWorldId: string) => {
    setWorldId(newWorldId);
  };

  useWorldSwitcher(handleWorldChange);

  useEffect(() => {
    connectToSpacetimeDB().then((conn) => {
      setIsSpacetimeConnected(true);

      if (conn.identity) {
        const identityString = conn.identity.toHexString();
        console.log(`Setting homeworld to identity: ${identityString}`);
        handleWorldChange(identityString);
      }
    }).catch((error) => {
      console.error('Failed to establish SpacetimeDB connection:', error);
    });
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !worldId) return;

    gameRef.current?.destroy();
    gameRef.current = new Game(canvasRef.current, worldId);
    gameRef.current.start();

    return () => {
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [worldId]);

  useEffect(() => {
    if (!worldId) return;

    const connection = getConnection();
    if (!connection) return;

    const handleTankInsert = (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
      if (connection.identity && tank.owner.isEqual(connection.identity) && tank.worldId === worldId) {
        setIsDead(tank.isDead);
        setPlayerGuns(tank.guns);
        setPlayerSelectedGunIndex(tank.selectedGunIndex);
      }
    };

    const handleTankUpdate = (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
      if (connection.identity && newTank.owner.isEqual(connection.identity) && newTank.worldId === worldId) {
        setIsDead(newTank.isDead);
        setPlayerGuns(newTank.guns);
        setPlayerSelectedGunIndex(newTank.selectedGunIndex);
      }
    };

    connection.db.tank.onInsert(handleTankInsert);
    connection.db.tank.onUpdate(handleTankUpdate);

    return () => {
      connection.db.tank.removeOnInsert(handleTankInsert);
      connection.db.tank.removeOnUpdate(handleTankUpdate);
    };
  }, [worldId]);

  if (!isSpacetimeConnected) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        color: '#ffffff'
      }}>
        Connecting to SpacetimeDB...
      </div>
    );
  }

  if (!worldId) {
    return null;
  }

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
        {!isDead && playerGuns.length > 0 && (
          <GunInventory guns={playerGuns} selectedGunIndex={playerSelectedGunIndex} />
        )}
        <ResultsScreen worldId={worldId} />
      </div>
      <TerminalComponent worldId={worldId} />
    </div>
  );
}

export default App;
