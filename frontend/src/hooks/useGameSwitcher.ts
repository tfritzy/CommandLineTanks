import { useEffect, useRef } from 'react';
import { getConnection, getPendingJoinCode, clearPendingJoinCode, isCurrentIdentity } from '../spacetimedb-connection';
import type { EventContext, SubscriptionHandle } from '../../module_bindings';
import { type Infer } from "spacetimedb";
import TankRow from '../../module_bindings/tank_type';

export function useGameSwitcher(onGameChange: (gameId: string) => void, currentGameId: string | null) {
    const subscriptionHandleRef = useRef<SubscriptionHandle | null>(null);

    useEffect(() => {
        const connection = getConnection();
        if (!connection) return;

        const subscription = connection
            .subscriptionBuilder()
            .onError((e) => console.log("Tank subscription error", e))
            .subscribe([`SELECT * FROM tank WHERE Owner = '${connection.identity}'`]);

        subscriptionHandleRef.current = subscription;

        const handleTankInsert = (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (isCurrentIdentity(tank.owner)) {
                const pendingJoinCode = getPendingJoinCode();
                if (pendingJoinCode && tank.joinCode === pendingJoinCode) {
                    console.log(`Found tank with joinCode ${pendingJoinCode}, gameId: ${tank.gameId}`);
                    console.log(`Switching to game: ${tank.gameId}`);
                    onGameChange(tank.gameId);
                    clearPendingJoinCode();
                }
                else if (currentGameId && tank.joinCode === currentGameId && tank.gameId !== currentGameId) {
                    console.log(`Game reset detected: tank has joinCode ${tank.joinCode} matching current game, but is in new game ${tank.gameId}`);
                    console.log(`Switching to new game: ${tank.gameId}`);
                    onGameChange(tank.gameId);
                }
            }
        };

        const handleTankUpdate = (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
            if (isCurrentIdentity(newTank.owner)) {
                const pendingJoinCode = getPendingJoinCode();
                if (pendingJoinCode && newTank.joinCode === pendingJoinCode) {
                    console.log(`Found tank with joinCode ${pendingJoinCode}, gameId: ${newTank.gameId}`);
                    console.log(`Switching to game: ${newTank.gameId}`);
                    onGameChange(newTank.gameId);
                    clearPendingJoinCode();
                }
                else if (currentGameId && newTank.joinCode === currentGameId && newTank.gameId !== currentGameId) {
                    console.log(`Game reset detected: tank has joinCode ${newTank.joinCode} matching current game, but is in new game ${newTank.gameId}`);
                    console.log(`Switching to new game: ${newTank.gameId}`);
                    onGameChange(newTank.gameId);
                }
            }
        };

        connection.db.tank.onInsert(handleTankInsert);
        connection.db.tank.onUpdate(handleTankUpdate);

        return () => {
            if (subscriptionHandleRef.current) {
                subscriptionHandleRef.current.unsubscribe();
            }
            connection.db.tank.removeOnInsert(handleTankInsert);
            connection.db.tank.removeOnUpdate(handleTankUpdate);
        };
    }, [onGameChange, currentGameId]);
}
