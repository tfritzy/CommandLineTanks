import { useEffect, useState } from 'react';
import { getConnection } from '../spacetimedb-connection';
import { type Infer } from 'spacetimedb';
import TankRow from '../../module_bindings/tank_type';
import { type EventContext } from '../../module_bindings';

interface SmokescreenHudProps {
    worldId: string;
}

export default function SmokescreenHud({ worldId }: SmokescreenHudProps) {
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [isReady, setIsReady] = useState(true);

    useEffect(() => {
        const connection = getConnection();
        if (!connection) return;

        const subscriptionHandle = connection
            .subscriptionBuilder()
            .onError((e) => console.error("Smokescreen HUD subscription error", e))
            .subscribe([
                `SELECT * FROM tank WHERE WorldId = '${worldId}'`
            ]);

        const updateCooldown = () => {
            if (!connection.identity) return;

            const allTanks = Array.from(connection.db.tank.iter()).filter(t => t.worldId === worldId);
            const myTank = allTanks.find(t => t.owner.isEqual(connection.identity!));

            if (!myTank) return;

            const currentTime = BigInt(Date.now() * 1000);
            const cooldownEnd = myTank.smokescreenCooldownEnd;

            if (cooldownEnd > currentTime) {
                const remaining = Number(cooldownEnd - currentTime) / 1_000_000;
                setCooldownRemaining(remaining);
                setIsReady(false);
            } else {
                setCooldownRemaining(0);
                setIsReady(true);
            }
        };

        updateCooldown();

        const interval = setInterval(() => {
            updateCooldown();
        }, 100);

        connection.db.tank.onUpdate((_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
            if (connection.identity && newTank.owner.isEqual(connection.identity!) && newTank.worldId === worldId) {
                updateCooldown();
            }
        });

        connection.db.tank.onInsert((_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (connection.identity && tank.owner.isEqual(connection.identity!) && tank.worldId === worldId) {
                updateCooldown();
            }
        });

        return () => {
            clearInterval(interval);
            subscriptionHandle.unsubscribe();
        };
    }, [worldId]);

    const progress = isReady ? 1 : Math.max(0, 1 - (cooldownRemaining / 60));
    const cooldownText = isReady ? 'READY' : `${Math.ceil(cooldownRemaining)}s`;

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1000,
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '700',
        } as React.CSSProperties}>
            <div style={{
                backgroundColor: '#34404f',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '2px solid #4a4b5b',
                position: 'relative',
                overflow: 'hidden',
                minWidth: '120px',
                textAlign: 'center',
            }}>
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${progress * 100}%`,
                    backgroundColor: isReady ? '#5a78b2' : '#707b89',
                    transition: 'width 0.1s linear',
                    opacity: 0.3,
                }} />
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    WebkitTextStroke: '1px #000',
                    WebkitTextFillColor: isReady ? '#aaeeea' : '#a9bcbf',
                    fontSize: '14px',
                    letterSpacing: '0.5px',
                }}>
                    🌫️ {cooldownText}
                </div>
            </div>
        </div>
    );
}
