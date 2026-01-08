import { useEffect, useRef } from 'react';
import { getConnection, getPendingJoinCode, clearPendingJoinCode, isCurrentIdentity } from '../spacetimedb-connection';
import type { EventContext, SubscriptionHandle } from '../../module_bindings';
import { type Infer } from "spacetimedb";
import TankMetadataRow from '../../module_bindings/tank_metadata_type';

export function useWorldSwitcher(onWorldChange: (worldId: string) => void, currentWorldId: string | null) {
    const subscriptionHandleRef = useRef<SubscriptionHandle | null>(null);

    useEffect(() => {
        const connection = getConnection();
        if (!connection) return;

        const subscription = connection
            .subscriptionBuilder()
            .onError((e) => console.log("Tank metadata subscription error", e))
            .subscribe([`SELECT * FROM tank_metadata WHERE Owner = '${connection.identity}'`]);

        subscriptionHandleRef.current = subscription;

        const handleMetadataInsert = (_ctx: EventContext, metadata: Infer<typeof TankMetadataRow>) => {
            if (isCurrentIdentity(metadata.owner)) {
                const pendingJoinCode = getPendingJoinCode();
                if (pendingJoinCode && metadata.joinCode === pendingJoinCode) {
                    console.log(`Found tank with joinCode ${pendingJoinCode}, worldId: ${metadata.worldId}`);
                    console.log(`Switching to world: ${metadata.worldId}`);
                    onWorldChange(metadata.worldId);
                    clearPendingJoinCode();
                }
                else if (currentWorldId && metadata.joinCode === currentWorldId && metadata.worldId !== currentWorldId) {
                    console.log(`World reset detected: tank has joinCode ${metadata.joinCode} matching current world, but is in new world ${metadata.worldId}`);
                    console.log(`Switching to new world: ${metadata.worldId}`);
                    onWorldChange(metadata.worldId);
                }
            }
        };

        const handleMetadataUpdate = (_ctx: EventContext, _oldMetadata: Infer<typeof TankMetadataRow>, newMetadata: Infer<typeof TankMetadataRow>) => {
            if (isCurrentIdentity(newMetadata.owner)) {
                const pendingJoinCode = getPendingJoinCode();
                if (pendingJoinCode && newMetadata.joinCode === pendingJoinCode) {
                    console.log(`Found tank with joinCode ${pendingJoinCode}, worldId: ${newMetadata.worldId}`);
                    console.log(`Switching to world: ${newMetadata.worldId}`);
                    onWorldChange(newMetadata.worldId);
                    clearPendingJoinCode();
                }
                else if (currentWorldId && newMetadata.joinCode === currentWorldId && newMetadata.worldId !== currentWorldId) {
                    console.log(`World reset detected: tank has joinCode ${newMetadata.joinCode} matching current world, but is in new world ${newMetadata.worldId}`);
                    console.log(`Switching to new world: ${newMetadata.worldId}`);
                    onWorldChange(newMetadata.worldId);
                }
            }
        };

        connection.db.tankMetadata.onInsert(handleMetadataInsert);
        connection.db.tankMetadata.onUpdate(handleMetadataUpdate);

        return () => {
            if (subscriptionHandleRef.current) {
                subscriptionHandleRef.current.unsubscribe();
            }
            connection.db.tankMetadata.removeOnInsert(handleMetadataInsert);
            connection.db.tankMetadata.removeOnUpdate(handleMetadataUpdate);
        };
    }, [onWorldChange, currentWorldId]);
}
