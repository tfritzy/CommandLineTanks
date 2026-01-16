import { useEffect, useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { connectToSpacetimeDB, onDisconnect } from "./spacetimedb-connection";
import GameView from "./components/GameView";
import TutorialRedirector from "./components/TutorialRedirector";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

const LoadingView = () => (
  <div className="fixed inset-0 bg-[#1a1a24] flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-4 border-[#707b89] border-t-[#fcfbf3] rounded-full animate-spin mb-4"></div>
    <span className="text-[#fcfbf3] font-medium uppercase tracking-widest text-sm">Connecting</span>
  </div>
);

function App() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);

  const connect = useCallback(() => {
    setStatus("connecting");
    connectToSpacetimeDB()
      .then((conn) => {
        setStatus("connected");
        setHasConnectedOnce(true);

        if (conn.identity) {
          const identityString = conn.identity.toHexString();
          console.log(`Setting homegame to identity: ${identityString}`);
        }
      })
      .catch((error) => {
        console.error("Failed to establish SpacetimeDB connection:", error);
        setStatus("disconnected");
      });
  }, []);

  useEffect(() => {
    connect();

    onDisconnect(() => {
      setStatus("disconnected");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "disconnected") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") {
        connect();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, connect]);

  if (status === "disconnected") {
    const title = hasConnectedOnce ? "Connection Lost" : "Connection Failed";
    const message = hasConnectedOnce 
      ? "The connection to the server was interrupted." 
      : "Could not establish initial connection to the server.";

    return (
      <div className="fixed inset-0 bg-[#2e2e43] flex flex-col items-center justify-center text-[#fcfbf3] z-50">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="mb-8 text-[#707b89]">{message}</p>
        <button
          onClick={connect}
          className="px-6 py-3 bg-[#9d4343] hover:bg-[#813645] transition-colors rounded font-bold uppercase tracking-wider text-[#fcfbf3]"
        >
          {hasConnectedOnce ? "Reconnect (R)" : "Try Again (R)"}
        </button>
      </div>
    );
  }

  if (status === "connecting") {
    return <LoadingView />;
  }

  return (
    <Routes>
      <Route path="/deploy" element={<TutorialRedirector />} />
      <Route path="/tutorial/:gameId" element={<GameView />} />
      <Route path="/game/:gameId" element={<GameView />} />
    </Routes>
  );
}

export default App;
