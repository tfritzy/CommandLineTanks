import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConnection, getIdentityHex } from '../spacetimedb-connection';
import type { EventContext, SubscriptionHandle } from '../../module_bindings';
import { type Infer } from "spacetimedb";
import PlayerRow from '../../module_bindings/player_type';

function getTutorialGameId(identity: string): string {
    return `tutorial_${identity.toLowerCase()}`;
}

export default function TutorialRedirector() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const subscriptionHandleRef = useRef<SubscriptionHandle | null>(null);

    useEffect(() => {
        const connection = getConnection();
        const identity = getIdentityHex();
        
        if (!connection || !identity) {
            navigate('/');
            return;
        }

        const identityLower = identity.toLowerCase();
        const tutorialGameId = getTutorialGameId(identity);

        const subscription = connection
            .subscriptionBuilder()
            .onError((e) => console.log("Player subscription error", e))
            .subscribe([`SELECT * FROM player WHERE Identity = '${connection.identity}'`]);

        subscriptionHandleRef.current = subscription;

        const checkPlayerAndRedirect = () => {
            let playerFound = false;
            for (const player of connection.db.player.iter()) {
                if (player.identity.toHexString().toLowerCase() === identityLower) {
                    playerFound = true;
                    if (player.tutorialComplete) {
                        navigate(`/game/${identityLower}`, { replace: true });
                    } else {
                        navigate(`/tutorial/${tutorialGameId}`, { replace: true });
                    }
                    break;
                }
            }
            
            if (!playerFound) {
                navigate(`/tutorial/${tutorialGameId}`, { replace: true });
            }
        };

        const handlePlayerInsert = (_ctx: EventContext, player: Infer<typeof PlayerRow>) => {
            if (player.identity.toHexString().toLowerCase() === identityLower) {
                setIsLoading(false);
                if (player.tutorialComplete) {
                    navigate(`/game/${identityLower}`, { replace: true });
                } else {
                    navigate(`/tutorial/${tutorialGameId}`, { replace: true });
                }
            }
        };

        const handlePlayerUpdate = (_ctx: EventContext, _oldPlayer: Infer<typeof PlayerRow>, newPlayer: Infer<typeof PlayerRow>) => {
            if (newPlayer.identity.toHexString().toLowerCase() === identityLower) {
                if (newPlayer.tutorialComplete) {
                    navigate(`/game/${identityLower}`, { replace: true });
                }
            }
        };

        connection.db.player.onInsert(handlePlayerInsert);
        connection.db.player.onUpdate(handlePlayerUpdate);

        const timeoutId = setTimeout(() => {
            setIsLoading(false);
            checkPlayerAndRedirect();
        }, 500);

        return () => {
            clearTimeout(timeoutId);
            if (subscriptionHandleRef.current) {
                subscriptionHandleRef.current.unsubscribe();
            }
            connection.db.player.removeOnInsert(handlePlayerInsert);
            connection.db.player.removeOnUpdate(handlePlayerUpdate);
        };
    }, [navigate]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-[#1a1a24] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#707b89] border-t-[#fcfbf3] rounded-full animate-spin mb-4"></div>
                <span className="text-[#fcfbf3] font-medium uppercase tracking-widest text-sm">Loading</span>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#1a1a24] z-[9999]">
        </div>
    );
}
