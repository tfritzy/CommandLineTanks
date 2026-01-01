import { useState, useRef, useEffect } from "react";
import { getConnection } from "../../spacetimedb-connection";
import { aim, drive, fire, help, respawn, stop, switchGun, target, join, smokescreen, overdrive, repair, lobbies, create, changeName, exitWorld, findCommandSuggestion, type CommandResult } from "./commands";

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
    const commandLineIndex = newOutput.length;
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

      const executeCommand = (commandName: string, commandArgs: string[]): string[] | CommandResult | 'CLEAR' => {
        switch (commandName.toLowerCase()) {
          case 'aim':
          case 'a':
            return aim(connection, worldId, commandArgs);
          case 'target':
          case 't':
            return target(connection, worldId, commandArgs);
          case 'drive':
          case 'd':
            return drive(connection, worldId, commandArgs);
          case 'stop':
          case 's':
            return stop(connection, worldId, commandArgs);
          case 'fire':
          case 'f':
            return fire(connection, worldId, commandArgs);
          case 'switch':
          case 'w':
            return switchGun(connection, worldId, commandArgs);
          case 'smokescreen':
          case 'sm':
            return smokescreen(connection, worldId, commandArgs);
          case 'overdrive':
          case 'od':
            return overdrive(connection, worldId, commandArgs);
          case 'repair':
          case 'rep':
            return repair(connection, worldId, commandArgs);
          case 'respawn':
            return respawn(connection, worldId, commandArgs);
          case 'create':
            return create(connection, commandArgs);
          case 'join':
            return join(connection, commandArgs);
          case 'exit':
          case 'e':
            return exitWorld(connection, worldId, commandArgs);
          case 'lobbies':
          case 'l':
            return lobbies(connection, commandArgs);
          case 'name':
            return changeName(connection, commandArgs);
          case 'help':
          case 'h':
            return help(connection, commandArgs);
          case 'clear':
          case 'c':
            return 'CLEAR';
          default:
            return [`Command not found: ${commandName}`, "", "Use 'help' to see all available commands."];
        }
      };

      let commandOutput = executeCommand(cmd, args);

      if (commandOutput === 'CLEAR') {
        setOutput([]);
        setInput("");
        return;
      }

      let outputLines: string[];
      let normalizedCmd: string | undefined;
      
      if (Array.isArray(commandOutput)) {
        outputLines = commandOutput;
      } else {
        outputLines = commandOutput.output;
        normalizedCmd = commandOutput.normalizedCommand;
      }

      if (outputLines[0]?.startsWith('Command not found:')) {
        const suggestion = findCommandSuggestion(cmd);
        if (suggestion) {
          newOutput.push(`Assuming you meant '${suggestion}'`, "");
          commandOutput = executeCommand(suggestion, args);
          
          if (commandOutput === 'CLEAR') {
            setOutput([]);
            setInput("");
            return;
          }
          
          if (Array.isArray(commandOutput)) {
            outputLines = commandOutput;
            normalizedCmd = undefined;
          } else {
            outputLines = commandOutput.output;
            normalizedCmd = commandOutput.normalizedCommand;
          }
        }
      }

      if (normalizedCmd && normalizedCmd !== trimmedInput) {
        newOutput[commandLineIndex] = `❯ ${normalizedCmd}`;
      }

      newOutput.push(...outputLines, "");
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
        background: "#2a152d",
        borderTop: "1px solid #5a78b2",
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
          color: "#e6eeed",
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
          {output.map((line, i) => (
            <div
              key={i}
              style={{
                minHeight: "1.5em",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", alignItems: "center" }}
        >
          <span
            style={{ marginRight: "8px", color: "#96dc7f", fontWeight: "bold" }}
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
              color: "#e6eeed",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              caretColor: "#96dc7f",
            }}
          />
        </form>
      </div>
    </div>
  );
}

export default TerminalComponent;
