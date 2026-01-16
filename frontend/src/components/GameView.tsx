import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Game as GameEngine } from "../game";
import TerminalComponent from "./terminal/Terminal";
import ResultsScreen from "./ResultsScreen";
import GameHeader from "./GameHeader";
import ScoreBoard from "./ScoreBoard";
import { JoinGameModal } from "./JoinGameModal";
import GameNotFound from "./GameNotFound";
import EliminatedModal from "./EliminatedModal";
import HomegameOverlay from "./HomegameOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { getConnection, getIdentityHex, isCurrentIdentity, areIdentitiesEqual, setPendingJoinCode } from "../spacetimedb-connection";
import { useGameSwitcher } from "../hooks/useGameSwitcher";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import { Game } from "../../module_bindings";
import {
  type EventContext,
  type SubscriptionHandle,
} from "../../module_bindings";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";
import { useJoinModalStatus } from "../hooks/useJoinModalStatus";

export default function GameView() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const subscriptionRef = useRef<SubscriptionHandle | null>(null);
  const tankSubscriptionRef = useRef<TableSubscription<typeof TankRow> | null>(null);
  const gameCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDead, setIsDead] = useState(false);
  const [killerName, setKillerName] = useState<string | null>(null);
  const [gameNotFound, setGameNotFound] = useState(false);

  const myIdentity = getIdentityHex();
  const isHomegame = myIdentity && gameId?.toLowerCase() === myIdentity.toLowerCase();

  const joinModalStatus = useJoinModalStatus(gameId);
  const showJoinModal = joinModalStatus === "no_tank";

  const handleGameChange = (newGameId: string) => {
    if (newGameId !== gameId) {
      console.log("Switch to", newGameId);
      navigate(`/game/${newGameId}`);
    }
  };

  useGameSwitcher(handleGameChange, gameId || null);

  useEffect(() => {
    if (!gameId) return;

    const connection = getConnection();
    if (!connection) return;

    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = connection
      .subscriptionBuilder()
      .onError((e) => console.error("Subscription error", e))
      .subscribe([
        `SELECT * FROM tank WHERE GameId = '${gameId}'`,
        `SELECT * FROM tank_path WHERE GameId = '${gameId}'`,
        `SELECT * FROM tank_transform WHERE GameId = '${gameId}'`,
        `SELECT * FROM projectile WHERE GameId = '${gameId}'`,
        `SELECT * FROM projectile_transform WHERE GameId = '${gameId}'`,
        `SELECT * FROM pickup WHERE GameId = '${gameId}'`,
        `SELECT * FROM kills WHERE GameId = '${gameId}'`,
        `SELECT * FROM tank_fire_state WHERE GameId = '${gameId}'`,
        `SELECT * FROM terrain_detail WHERE GameId = '${gameId}'`,
        `SELECT * FROM game WHERE Id = '${gameId}'`,
        `SELECT * FROM score WHERE GameId = '${gameId}'`,
        `SELECT * FROM tank_gun WHERE GameId = '${gameId}'`,
        `SELECT * FROM player WHERE Identity = '${connection.identity}'`,
      ]);

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [gameId]);

  useEffect(() => {
    if (!canvasRef.current || !gameId) return;

    gameRef.current?.destroy();
    gameRef.current = new GameEngine(canvasRef.current, gameId);
    gameRef.current.start();

    return () => {
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;

    const connection = getConnection();
    if (!connection) return;

    let playerTankId: string | null = null;

    const checkForTank = () => {
      for (const tank of connection.db.tank.iter()) {
        if (
          isCurrentIdentity(tank.owner) &&
          tank.gameId === gameId
        ) {
          playerTankId = tank.id;
          setIsDead(tank.health <= 0);
          return true;
        }
      }
      return false;
    };

    tankSubscriptionRef.current = subscribeToTable({
      table: connection.db.tank,
      handlers: {
        onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (tank.gameId !== gameId) return;

          if (isCurrentIdentity(tank.owner)) {
            playerTankId = tank.id;
            setIsDead(tank.health <= 0);
          }
        },
        onUpdate: (_ctx: EventContext, oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
          if (newTank.gameId !== gameId) return;
          if (playerTankId !== newTank.id) return;

          const wasDead = oldTank.health <= 0;
          const isNowDead = newTank.health <= 0;

          if (!wasDead && isNowDead && newTank.lastDamagedBy) {
            let killerNameFound: string | null = null;

            for (const t of connection.db.tank.iter()) {
              if (t.gameId === gameId && areIdentitiesEqual(t.owner, newTank.lastDamagedBy)) {
                killerNameFound = t.name;
                break;
              }
            }

            if (!killerNameFound) {
              for (const player of connection.db.player.iter()) {
                if (areIdentitiesEqual(player.identity, newTank.lastDamagedBy)) {
                  killerNameFound = player.name ?? null;
                  break;
                }
              }
            }

            setKillerName(killerNameFound);
          } else if (!isNowDead) {
            setKillerName(null);
          }

          setIsDead(isNowDead);
        },
        onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
          if (
            isCurrentIdentity(tank.owner) &&
            tank.gameId === gameId
          ) {
            setIsDead(false);
            playerTankId = null;
          }
        }
      }
    });

    checkForTank();

    return () => {
      if (tankSubscriptionRef.current) {
        tankSubscriptionRef.current.unsubscribe();
        tankSubscriptionRef.current = null;
      }
    };
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;

    const connection = getConnection();
    if (!connection) return;

    setGameNotFound(false);

    const check = () => {
      const game = connection.db.game.Id.find(gameId);
      if (game) {
        setGameNotFound(false);
      } else {
        setGameNotFound(true);
      }
    };

    gameCheckTimeoutRef.current = setTimeout(check, 1500);

    const handleGameInsert = (_ctx: EventContext, game: Infer<typeof Game>) => {
      if (game.id === gameId) {
        setGameNotFound(false);
      }
    };

    connection.db.game.onInsert(handleGameInsert);

    return () => {
      if (gameCheckTimeoutRef.current) {
        clearTimeout(gameCheckTimeoutRef.current);
      }
      if (connection) {
        connection.db.game.removeOnInsert(handleGameInsert);
      }
    };
  }, [gameId]);

  useEffect(() => {
    if (!gameId || !isHomegame) return;

    const connection = getConnection();
    if (!connection) return;

    const joinCode = `ensure_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setPendingJoinCode(joinCode);
    
    connection.reducers.ensureHomegame({ gameId, joinCode });
    console.log(`Called ensureHomegame for gameId: ${gameId}`);
  }, [gameId, isHomegame]);

  if (!gameId) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen w-screen m-0 p-0 overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        <GameHeader gameId={gameId} />
        <ScoreBoard gameId={gameId} />
        {isHomegame && <HomegameOverlay />}
        <canvas
          ref={canvasRef}
          className="block m-0 p-0 w-full h-full bg-palette-ground-dark"
        />
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'radial-gradient(circle, transparent 50%, rgba(42, 21, 45, 0.2) 100%)'
          }}
        />
        <AnimatePresence>
          {showJoinModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <JoinGameModal
                gameId={gameId}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!showJoinModal && isDead && (
            <EliminatedModal killerName={killerName} gameId={gameId} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {gameNotFound && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[2000]"
            >
              <GameNotFound gameId={gameId} />
            </motion.div>
          )}
        </AnimatePresence>
        <ResultsScreen gameId={gameId} />
      </div>
      <TerminalComponent gameId={gameId} />
    </div>
  );
}