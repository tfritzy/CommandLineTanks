import { useEffect, useState, useRef } from "react";
import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import MessageRow from "../../module_bindings/message_type";
import { type EventContext } from "../../module_bindings";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  timestamp: bigint;
}

interface ChatBoxProps {
  gameId: string;
}

const MAX_VISIBLE_MESSAGES = 5;

export default function ChatBox({ gameId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const subscriptionRef = useRef<TableSubscription<typeof MessageRow> | null>(null);

  useEffect(() => {
    const connection = getConnection();
    if (!connection) return;

    const updateMessages = () => {
      const allMessages = Array.from(connection.db.message.GameId.filter(gameId))
        .sort((a, b) => Number(a.timestamp - b.timestamp));

      const recentMessages = allMessages.slice(-MAX_VISIBLE_MESSAGES);

      setMessages(recentMessages.map(msg => ({
        id: msg.id,
        text: msg.text,
        timestamp: msg.timestamp,
      })));
    };

    updateMessages();

    subscriptionRef.current = subscribeToTable({
      table: connection.db.message,
      handlers: {
        onInsert: (_ctx: EventContext, message: Infer<typeof MessageRow>) => {
          if (message.gameId === gameId) {
            updateMessages();
          }
        },
        onDelete: (_ctx: EventContext, message: Infer<typeof MessageRow>) => {
          if (message.gameId === gameId) {
            updateMessages();
          }
        },
      },
      loadInitialData: true,
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [gameId]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
      <div className="flex flex-col gap-1 min-w-[300px] max-w-[400px]">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#2e2e43] bg-opacity-80 backdrop-blur-sm px-3 py-2 rounded text-[#fcfbf3] text-sm font-mono shadow-lg border border-[#4a4b5b]"
            >
              {message.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
