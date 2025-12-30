export interface ProgramContext {
    output: string[];
    setOutput: (output: string[]) => void;
    setInput: (input: string) => void;
    exitProgram: () => void;
    worldId: string;
}

export abstract class Program {
    protected context: ProgramContext;

    constructor(context: ProgramContext) {
        this.context = context;
    }

    abstract onEnter(): void;
    
    abstract handleInput(input: string): void;
    
    abstract handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): boolean;
    
    onWorldIdChange(_newWorldId: string): void {
    }
    
    onExit(): void {
    }

    protected addOutput(...lines: string[]): void {
        const newOutput = [...this.context.output, ...lines];
        this.context.setOutput(newOutput);
    }

    protected setOutput(lines: string[]): void {
        this.context.setOutput(lines);
    }

    protected clearInput(): void {
        this.context.setInput('');
    }

    protected exit(): void {
        this.context.exitProgram();
    }
}
