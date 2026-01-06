import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { connectToSpacetimeDB } from "./spacetimedb-connection";
import GameView from "./components/GameView";
import LandingPage from "./components/LandingPage";
import HomeWorldRedirector from "./components/HomeWorldRedirector";

function App() {
  const [isSpacetimeConnected, setIsSpacetimeConnected] = useState(false);

  useEffect(() => {
    connectToSpacetimeDB()
      .then((conn) => {
        setIsSpacetimeConnected(true);

        if (conn.identity) {
          const identityString = conn.identity.toHexString();
          console.log(`Setting homeworld to identity: ${identityString}`);
        }
      })
      .catch((error) => {
        console.error("Failed to establish SpacetimeDB connection:", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/deploy" element={isSpacetimeConnected ? <HomeWorldRedirector /> : <div className="fixed inset-0 bg-[#1a1a24]" />} />
      <Route path="/world/:worldId" element={isSpacetimeConnected ? <GameView /> : <div className="fixed inset-0 bg-[#1a1a24]" />} />
      <Route
        path="*"
        element={<LandingPage />}
      />
    </Routes>
  );
}

export default App;
