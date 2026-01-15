type TerminalWriteCallback = (text: string) => void;

/**
 * Global singleton callback for writing to the terminal.
 * This is set by the Terminal component when it mounts and cleared when it unmounts.
 * Only one terminal should be active at a time, so this follows a singleton pattern.
 */
let terminalWriteCallback: TerminalWriteCallback | null = null;

/**
 * Registers a callback function that will be used to write text to the terminal.
 * This should only be called by the Terminal component during initialization.
 * Pass null to clear the callback during cleanup.
 * 
 * @param callback - Function that accepts text to write, or null to clear
 */
export function setTerminalWriteCallback(callback: TerminalWriteCallback | null): void {
  terminalWriteCallback = callback;
}

/**
 * Writes text to the terminal if a callback is registered.
 * This function can be called from anywhere in the application to output text to the terminal.
 * If no terminal is currently active, the text will be silently ignored.
 * 
 * @param text - The text to write to the terminal (can include ANSI escape codes)
 */
export function writeToTerminal(text: string): void {
  if (terminalWriteCallback) {
    terminalWriteCallback(text);
  }
}
