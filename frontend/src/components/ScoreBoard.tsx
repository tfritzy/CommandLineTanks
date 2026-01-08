import { useEffect, useState, useRef } from "react";
import { getConnection, isCurrentIdentity } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import TankRow from "../../module_bindings/tank_type";
import TankMetadataRow from "../../module_bindings/tank_metadata_type";
import { type EventContext } from "../../module_bindings";
import { createMultiTableSubscription, type MultiTableSubscription } from "../utils/tableSubscription";
import { motion, AnimatePresence, animate } from "framer-motion";

interface PlayerScore {
  id: string;
  name: string;
  kills: number;
  deaths: number;
  killStreak: number;
  alliance: number;
  displayScore: number;
  owner: string;
}

interface ScoreBoardProps {
  worldId: string;
}

interface AnimatedScoreProps {
  value: number;
}

function AnimatedScore({ value }: AnimatedScoreProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let animation: { stop: () => void } | null = null;
    animation = animate(displayValue, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest: number) => setDisplayValue(Math.round(latest)),
    });
    return () => animation?.stop();
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function ScoreBoard({ worldId }: ScoreBoardProps) {
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const connection = getConnection();
  const subscriptionRef = useRef<MultiTableSubscription | null>(null);
  const cachedOwnerHexStrings = useRef<Map<string, string>>(new Map());

  const isHomeworld = isCurrentIdentity(worldId);

  useEffect(() => {
    if (!connection || isHomeworld) return;

    const updatePlayerScores = () => {
      const tankMap = new Map<string, Infer<typeof TankRow>>();
      for (const tank of connection.db.tank.iter()) {
        if (tank.worldId === worldId) {
          tankMap.set(tank.id, tank);
        }
      }
      
      const metadatas = Array.from(connection.db.tankMetadata.iter())
        .filter(m => m.worldId === worldId);
      
      const combined = metadatas.map(metadata => {
        const tank = tankMap.get(metadata.tankId);
        return { metadata, tank };
      }).filter(c => c.tank !== undefined)
        .sort((a, b) => (b.tank?.killStreak ?? 0) - (a.tank?.killStreak ?? 0));

      const newPlayers: PlayerScore[] = [];
      for (const { metadata, tank } of combined) {
        if (!tank) continue;
        let ownerHex = cachedOwnerHexStrings.current.get(metadata.tankId);
        if (!ownerHex) {
          ownerHex = metadata.owner.toHexString();
          cachedOwnerHexStrings.current.set(metadata.tankId, ownerHex);
        }
        
        newPlayers.push({
          id: metadata.tankId,
          name: metadata.name,
          kills: tank.kills,
          deaths: tank.deaths,
          killStreak: tank.killStreak,
          alliance: metadata.alliance,
          displayScore: tank.killStreak,
          owner: ownerHex,
        });
      }

      setPlayers(newPlayers);
    };

    subscriptionRef.current = createMultiTableSubscription()
      .add<typeof TankMetadataRow>({
        table: connection.db.tankMetadata,
        handlers: {
          onInsert: (_ctx: EventContext, metadata: Infer<typeof TankMetadataRow>) => {
            if (metadata.worldId === worldId) {
              cachedOwnerHexStrings.current.set(metadata.tankId, metadata.owner.toHexString());
              updatePlayerScores();
            }
          },
          onUpdate: (_ctx: EventContext, _oldMetadata: Infer<typeof TankMetadataRow>, newMetadata: Infer<typeof TankMetadataRow>) => {
            if (newMetadata.worldId === worldId) updatePlayerScores();
          },
          onDelete: (_ctx: EventContext, metadata: Infer<typeof TankMetadataRow>) => {
            if (metadata.worldId === worldId) {
              cachedOwnerHexStrings.current.delete(metadata.tankId);
              updatePlayerScores();
            }
          }
        }
      })
      .add<typeof TankRow>({
        table: connection.db.tank,
        handlers: {
          onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (tank.worldId === worldId) updatePlayerScores();
          },
          onUpdate: (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
            if (newTank.worldId === worldId) updatePlayerScores();
          },
          onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (tank.worldId === worldId) updatePlayerScores();
          }
        },
        loadInitialData: false
      });

    updatePlayerScores();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [worldId, connection, isHomeworld]);


  if (isHomeworld || players.length === 0) {
    return null;
  }



  const currentPlayerIdentity = connection?.identity?.toString();
  const top3 = players.slice(0, 3);
  const currentPlayer = players.find((p) => p.owner === currentPlayerIdentity);
  const isPlayerInTop3 = top3.some((p) => p.owner === currentPlayerIdentity);

  const renderPlayerLine = (player: PlayerScore, isLast: boolean) => {
    const teamColors =
      player.alliance === 0
        ? { label: '#ff5555', value: '#c06852' }
        : { label: '#7fbbdc', value: '#7396d5' };

    return (
      <motion.div
        key={player.id}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className={`flex items-center h-6 w-full gap-2 font-mono text-[13px] font-semibold ${!isLast ? 'mb-0.5' : ''}`}
      >
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap opacity-90 text-ui-text-primary">
          {player.name}
        </span>
        <span className="font-extrabold min-w-[24px] text-right tabular-nums" style={{ color: teamColors.value }}>
          <AnimatedScore value={player.killStreak} />
        </span>
      </motion.div>
    );
  };

  return (
    <div
      className={`absolute top-[5px] z-[1000] flex flex-col w-[200px] ${currentPlayer?.alliance === 0 ? 'left-[5px]' : 'right-[5px]'}`}
    >
      <div className="w-full bg-palette-purple-void/85 backdrop-blur-xl border border-palette-white-pure/[0.08] rounded p-3 shadow-2xl flex flex-col">
        <div className="text-ui-text-dim text-[10px] font-mono font-extrabold tracking-[0.2em] mb-2.5 text-center opacity-80 border-b border-palette-white-pure/[0.08] pb-1.5 uppercase">
          Top Streaks
        </div>

        <div className="flex flex-col gap-0.5">
          <AnimatePresence mode="popLayout">
            {top3.map((player, idx) => renderPlayerLine(player, idx === top3.length - 1 && !currentPlayer))}

            {currentPlayer && !isPlayerInTop3 && (
              <motion.div
                key="divider-group"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <div className="h-px w-full bg-palette-white-pure/[0.05] my-1.5" />
                {renderPlayerLine(currentPlayer, true)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
