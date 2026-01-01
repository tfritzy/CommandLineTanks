import { useRef, useEffect } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { getConnection } from "../../spacetimedb-connection";
import { aim, drive, fire, help, respawn, stop, switchGun, target, join, smokescreen, overdrive, repair, lobbies, create, changeName, exitWorld } from "./commands";

interface TerminalComponentProps {
  worldId: string;
}

function TerminalComponent({ worldId }: TerminalComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const currentInputRef = useRef<string>("");

  const PROMPT = "\x1b[1;32m❯\x1b[0m ";
  const KEY_ENTER = 13;
  const KEY_BACKSPACE = 127;
  const KEY_ESCAPE = 27;
  const ARROW_UP = "\x1b[A";
  const ARROW_DOWN = "\x1b[B";

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: "'JetBrains Mono', monospace",
      lineHeight: 1.5,
      theme: {
        background: "#2a152d",
        foreground: "#e6eeed",
        cursor: "#96dc7f",
        cursorAccent: "#2a152d",
        selectionBackground: "rgba(150, 220, 127, 0.3)",
        black: "#2e2e43",
        red: "#c06852",
        green: "#96dc7f",
        yellow: "#fceba8",
        blue: "#5a78b2",
        magenta: "#794e6d",
        cyan: "#7fbbdc",
        white: "#e6eeed",
        brightBlack: "#707b89",
        brightRed: "#e39764",
        brightGreen: "#d5f893",
        brightYellow: "#f5c47c",
        brightBlue: "#7396d5",
        brightMagenta: "#9d4343",
        brightCyan: "#aaeeea",
        brightWhite: "#fcfbf3",
      },
      scrollback: 1000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.write(PROMPT);

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener("resize", handleResize);

    const handleData = (data: string) => {
      const code = data.charCodeAt(0);

      if (code === KEY_ENTER) {
        const input = currentInputRef.current.trim();
        
        for (let i = 0; i < currentInputRef.current.length; i++) {
          term.write("\b \b");
        }
        
        if (currentInputRef.current.length > 0) {
          term.write("\r\n" + PROMPT + currentInputRef.current + "\r\n");
        }
        
        if (input) {
          commandHistoryRef.current.push(input);
          historyIndexRef.current = -1;

          const [cmd, ...args] = input.split(' ');
          
          const connection = getConnection();
          if (!connection?.isActive) {
            term.write("Error: connection is currently not active\r\n");
          } else {
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
                term.clear();
                currentInputRef.current = "";
                term.write(PROMPT);
                return;
              default:
                commandOutput = [`Command not found: ${cmd}`];
                break;
            }

            for (const line of commandOutput) {
              term.write(line + "\r\n");
            }
          }
        }
        
        currentInputRef.current = "";
        term.write("\r\n" + PROMPT);
      } else if (code === KEY_BACKSPACE) {
        if (currentInputRef.current.length > 0) {
          currentInputRef.current = currentInputRef.current.slice(0, -1);
          term.write("\b \b");
        }
      } else if (code === KEY_ESCAPE) {
        if (data === ARROW_UP) {
          if (commandHistoryRef.current.length === 0) return;

          const startIndex = historyIndexRef.current === -1 
            ? commandHistoryRef.current.length - 1 
            : historyIndexRef.current - 1;

          if (startIndex < 0) return;

          const currentCommand = historyIndexRef.current === -1 
            ? currentInputRef.current 
            : commandHistoryRef.current[historyIndexRef.current];
          let newIndex = startIndex;

          while (newIndex > 0 && commandHistoryRef.current[newIndex] === currentCommand) {
            newIndex--;
          }

          if (newIndex === 0 && commandHistoryRef.current[newIndex] === currentCommand) {
            return;
          }

          historyIndexRef.current = newIndex;
          const newCommand = commandHistoryRef.current[newIndex];
          
          for (let i = 0; i < currentInputRef.current.length; i++) {
            term.write("\b \b");
          }
          
          currentInputRef.current = newCommand;
          term.write(newCommand);
        } else if (data === ARROW_DOWN) {
          if (historyIndexRef.current === -1) return;

          const newIndex = historyIndexRef.current + 1;

          if (newIndex >= commandHistoryRef.current.length) {
            historyIndexRef.current = -1;
            
            for (let i = 0; i < currentInputRef.current.length; i++) {
              term.write("\b \b");
            }
            currentInputRef.current = "";
          } else {
            const currentCommand = commandHistoryRef.current[historyIndexRef.current];
            let nextIndex = newIndex;

            while (
              nextIndex < commandHistoryRef.current.length &&
              commandHistoryRef.current[nextIndex] === currentCommand
            ) {
              nextIndex++;
            }

            if (nextIndex >= commandHistoryRef.current.length) {
              historyIndexRef.current = -1;
              
              for (let i = 0; i < currentInputRef.current.length; i++) {
                term.write("\b \b");
              }
              currentInputRef.current = "";
            } else {
              historyIndexRef.current = nextIndex;
              const newCommand = commandHistoryRef.current[nextIndex];
              
              for (let i = 0; i < currentInputRef.current.length; i++) {
                term.write("\b \b");
              }
              
              currentInputRef.current = newCommand;
              term.write(newCommand);
            }
          }
        }
      } else if (code >= 32) {
        currentInputRef.current += data;
        term.write(data);
      }
    };

    term.onData(handleData);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
  }, [worldId]);

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
        padding: "16px",
      }}
    >
      <div
        ref={terminalRef}
        style={{
          width: "100%",
          maxWidth: "1200px",
          height: "100%",
        }}
      />
    </div>
  );
}

export default TerminalComponent;
