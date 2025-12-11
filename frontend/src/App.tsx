import { useEffect, useState } from 'react';
import MainMenuPage from './pages/MainMenuPage';
import GamePage from './pages/GamePage';
import { connectToSpacetimeDB, getConnection } from './spacetimedb-connection';

function App() {
  const [currentPage, setCurrentPage] = useState<'menu' | 'game'>('menu');
  const [isSpacetimeConnected, setIsSpacetimeConnected] = useState(false);

  useEffect(() => {
    connectToSpacetimeDB().then(() => {
      setIsSpacetimeConnected(true);
    }).catch((error) => {
      console.error('Failed to establish SpacetimeDB connection:', error);
    });
  }, []);

  const handleJoinWorld = () => {
    getConnection()?.reducers.findWorld({});
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
    return <MainMenuPage onJoinWorld={handleJoinWorld} />;
  }

  return <GamePage />;
}

export default App;
