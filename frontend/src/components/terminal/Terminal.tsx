import { useState, useRef, useEffect } from "react";
import { getConnection } from "../../spacetimedb-connection";
import { aim, drive, fire, help, respawn, stop, switchGun, target, join, smokescreen, overdrive, repair, lobbies, create, changeName, exitWorld } from "./commands";
import { parseColoredText, TERMINAL_COLORS } from "./colors";

interface TerminalComponentProps {
  worldId: string;
}

function TerminalComponent({ worldId }: TerminalComponentProps) {
  const [output, setOutput] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      const startIndex =
        historyIndex === -1 ? commandHistory.length - 1 : historyIndex - 1;

      if (startIndex < 0) return;

      const currentCommand =
        historyIndex === -1 ? input : commandHistory[historyIndex];
      let newIndex = startIndex;

      while (newIndex > 0 && commandHistory[newIndex] === currentCommand) {
        newIndex--;
      }

      if (newIndex === 0 && commandHistory[newIndex] === currentCommand) {
        return;
      }

      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;

      const newIndex = historyIndex + 1;

      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        const currentCommand = commandHistory[historyIndex];
        let nextIndex = newIndex;

        while (
          nextIndex < commandHistory.length &&
          commandHistory[nextIndex] === currentCommand
        ) {
          nextIndex++;
        }

        if (nextIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(nextIndex);
          setInput(commandHistory[nextIndex]);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newOutput = [...output];
    newOutput.push(`❯ ${input}`);

    if (input.trim()) {
      setCommandHistory([...commandHistory, input.trim()]);
      setHistoryIndex(-1);

      const trimmedInput = input.trim();
      const [cmd, ...args] = trimmedInput.split(' ');
      
      const connection = getConnection();
      if (!connection?.isActive) {
        newOutput.push("Error: connection is currently not active", "");
        setOutput(newOutput);
        setInput("");
        return;
      }

      let commandOutput: string[] = [];

      switch (cmd.toLowerCase()) {
        case 'aim':
        case 'a':
          commandOutput = aim(connection, worldId, args);
          break;
        case 'target':
        case 't':
          commandOutput = target(connection, worldId, args);
          break;
        case 'drive':
        case 'd':
          commandOutput = drive(connection, worldId, args);
          break;
        case 'stop':
        case 's':
          commandOutput = stop(connection, worldId, args);
          break;
        case 'fire':
        case 'f':
          commandOutput = fire(connection, worldId, args);
          break;
        case 'switch':
        case 'w':
          commandOutput = switchGun(connection, worldId, args);
          break;
        case 'smokescreen':
        case 'sm':
          commandOutput = smokescreen(connection, worldId, args);
          break;
        case 'overdrive':
        case 'od':
          commandOutput = overdrive(connection, worldId, args);
          break;
        case 'repair':
        case 'rep':
          commandOutput = repair(connection, worldId, args);
          break;
        case 'respawn':
          commandOutput = respawn(connection, worldId, args);
          break;
        case 'create':
          commandOutput = create(connection, args);
          break;
        case 'join':
          commandOutput = join(connection, args);
          break;
        case 'exit':
        case 'e':
          commandOutput = exitWorld(connection, worldId, args);
          break;
        case 'lobbies':
        case 'l':
          commandOutput = lobbies(connection, args);
          break;
        case 'name':
          commandOutput = changeName(connection, args);
          break;
        case 'help':
        case 'h':
          commandOutput = help(connection, args);
          break;
        case 'clear':
        case 'c':
          setOutput([]);
          setInput("");
          return;
        default:
          commandOutput = [`Command not found: ${cmd}`];
          break;
      }

      newOutput.push(...commandOutput, "");
      setOutput(newOutput);
      setInput("");
    } else {
      if (newOutput.length > 0) newOutput.push("");
      setOutput(newOutput);
      setInput("");
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "500px",
        maxHeight: "50vh",
        background: TERMINAL_COLORS.BACKGROUND,
        borderTop: `1px solid ${TERMINAL_COLORS.BORDER}`,
        display: "flex",
        justifyContent: "center",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: "1200px",
          color: TERMINAL_COLORS.TEXT_DEFAULT,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          lineHeight: "1",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <div>
          {output.map((line, i) => {
            const segments = parseColoredText(line);
            return (
              <div
                key={i}
                style={{
                  minHeight: "1.5em",
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {segments.map((segment, j) => (
                  <span key={`${i}-${j}`} style={{ color: segment.color }}>
                    {segment.text}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", alignItems: "center" }}
        >
          <span
            style={{ marginRight: "8px", color: TERMINAL_COLORS.PROMPT, fontWeight: "bold" }}
          >
            ❯
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: TERMINAL_COLORS.TEXT_DEFAULT,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              caretColor: TERMINAL_COLORS.PROMPT,
            }}
          />
        </form>
      </div>
    </div>
  );
}

export default TerminalComponent;
