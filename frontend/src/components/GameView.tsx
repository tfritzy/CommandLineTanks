import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Game } from '../game';
import TerminalComponent from './terminal/Terminal';
import ResultsScreen from './ResultsScreen';
import GameHeader from './GameHeader';
import JoinWorldModal from './JoinWorldModal';
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

  if (!worldId) {
    return null;
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
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#2a152d',
            padding: '40px 60px',
            textAlign: 'center',
            color: '#e6eeed',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '24px',
            fontWeight: 'bold',
            border: '4px solid #813645',
            zIndex: 1000
          }}>
            <div style={{ fontSize: '36px', marginBottom: '20px', color: '#e39764' }}>
              YOU DIED
            </div>
            <div style={{ fontSize: '18px', color: '#a9bcbf', marginBottom: '30px' }}>
              Call the respawn command to respawn
            </div>
            <div style={{ fontSize: '16px', color: '#a9bcbf', marginBottom: '10px' }}>
              Invite friends to join this world:
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{
                flex: 1,
                fontSize: '14px',
                color: '#fcfbf3',
                background: '#4a4b5b',
                padding: '12px 16px',
                borderRadius: '4px',
                fontFamily: "'JetBrains Mono', monospace",
                userSelect: 'all',
                cursor: 'text',
                wordBreak: 'break-all'
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
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 'bold',
                  color: '#fcfbf3',
                  background: copied ? '#3c6c54' : (isHovering ? '#7396d5' : '#5a78b2'),
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
        <ResultsScreen worldId={worldId} />
      </div>
      <TerminalComponent worldId={worldId} />
    </div>
  );
}
