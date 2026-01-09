import { useRef, useEffect } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { getConnection } from "../../spacetimedb-connection";
import { COLORS, PALETTE, colorize } from "../../theme/colors";
import { aim, drive, fire, help, respawn, stop, switchGun, join, create, changeName, exitWorld, tanks, findCommandSuggestion, parseCommandInput } from "./commands";
import { type EventContext } from "../../../module_bindings";
import { type Infer } from "spacetimedb";
import WorldRow from "../../../module_bindings/world_type";

interface TerminalComponentProps {
  worldId: string;
}

const KEY_ENTER = 13;
const KEY_BACKSPACE = 127;
const KEY_CTRL_BACKSPACE = 23;
const KEY_CTRL_H = 8;
const ARROW_UP = "\x1b[A";
const ARROW_DOWN = "\x1b[B";
const ARROW_LEFT = "\x1b[D";
const ARROW_RIGHT = "\x1b[C";
const CTRL_ARROW_LEFT = "\x1b[1;5D";
const CTRL_ARROW_RIGHT = "\x1b[1;5C";

const VALID_COMMANDS = ['aim', 'a', 'drive', 'd', 'stop', 's', 'fire', 'f',
  'switch', 'w',
  'respawn', 'tanks', 'create', 'join', 'exit', 'e', 'name', 'help', 'h', 'clear', 'c'];

const MAX_TERMINAL_LINES = 1000;
const SEPARATOR_LENGTH = 80;

function TerminalComponent({ worldId }: TerminalComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const currentInputRef = useRef<string>("");
  const cursorPosRef = useRef<number>(0);
  const terminalOutputRef = useRef<string>("");
  const getPrompt = () => {
    return `\x1b[1m${colorize('❯ ', 'PROMPT')}`;
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      fontSize: 12,
      fontFamily: "'JetBrains Mono', monospace",
      lineHeight: 1.2,
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

    if (terminalOutputRef.current) {
      term.write(terminalOutputRef.current);
    }
    
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
        case 'respawn':
          return respawn(connection, worldId, commandArgs);
        case 'tanks':
          return tanks(connection, worldId, commandArgs);
        case 'create':
          return create(connection, commandArgs);
        case 'join':
          return join(connection, worldId, commandArgs);
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

    const executeMultipleCommands = (commands: string[]): string => {
      let output = "";
      for (const command of commands) {
        const trimmedCommand = command.trim();
        if (!trimmedCommand) continue;

        const parsedArgs = parseCommandInput(trimmedCommand);
        const [cmd, ...args] = parsedArgs;
        const resolvedCmd = resolveCommand(cmd);

        if (resolvedCmd !== cmd.toLowerCase()) {
          output += `${colorize('Assuming you meant', 'TEXT_DIM')} ${colorize(`'${resolvedCmd}'`, 'COMMAND')}\r\n\r\n`;
        }

        const commandOutput = executeCommand(resolvedCmd, args);

        if (commandOutput === 'CLEAR') {
          return 'CLEAR';
        }

        for (const line of commandOutput) {
          output += line + "\r\n";
        }
        output += "\r\n";
      }
      return output;
    };

    const clearCurrentLine = () => {
      const input = currentInputRef.current;
      const cursorPos = cursorPosRef.current;
      const charsAfterCursor = input.length - cursorPos;
      if (charsAfterCursor > 0) {
        term.write(ARROW_RIGHT.repeat(charsAfterCursor));
      }
      for (let i = 0; i < input.length; i++) {
        term.write("\b \b");
      }
    };

    const setInput = (newInput: string) => {
      clearCurrentLine();
      currentInputRef.current = newInput;
      cursorPosRef.current = newInput.length;
      term.write(newInput);
    };

    const handleData = (data: string) => {
      if (data.startsWith('\x1b[')) {
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
          setInput(newCommand);
        } else if (data === ARROW_DOWN) {
          if (historyIndexRef.current === -1) return;

          const newIndex = historyIndexRef.current + 1;

          if (newIndex >= commandHistoryRef.current.length) {
            historyIndexRef.current = -1;
            setInput("");
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
              setInput("");
            } else {
              historyIndexRef.current = nextIndex;
              const newCommand = commandHistoryRef.current[nextIndex];
              setInput(newCommand);
            }
          }
        } else if (data === ARROW_LEFT) {
          if (cursorPosRef.current > 0) {
            cursorPosRef.current--;
            term.write(ARROW_LEFT);
          }
        } else if (data === ARROW_RIGHT) {
          if (cursorPosRef.current < currentInputRef.current.length) {
            cursorPosRef.current++;
            term.write(ARROW_RIGHT);
          }
        } else if (data === CTRL_ARROW_LEFT) {
          const input = currentInputRef.current;
          let newPos = cursorPosRef.current - 1;

          while (newPos >= 0 && input[newPos] === ' ') {
            newPos--;
          }
          while (newPos >= 0 && input[newPos] !== ' ') {
            newPos--;
          }
          newPos = Math.max(0, newPos + 1);

          const moveBy = cursorPosRef.current - newPos;
          if (moveBy > 0) {
            term.write(ARROW_LEFT.repeat(moveBy));
            cursorPosRef.current = newPos;
          }
        } else if (data === CTRL_ARROW_RIGHT) {
          const input = currentInputRef.current;
          let newPos = cursorPosRef.current;

          while (newPos < input.length && input[newPos] !== ' ') {
            newPos++;
          }
          while (newPos < input.length && input[newPos] === ' ') {
            newPos++;
          }

          const moveBy = newPos - cursorPosRef.current;
          if (moveBy > 0) {
            term.write(ARROW_RIGHT.repeat(moveBy));
            cursorPosRef.current = newPos;
          }
        }
        return;
      }

      const code = data.charCodeAt(0);

      if (code === KEY_ENTER) {
        const input = currentInputRef.current.trim();
        let finalOutput = "\r\n";

        if (input) {
          commandHistoryRef.current.push(input);
          historyIndexRef.current = -1;

          const commands = input.split(/[;\n]/);
          const result = executeMultipleCommands(commands);

          if (result === 'CLEAR') {
            currentInputRef.current = "";
            cursorPosRef.current = 0;
            terminalOutputRef.current = "";
            term.write('\x1b[2J\x1b[3J\x1b[H' + getPrompt());
            return;
          }

          finalOutput += result;
        }

        currentInputRef.current = "";
        cursorPosRef.current = 0;
        terminalOutputRef.current += finalOutput;
        
        const lines = terminalOutputRef.current.split('\r\n');
        if (lines.length > MAX_TERMINAL_LINES) {
          terminalOutputRef.current = lines.slice(-MAX_TERMINAL_LINES).join('\r\n');
        }
        
        finalOutput += getPrompt();
        term.write(finalOutput);
      } else if (code === KEY_BACKSPACE) {
        if (cursorPosRef.current > 0) {
          const input = currentInputRef.current;
          const before = input.substring(0, cursorPosRef.current - 1);
          const after = input.substring(cursorPosRef.current);
          currentInputRef.current = before + after;
          cursorPosRef.current--;

          term.write("\b");
          term.write(after + " ");
          term.write(ARROW_LEFT.repeat(after.length + 1));
        }
      } else if (code === KEY_CTRL_BACKSPACE || code === KEY_CTRL_H) {
        if (cursorPosRef.current > 0) {
          const input = currentInputRef.current;
          let deletePos = cursorPosRef.current - 1;

          while (deletePos >= 0 && input[deletePos] === ' ') {
            deletePos--;
          }

          while (deletePos >= 0 && input[deletePos] !== ' ') {
            deletePos--;
          }

          const newCursorPos = deletePos + 1;
          const before = input.substring(0, newCursorPos);
          const after = input.substring(cursorPosRef.current);
          const charsDeleted = cursorPosRef.current - newCursorPos;

          currentInputRef.current = before + after;

          for (let i = 0; i < charsDeleted; i++) {
            term.write("\b");
          }
          term.write(after + " ".repeat(charsDeleted));
          term.write(ARROW_LEFT.repeat(after.length + charsDeleted));

          cursorPosRef.current = newCursorPos;
        }
      } else if (code >= 32) {
        const input = currentInputRef.current;
        const before = input.substring(0, cursorPosRef.current);
        const after = input.substring(cursorPosRef.current);
        currentInputRef.current = before + data + after;
        cursorPosRef.current += data.length;

        term.write(data + after);
        if (after.length > 0) {
          term.write(ARROW_LEFT.repeat(after.length));
        }
      }
    };

    const dataDisposable = term.onData(handleData);

    return () => {
      dataDisposable.dispose();
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
  }, [worldId]);

  useEffect(() => {
    const connection = getConnection();
    const term = xtermRef.current;
    if (!connection || !term) return;

    const handleWorldInsert = (_ctx: EventContext, world: Infer<typeof WorldRow>) => {
      if (world.owner && connection.identity && world.owner.isEqual(connection.identity)) {
        const url = `${window.location.origin}/world/${world.id}`;
        
        const separator = colorize('═'.repeat(SEPARATOR_LENGTH), 'BORDER');
        const title = colorize('🎮 WORLD CREATED SUCCESSFULLY', 'SUCCESS');
        const urlLabel = colorize('Share this URL with friends to invite them:', 'TEXT_DEFAULT');
        const urlText = colorize(url, 'TANK_CODE');
        
        let output = `\r\n${separator}\r\n`;
        output += `${title}\r\n`;
        output += `\r\n`;
        output += `${urlLabel}\r\n`;
        output += `${urlText}\r\n`;
        output += `${separator}\r\n`;
        output += `\r\n`;

        terminalOutputRef.current += output;
        term.write(output);
      }
    };

    connection.db.world.onInsert(handleWorldInsert);

    return () => {
      connection.db.world.removeOnInsert(handleWorldInsert);
    };
  }, []);

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