import { useEffect, useRef } from 'react';
import { getConnection, getPendingJoinCode, clearPendingJoinCode, isCurrentIdentity } from '../spacetimedb-connection';
import type { EventContext, SubscriptionHandle } from '../../module_bindings';
import { type Infer } from "spacetimedb";
import TankRow from '../../module_bindings/tank_type';

export function useGameSwitcher(onWorldChange: (gameId: string) => void, currentWorldId: string | null) {
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
                    onWorldChange(tank.gameId);
                    clearPendingJoinCode();
                }
                else if (currentWorldId && tank.joinCode === currentWorldId && tank.gameId !== currentWorldId) {
                    console.log(`Game reset detected: tank has joinCode ${tank.joinCode} matching current game, but is in new game ${tank.gameId}`);
                    console.log(`Switching to new game: ${tank.gameId}`);
                    onWorldChange(tank.gameId);
                }
            }
        };

        const handleTankUpdate = (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
            if (isCurrentIdentity(newTank.owner)) {
                const pendingJoinCode = getPendingJoinCode();
                if (pendingJoinCode && newTank.joinCode === pendingJoinCode) {
                    console.log(`Found tank with joinCode ${pendingJoinCode}, gameId: ${newTank.gameId}`);
                    console.log(`Switching to game: ${newTank.gameId}`);
                    onWorldChange(newTank.gameId);
                    clearPendingJoinCode();
                }
                else if (currentWorldId && newTank.joinCode === currentWorldId && newTank.gameId !== currentWorldId) {
                    console.log(`Game reset detected: tank has joinCode ${newTank.joinCode} matching current game, but is in new game ${newTank.gameId}`);
                    console.log(`Switching to new game: ${newTank.gameId}`);
                    onWorldChange(newTank.gameId);
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
    }, [onWorldChange, currentWorldId]);
}
