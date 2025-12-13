import { useEffect, useState, useRef } from 'react';
import MainMenuPage from './pages/MainMenuPage';
import GamePage from './pages/GamePage';
import { connectToSpacetimeDB, getConnection } from './spacetimedb-connection';
import type { SubscriptionHandle } from '../module_bindings';

function App() {
  const [currentPage, setCurrentPage] = useState<'menu' | 'game'>('menu');
  const [isSpacetimeConnected, setIsSpacetimeConnected] = useState(false);
  const [worldId, setWorldId] = useState<string | null>(null);
  const subscriptionHandleRef = useRef<SubscriptionHandle | null>(null);
  const pendingJoinCodeRef = useRef<string | null>(null);

  useEffect(() => {
    connectToSpacetimeDB().then(() => {
      setIsSpacetimeConnected(true);
    }).catch((error) => {
      console.error('Failed to establish SpacetimeDB connection:', error);
    });
  }, []);

  useEffect(() => {
    if (!isSpacetimeConnected) return;

    const connection = getConnection();
    if (!connection) return;

    const subscription = connection
      .subscriptionBuilder()
      .onError((e) => console.log("Tank subscription error", e))
      .subscribe([`SELECT * FROM tank WHERE owner = Sender`]);

    subscriptionHandleRef.current = subscription;

    connection.db.tank.onInsert((_ctx, tank) => {
      if (connection.identity && tank.owner.isEqual(connection.identity)) {
        if (pendingJoinCodeRef.current && tank.joinCode === pendingJoinCodeRef.current) {
          console.log(`Found tank with joinCode ${pendingJoinCodeRef.current}, worldId: ${tank.worldId}`);
          setWorldId(tank.worldId);
          setCurrentPage('game');
          pendingJoinCodeRef.current = null;
        }
      }
    });

    return () => {
      if (subscriptionHandleRef.current) {
        subscriptionHandleRef.current.unsubscribe();
      }
    };
  }, [isSpacetimeConnected]);

  const handleJoinWorld = (joinCode: string) => {
    const connection = getConnection();
    if (!connection) return;

    pendingJoinCodeRef.current = joinCode;
    connection.reducers.findWorld({ joinCode });
  };

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

  if (currentPage === 'menu') {
    return <MainMenuPage onJoinWorld={handleJoinWorld} />;
  }

  return <GamePage worldId={worldId || ''} />;
}

export default App;
