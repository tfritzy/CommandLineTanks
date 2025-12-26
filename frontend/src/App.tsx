import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { connectToSpacetimeDB } from './spacetimedb-connection';
import GameView from './components/GameView';

function App() {
  const [isSpacetimeConnected, setIsSpacetimeConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    connectToSpacetimeDB().then((conn) => {
      setIsSpacetimeConnected(true);

      if (conn.identity) {
        const identityString = conn.identity.toHexString();
        console.log(`Setting homeworld to identity: ${identityString}`);
        navigate(`/world/${identityString}`);
      }
    }).catch((error) => {
      console.error('Failed to establish SpacetimeDB connection:', error);
    });
  }, [navigate]);

  if (!isSpacetimeConnected) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2e2e43',
        color: '#ffffff'
      }}>
        Connecting to SpacetimeDB...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/world/:worldId" element={<GameView />} />
      <Route path="/" element={
        <div style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#2e2e43',
          color: '#ffffff'
        }}>
          Loading world...
        </div>
      } />
    </Routes>
  );
}

export default App;
