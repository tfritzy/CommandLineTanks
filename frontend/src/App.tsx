import { useEffect, useState } from 'react';
import MainMenuPage from './pages/MainMenuPage';
import GamePage from './pages/GamePage';
import { connectToSpacetimeDB } from './spacetimedb-connection';

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
