import { useEffect, useState } from 'react';
import MainMenuPage from './pages/MainMenuPage';
import GamePage from './pages/GamePage';
import { connectToSpacetimeDB, getConnection } from './spacetimedb-connection';

function App() {
  const [currentPage, setCurrentPage] = useState<'menu' | 'game'>('menu');
  const [isSpacetimeConnected, setIsSpacetimeConnected] = useState(false);
  const [worldId, setWorldId] = useState<string | null>(null);

  useEffect(() => {
    connectToSpacetimeDB().then(() => {
      setIsSpacetimeConnected(true);
    }).catch((error) => {
      console.error('Failed to establish SpacetimeDB connection:', error);
    });
  }, []);

  const handleJoinWorld = (joinCode: string) => {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("Tank subscription error", e))
      .subscribe([`SELECT * FROM tank WHERE owner = Sender`]);

    connection.db.tank.onInsert((_ctx, tank) => {
      if (connection.identity && tank.owner.isEqual(connection.identity)) {
        if (tank.joinCode === joinCode) {
          console.log(`Found tank with joinCode ${joinCode}, worldId: ${tank.worldId}`);
          setWorldId(tank.worldId);
          setCurrentPage('game');
        }
      }
    });

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

  if (!worldId) {
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
        Loading world...
      </div>
    );
  }

  return <GamePage worldId={worldId} />;
}

export default App;
