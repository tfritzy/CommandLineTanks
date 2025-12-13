import { useState, useEffect, useRef } from 'react';
import { getConnection } from '../spacetimedb-connection';
import type { SubscriptionHandle } from '../../module_bindings';

interface MainMenuPageProps {
    onWorldReady: (worldId: string) => void;
}

export default function MainMenuPage({ onWorldReady }: MainMenuPageProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const subscriptionHandleRef = useRef<SubscriptionHandle | null>(null);
    const pendingJoinCodeRef = useRef<string | null>(null);

    useEffect(() => {
        const connection = getConnection();
        console.log("Connection", connection);
        if (!connection) return;

        const subscription = connection
            .subscriptionBuilder()
            .onError((e) => console.log("Tank subscription error", e))
            .subscribe([`SELECT * FROM tank WHERE Owner = '${connection.identity}'`]);

        subscriptionHandleRef.current = subscription;

        const handleTankInsert = (_ctx: any, tank: any) => {
            if (connection.identity && tank.owner.isEqual(connection.identity)) {
                if (pendingJoinCodeRef.current && tank.joinCode === pendingJoinCodeRef.current) {
                    console.log(`Found tank with joinCode ${pendingJoinCodeRef.current}, worldId: ${tank.worldId}`);
                    onWorldReady(tank.worldId);
                    pendingJoinCodeRef.current = null;
                }
            }
        };

        connection.db.tank.onInsert(handleTankInsert);

        return () => {
            if (subscriptionHandleRef.current) {
                subscriptionHandleRef.current.unsubscribe();
            }
            connection.db.tank.removeOnInsert(handleTankInsert);
        };
    }, [onWorldReady]);

    const handlePlayClick = () => {
        setIsLoading(true);
        setError(null);

        try {
            const connection = getConnection();
            if (!connection) {
                throw new Error('Not connected to SpacetimeDB');
            }

            const joinCode = `join_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            pendingJoinCodeRef.current = joinCode;
            connection.reducers.findWorld({ joinCode });
        } catch (err) {
            console.error('Failed to join world:', err);
            setError(err instanceof Error ? err.message : 'Failed to join world');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#efc6c6ff',
        }}>
            <div style={{
                backgroundColor: '#1e1e1e',
                padding: '40px',
                borderRadius: '8px',
                border: '2px solid #4a4a4a',
                textAlign: 'center',
                minWidth: '300px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)'
            }}>
                <h1 style={{
                    color: '#ffffff',
                    marginBottom: '30px',
                    fontSize: '32px',
                    fontWeight: 'bold'
                }}>
                    Command Line Tanks
                </h1>

                {error && (
                    <div style={{
                        color: '#ff6b6b',
                        marginBottom: '20px',
                        padding: '10px',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        borderRadius: '4px'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handlePlayClick}
                    disabled={isLoading}
                    style={{
                        backgroundColor: isLoading ? '#4a4a4a' : '#4caf50',
                        color: '#ffffff',
                        border: 'none',
                        padding: '15px 40px',
                        fontSize: '18px',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.backgroundColor = '#45a049';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.backgroundColor = '#4caf50';
                        }
                    }}
                >
                    {isLoading ? 'Joining...' : 'Play'}
                </button>
            </div>
        </div>
    );
}
