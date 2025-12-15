import { useEffect, useRef } from 'react';
import { getConnection, getPendingJoinCode, clearPendingJoinCode } from '../spacetimedb-connection';
import type { EventContext, SubscriptionHandle } from '../../module_bindings';
import { type Infer } from "spacetimedb";
import { TankRow } from '../../module_bindings';

export function useWorldSwitcher(onWorldChange: (worldId: string) => void) {
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
            if (connection.identity && tank.owner.isEqual(connection.identity)) {
                const pendingJoinCode = getPendingJoinCode();
                if (pendingJoinCode && tank.joinCode === pendingJoinCode) {
                    console.log(`Found tank with joinCode ${pendingJoinCode}, worldId: ${tank.worldId}`);
                    console.log(`Switching to world: ${tank.worldId}`);
                    onWorldChange(tank.worldId);
                    clearPendingJoinCode();
                }
            }
        };

        const handleTankUpdate = (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
            if (connection.identity && newTank.owner.isEqual(connection.identity)) {
                const pendingJoinCode = getPendingJoinCode();
                if (pendingJoinCode && newTank.joinCode === pendingJoinCode) {
                    console.log(`Found tank with joinCode ${pendingJoinCode}, worldId: ${newTank.worldId}`);
                    console.log(`Switching to world: ${newTank.worldId}`);
                    onWorldChange(newTank.worldId);
                    clearPendingJoinCode();
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
    }, [onWorldChange]);
}
