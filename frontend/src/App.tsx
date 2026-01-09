import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { connectToSpacetimeDB } from "./spacetimedb-connection";
import { initAllSvgSheets } from "./svg";
import GameView from "./components/GameView";
import HomeWorldRedirector from "./components/HomeWorldRedirector";

function App() {
  const [isSpacetimeConnected, setIsSpacetimeConnected] = useState(false);

  useEffect(() => {
    initAllSvgSheets().catch((error) => {
      console.error("Failed to initialize SVG assets:", error);
    });

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
      <Route path="/deploy" element={isSpacetimeConnected ? <HomeWorldRedirector /> : <div className="fixed inset-0 bg-[#1a1a24]" />} />
      <Route path="/world/:worldId" element={isSpacetimeConnected ? <GameView /> : <div className="fixed inset-0 bg-[#1a1a24]" />} />
    </Routes>
  );
}

export default App;
