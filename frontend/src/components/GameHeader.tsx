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
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'stretch',
            zIndex: 1000,
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '800',
            height: '28px',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))',
        } as React.CSSProperties}>
            <div style={{
                backgroundColor: "#813645",
                padding: '5px 16px 5px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitTextStroke: '1.5px #000',
                WebkitTextFillColor: '#fcfbf3',
                fontSize: '18px',
                clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                minWidth: '40px',
                marginRight: '-5px',
                zIndex: 1,
            }}>
                {team0Kills}
            </div>
            <div style={{
                backgroundColor: '#34404f',
                padding: '5px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitTextStroke: '1.5px #000',
                WebkitTextFillColor: '#e6eeed',
                fontSize: '16px',
                clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 100%, 0 100%)',
                minWidth: '65px',
                marginRight: '-5px',
                zIndex: 2,
            }}>
                {timeString}
            </div>
            <div style={{
                backgroundColor: "#3e4c7e",
                padding: '5px 8px 5px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitTextStroke: '1.5px #000',
                WebkitTextFillColor: '#fcfbf3',
                fontSize: '18px',
                clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%)',
                minWidth: '40px',
                zIndex: 1,
            }}>
                {team1Kills}
            </div>
        </div >
    );
}
