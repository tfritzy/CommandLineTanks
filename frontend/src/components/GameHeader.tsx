import { useEffect, useState } from 'react';
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

    useEffect(() => {
        const connection = getConnection();
        if (!connection) return;

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
    }, [worldId]);

    if (!isVisible || timeRemaining === null) {
        return null;
    }

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 40px',
            zIndex: 1000,
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '24px',
            fontWeight: 'bold',
            borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
        }}>
            <div style={{
                color: '#ff6666',
                textShadow: '0 0 10px #ff6666'
            }}>
                Team Red: {team0Kills}
            </div>
            <div style={{
                color: '#ffffff',
                fontSize: '28px',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
            }}>
                {timeString}
            </div>
            <div style={{
                color: '#6666ff',
                textShadow: '0 0 10px #6666ff'
            }}>
                Team Blue: {team1Kills}
            </div>
        </div>
    );
}
