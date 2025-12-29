import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Game } from '../game';
import TerminalComponent from './terminal/Terminal';
import ResultsScreen from './ResultsScreen';
import GameHeader from './GameHeader';
import JoinWorldModal from './JoinWorldModal';
import WorldNotFound from './WorldNotFound';
import { getConnection } from '../spacetimedb-connection';
import { useWorldSwitcher } from '../hooks/useWorldSwitcher';
import { type Infer } from 'spacetimedb';
import TankRow from '../../module_bindings/tank_type';
import { type EventContext } from '../../module_bindings';

export default function GameView() {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [isDead, setIsDead] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [worldNotFound, setWorldNotFound] = useState(false);

  const handleWorldChange = (newWorldId: string) => {
    if (newWorldId !== worldId) {
      console.log("Switch to", newWorldId);
      navigate(`/world/${newWorldId}`);
    }
  };

  useWorldSwitcher(handleWorldChange, worldId || null);

  useEffect(() => {
    if (!canvasRef.current || !worldId) return;

    gameRef.current?.destroy();
    gameRef.current = new Game(canvasRef.current, worldId);
    gameRef.current.start();

    return () => {
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [worldId]);

  useEffect(() => {
    if (!worldId) return;

    const connection = getConnection();
    if (!connection) return;

    let hasReceivedTankData = false;

    const checkForTank = () => {
      for (const tank of connection.db.tank.iter()) {
        if (connection.identity && tank.owner.isEqual(connection.identity) && tank.worldId === worldId) {
          hasReceivedTankData = true;
          setShowJoinModal(false);
          setIsDead(tank.health <= 0);
          return true;
        }
      }
      return false;
    };

    const handleTankInsert = (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
      if (connection.identity && tank.owner.isEqual(connection.identity) && tank.worldId === worldId) {
        hasReceivedTankData = true;
        setShowJoinModal(false);
        setIsDead(tank.health <= 0);
      }
    };

    const handleTankUpdate = (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
      if (connection.identity && newTank.owner.isEqual(connection.identity) && newTank.worldId === worldId) {
        setIsDead(newTank.health <= 0);
      }
    };

    const handleTankDelete = (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
      if (connection.identity && tank.owner.isEqual(connection.identity) && tank.worldId === worldId) {
        setShowJoinModal(true);
      }
    };

    connection.db.tank.onInsert(handleTankInsert);
    connection.db.tank.onUpdate(handleTankUpdate);
    connection.db.tank.onDelete(handleTankDelete);

    checkForTank();

    const checkTimeout = setTimeout(() => {
      if (!hasReceivedTankData) {
        if (!checkForTank()) {
          setShowJoinModal(true);
        }
      }
    }, 500);

    return () => {
      clearTimeout(checkTimeout);
      connection.db.tank.removeOnInsert(handleTankInsert);
      connection.db.tank.removeOnUpdate(handleTankUpdate);
      connection.db.tank.removeOnDelete(handleTankDelete);
    };
  }, [worldId]);

  useEffect(() => {
    if (!worldId) return;

    const connection = getConnection();
    if (!connection) return;

    const checkWorldExists = () => {
      const world = connection.db.world.Id.find(worldId);
      return world !== undefined;
    };

    const worldCheckTimeout = setTimeout(() => {
      const exists = checkWorldExists();
      setWorldNotFound(!exists);
    }, 1500);

    return () => {
      clearTimeout(worldCheckTimeout);
    };
  }, [worldId]);

  if (!worldId) {
    return null;
  }

  if (worldNotFound) {
    return <WorldNotFound worldId={worldId} />;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <GameHeader worldId={worldId} />
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            margin: 0,
            padding: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#2e2e43',
          }}
        />
        {showJoinModal && (
          <JoinWorldModal worldId={worldId} onJoin={() => setShowJoinModal(false)} />
        )}
        {!showJoinModal && isDead && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at center, rgba(192, 104, 82, 0.15) 0%, rgba(46, 46, 67, 0.85) 60%)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'JetBrains Mono', monospace",
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out 1s both'
          }}>
            <style>{`
              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `}</style>
            
            <div style={{
              fontSize: '120px',
              fontWeight: 900,
              color: '#c06852',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '40px',
              textShadow: '0 4px 20px rgba(192, 104, 82, 0.5), 0 0 60px rgba(192, 104, 82, 0.3)',
              lineHeight: 1
            }}>
              ELIMINATED
            </div>

            <div style={{
              fontSize: '20px',
              color: '#e6eeed',
              marginBottom: '8px',
              letterSpacing: '0.05em',
              fontWeight: 300
            }}>
              Type <span style={{ 
                color: '#fceba8', 
                fontWeight: 500,
                padding: '2px 8px',
                background: 'rgba(252, 235, 168, 0.1)',
                borderRadius: '2px'
              }}>respawn</span> to rejoin the battle
            </div>

            <div style={{
              position: 'absolute',
              bottom: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '600px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#707b89',
                marginBottom: '12px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                Share World
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'stretch'
              }}>
                <div style={{
                  flex: 1,
                  fontSize: '13px',
                  color: '#a9bcbf',
                  background: 'rgba(74, 75, 91, 0.5)',
                  padding: '10px 14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  userSelect: 'all',
                  cursor: 'text',
                  wordBreak: 'break-all',
                  border: '1px solid rgba(112, 123, 137, 0.3)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {window.location.origin}/world/{encodeURIComponent(worldId)}
                </div>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/world/${encodeURIComponent(worldId)}`;
                    navigator.clipboard.writeText(url)
                      .then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      })
                      .catch(() => {
                        setCopied(false);
                      });
                  }}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  style={{
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 500,
                    color: '#fcfbf3',
                    background: copied ? '#4e9363' : (isHovering ? '#5c8995' : '#405967'),
                    border: '1px solid rgba(112, 123, 137, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.05em'
                  }}
                >
                  {copied ? '✓ COPIED' : 'COPY'}
                </button>
              </div>
            </div>
          </div>
        )}
        <ResultsScreen worldId={worldId} />
      </div>
      <TerminalComponent worldId={worldId} />
    </div>
  );
}
