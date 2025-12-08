declare module 'react-console-emulator' {
  import { ComponentType } from 'react';

  interface TerminalProps {
    commands?: Record<string, (args?: string) => string | void>;
    welcomeMessage?: string;
    promptLabel?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }

  const Terminal: ComponentType<TerminalProps>;
  export default Terminal;
}
