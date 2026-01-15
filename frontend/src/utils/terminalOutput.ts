type TerminalWriteCallback = (text: string) => void;

let terminalWriteCallback: TerminalWriteCallback | null = null;

export function setTerminalWriteCallback(callback: TerminalWriteCallback | null): void {
  terminalWriteCallback = callback;
}

export function writeToTerminal(text: string): void {
  if (terminalWriteCallback) {
    terminalWriteCallback(text);
  }
}
