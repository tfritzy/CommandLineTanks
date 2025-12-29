import { useEffect, useState, useMemo } from 'react';
import { getConnection } from '../spacetimedb-connection';
import { type Infer } from 'spacetimedb';
import ScoreRow from '../../module_bindings/score_type';
import WorldRow from '../../module_bindings/world_type';
import { type EventContext } from '../../module_bindings';

interface GameHeaderProps {
    worldId: string;
}

export default function GameHeader({ worldId }: GameHeaderProps) {
    const [team0Kills, setTeam0Kills] = useState(0);
    const [team1Kills, setTeam1Kills] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [showCopied, setShowCopied] = useState(false);

    const connection = getConnection();
    const isHomeworld = useMemo(() => {
        if (!connection?.identity) return false;
        const identityString = connection.identity.toHexString().toLowerCase();
        return identityString === worldId;
    }, [connection, worldId]);

    const handleCopyWorldId = () => {
        navigator.clipboard.writeText(worldId)
            .then(() => {
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 2000);
            })
            .catch((error) => {
                console.error('Failed to copy world ID:', error);
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 2000);
            });
    };

    useEffect(() => {
        if (!connection || isHomeworld) return;

        const subscriptionHandle = connection
            .subscriptionBuilder()
            .onError((e) => console.error("Game header subscription error", e))
            .subscribe([
                `SELECT * FROM score WHERE WorldId = '${worldId}'`,
                `SELECT * FROM world WHERE Id = '${worldId}'`
            ]);

        const updateScores = () => {
            const score = connection.db.score.WorldId.find(worldId);
            if (score) {
                setTeam0Kills(score.kills[0] || 0);
                setTeam1Kills(score.kills[1] || 0);
            }
        };

        const updateTimer = () => {
            const world = connection.db.world.Id.find(worldId);
            if (world && world.gameState.tag === 'Playing') {
                setIsVisible(true);
                const currentTime = BigInt(Date.now() * 1000);
                const gameElapsedMicros = Number(currentTime - world.gameStartedAt);
                const gameDurationMicros = Number(world.gameDurationMicros);
                const remainingMicros = Math.max(0, gameDurationMicros - gameElapsedMicros);
                const remainingSeconds = Math.floor(remainingMicros / 1_000_000);
                setTimeRemaining(remainingSeconds);
            } else {
                setIsVisible(false);
            }
        };

        updateScores();
        updateTimer();

        const interval = setInterval(() => {
            updateTimer();
        }, 1000);

        connection.db.score.onUpdate((_ctx: EventContext, _oldScore: Infer<typeof ScoreRow>, newScore: Infer<typeof ScoreRow>) => {
            if (newScore.worldId === worldId) {
                updateScores();
            }
        });

        connection.db.world.onUpdate((_ctx: EventContext, _oldWorld: Infer<typeof WorldRow>, newWorld: Infer<typeof WorldRow>) => {
            if (newWorld.id === worldId) {
                updateTimer();
            }
        });

        connection.db.world.onInsert((_ctx: EventContext, world: Infer<typeof WorldRow>) => {
            if (world.id === worldId) {
                updateTimer();
            }
        });

        return () => {
            clearInterval(interval);
            subscriptionHandle.unsubscribe();
        };
    }, [worldId, connection, isHomeworld]);

    if (!isVisible || timeRemaining === null || isHomeworld) {
        return null;
    }

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1000,
        } as React.CSSProperties}>
            <div style={{
                display: 'flex',
                alignItems: 'stretch',
                height: '26px',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))',
            }}>
                <div style={{
                    backgroundColor: "#813645",
                    padding: '6px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fcfbf3',
                    fontSize: '20px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: '700',
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 8px 100%)',
                    minWidth: '45px',
                }}>
                    {team0Kills}
                </div>
                <div style={{
                    backgroundColor: '#34404f',
                    padding: '6px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#e6eeed',
                    fontSize: '13px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: '600',
                    minWidth: '50px',
                }}>
                    {timeString}
                </div>
                <div style={{
                    backgroundColor: "#3e4c7e",
                    padding: '6px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fcfbf3',
                    fontSize: '20px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: '700',
                    clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                    minWidth: '45px',
                }}>
                    {team1Kills}
                </div>
            </div>
            <button
                onClick={handleCopyWorldId}
                style={{
                    marginTop: '4px',
                    padding: '4px 12px',
                    backgroundColor: '#4f2d4d',
                    border: '1px solid #5a78b2',
                    color: '#96dc7f',
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5b3a56';
                    e.currentTarget.style.borderColor = '#7396d5';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#4f2d4d';
                    e.currentTarget.style.borderColor = '#5a78b2';
                }}
            >
                {showCopied ? '✓ Copied!' : `Share: ${worldId.substring(0, 10)}...`}
            </button>
        </div >
    );
}
