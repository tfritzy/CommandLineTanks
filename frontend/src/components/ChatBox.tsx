import { useEffect, useState, useRef } from "react";
import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import MessageRow from "../../module_bindings/message_type";
import { type EventContext } from "../../module_bindings";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: bigint;
}

interface ChatBoxProps {
  gameId: string;
}

interface TextSegment {
  text: string;
  color?: string;
}

const MAX_VISIBLE_MESSAGES = 10;

function parseMessageText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /(\[color=#[0-9a-fA-F]{6}\]|\[\/color\])/g;
  const parts = text.split(regex);

  let currentColor: string | undefined = undefined;

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith("[color=")) {
      currentColor = part.substring(7, 14);
    } else if (part === "[/color]") {
      currentColor = undefined;
    } else {
      segments.push({ text: part, color: currentColor });
    }
  }
  
  return segments;
}

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
        sender: msg.sender,
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
      <div className="flex flex-col gap-0.5">
        {messages.map((message) => {
          const segments = parseMessageText(message.text);
          return (
            <div key={message.id} className="text-[#fcfbf3] text-xs font-mono text-shadow-sm">
              <span className="text-[#a9bcbf]">[{message.sender}] </span>
              {segments.map((segment, idx) => (
                <span key={idx} style={segment.color ? { color: segment.color } : undefined}>
                  {segment.text}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
