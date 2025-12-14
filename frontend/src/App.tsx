import { useEffect, useState } from 'react';
import MainMenuPage from './pages/MainMenuPage';
import GamePage from './pages/GamePage';
import { connectToSpacetimeDB, getConnection } from './spacetimedb-connection';

function App() {
  const [currentPage, setCurrentPage] = useState<'menu' | 'game'>('menu');
  const [isSpacetimeConnected, setIsSpacetimeConnected] = useState(false);
  const [worldId, setWorldId] = useState<string | null>(null);

  useEffect(() => {
    connectToSpacetimeDB().then((conn) => {
      setIsSpacetimeConnected(true);
      
      const subscription = conn
        .subscriptionBuilder()
        .onError((e) => console.log("Player subscription error", e))
        .subscribe([`SELECT * FROM player WHERE Identity = '${conn.identity}'`]);

      conn.db.player.onInsert((_ctx, player) => {
        if (conn.identity && player.identity.isEqual(conn.identity)) {
          console.log(`Player created with ID ${player.id}, setting homeworld`);
          setWorldId(player.id);
          setCurrentPage('game');
        }
      });

      const existingPlayer = conn.db.player.getIterIdentity().filter(p => 
        conn.identity && p.identity.isEqual(conn.identity)
      );
      for (const player of existingPlayer) {
        console.log(`Existing player found with ID ${player.id}, setting homeworld`);
        setWorldId(player.id);
        setCurrentPage('game');
        break;
      }

      return () => {
        subscription.unsubscribe();
      };
    }).catch((error) => {
      console.error('Failed to establish SpacetimeDB connection:', error);
    });
  }, []);

  const handleWorldReady = (worldId: string) => {
    setWorldId(worldId);
    setCurrentPage('game');
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
    return <MainMenuPage onWorldReady={handleWorldReady} />;
  }

  if (!worldId) {
    return null;
  }

  return <GamePage worldId={worldId} />;
}

export default App;
