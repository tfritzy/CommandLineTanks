import { useRef, useEffect } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { getConnection } from "../../spacetimedb-connection";
import { COLORS, PALETTE, colorize } from "../../theme/colors";
import { aim, drive, fire, help, respawn, stop, switchGun, target, join, smokescreen, overdrive, repair, create, changeName, exitWorld, tanks, findCommandSuggestion } from "./commands";

interface TerminalComponentProps {
  worldId: string;
}

const KEY_ENTER = 13;
const KEY_BACKSPACE = 127;
const KEY_CTRL_BACKSPACE = 23;
const KEY_CTRL_H = 8;
const KEY_ESCAPE = 27;
const ARROW_UP = "\x1b[A";
const ARROW_DOWN = "\x1b[B";

const VALID_COMMANDS = ['aim', 'a', 'target', 't', 'drive', 'd', 'stop', 's', 'fire', 'f',
  'switch', 'w', 'smokescreen', 'sm', 'overdrive', 'od', 'repair', 'rep',
  'respawn', 'tanks', 'create', 'join', 'exit', 'e', 'name', 'help', 'h', 'clear', 'c'];

function TerminalComponent({ worldId }: TerminalComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const currentInputRef = useRef<string>("");
  const playerNameRef = useRef<string>("guest");

  const getPrompt = () => {
    const name = playerNameRef.current;
    return `${colorize(`${name}@cltanks`, 'PROMPT')}${colorize(':~$ ', 'TEXT_DEFAULT')}`;
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    const connection = getConnection();
    if (connection && connection.identity) {
      const player = Array.from(connection.db.player.iter()).find((p) =>
        p.identity.isEqual(connection.identity!)
      );
      if (player) {
        playerNameRef.current = player.name;
      }

      connection.db.player.onInsert((_ctx, row) => {
        if (row.identity.isEqual(connection.identity!)) {
          playerNameRef.current = row.name;
        }
      });

      connection.db.player.onUpdate((_ctx, _oldRow, newRow) => {
        if (newRow.identity.isEqual(connection.identity!)) {
          playerNameRef.current = newRow.name;
        }
      });
    }

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      fontSize: 12,
      fontFamily: "'JetBrains Mono', monospace",
      lineHeight: 1.1,
      theme: {
        background: COLORS.TERMINAL.BACKGROUND,
        foreground: COLORS.TERMINAL.TEXT_DEFAULT,
        cursor: COLORS.TERMINAL.PROMPT,
        cursorAccent: COLORS.TERMINAL.BACKGROUND,
        selectionBackground: `${COLORS.TERMINAL.PROMPT}44`,
        black: PALETTE.GROUND_DARK,
        red: COLORS.TERMINAL.ERROR,
        green: COLORS.TERMINAL.SUCCESS,
        yellow: COLORS.TERMINAL.WARNING,
        blue: COLORS.TERMINAL.BORDER,
        magenta: PALETTE.PURPLE_MEDIUM,
        cyan: COLORS.TERMINAL.COMMAND,
        white: COLORS.TERMINAL.TEXT_DEFAULT,
        brightBlack: COLORS.TERMINAL.TEXT_DIM,
        brightRed: COLORS.TERMINAL.COOLDOWN,
        brightGreen: COLORS.TERMINAL.ARGUMENT,
        brightYellow: PALETTE.YELLOW_MEDIUM,
        brightBlue: COLORS.TERMINAL.INFO,
        brightMagenta: COLORS.TERMINAL.HEALTH,
        brightCyan: COLORS.TERMINAL.TANK_CODE,
        brightWhite: PALETTE.WHITE_BRIGHT,
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

    term.write(getPrompt());
    term.focus();

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener("resize", handleResize);

    const resolveCommand = (cmd: string): string => {
      const cmdLower = cmd.toLowerCase();

      if (VALID_COMMANDS.includes(cmdLower)) {
        return cmdLower;
      }

      if (cmdLower.startsWith('f') && cmdLower.length > 1) {
        const withoutF = cmdLower.substring(1);
        if (VALID_COMMANDS.includes(withoutF)) {
          return withoutF;
        }
      }

      const suggestion = findCommandSuggestion(cmd);
      if (suggestion && VALID_COMMANDS.includes(suggestion.toLowerCase())) {
        return suggestion.toLowerCase();
      }

      return cmdLower;
    };

    const executeCommand = (commandName: string, commandArgs: string[]): string[] | 'CLEAR' => {
      const connection = getConnection();
      if (!connection?.isActive) {
        return [colorize("Error: connection is currently not active", 'ERROR')];
      }

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
        case 'tanks':
          return tanks(connection, worldId, commandArgs);
        case 'create':
          return create(connection, commandArgs);
        case 'join':
          return join(connection, commandArgs);
        case 'exit':
        case 'e':
          return exitWorld(connection, worldId, commandArgs);
        case 'name':
          return changeName(connection, commandArgs);
        case 'help':
        case 'h':
          return help(connection, commandArgs);
        case 'clear':
        case 'c':
          return 'CLEAR';
        default:
          return [colorize(`Command not found: ${commandName}`, 'ERROR'), "", `${colorize("Use 'help' to see all available commands.", 'TEXT_DIM')}`];
      }
    };

    const handleData = (data: string) => {
      const code = data.charCodeAt(0);

      if (code === KEY_ENTER) {
        const input = currentInputRef.current.trim();

        term.write("\r\n");

        if (input) {
          commandHistoryRef.current.push(input);
          historyIndexRef.current = -1;

          const [cmd, ...args] = input.split(' ');
          const resolvedCmd = resolveCommand(cmd);

          if (resolvedCmd !== cmd.toLowerCase()) {
            term.write(`${colorize('Assuming you meant', 'TEXT_DIM')} ${colorize(`'${resolvedCmd}'`, 'COMMAND')}\r\n\r\n`);
          }

          const commandOutput = executeCommand(resolvedCmd, args);

          if (commandOutput === 'CLEAR') {
            term.clear();
            currentInputRef.current = "";
            term.write(getPrompt());
            return;
          }

          for (const line of commandOutput) {
            term.write(line + "\r\n");
          }
          term.write("\r\n");
        }

        currentInputRef.current = "";
        term.write(getPrompt());
      } else if (code === KEY_BACKSPACE) {
        if (currentInputRef.current.length > 0) {
          currentInputRef.current = currentInputRef.current.slice(0, -1);
          term.write("\b \b");
        }
      } else if (code === KEY_CTRL_BACKSPACE || code === KEY_CTRL_H) {
        if (currentInputRef.current.length > 0) {
          const input = currentInputRef.current;
          let deletePos = input.length - 1;

          while (deletePos >= 0 && input[deletePos] === ' ') {
            deletePos--;
          }

          while (deletePos >= 0 && input[deletePos] !== ' ') {
            deletePos--;
          }

          const newInput = input.substring(0, deletePos + 1);
          const charsToDelete = input.length - newInput.length;

          for (let i = 0; i < charsToDelete; i++) {
            term.write("\b \b");
          }

          currentInputRef.current = newInput;
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
        background: COLORS.TERMINAL.BACKGROUND,
        borderTop: `1px solid ${COLORS.TERMINAL.BORDER}`,
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
