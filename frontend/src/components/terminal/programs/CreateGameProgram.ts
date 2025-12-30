import { Program } from './Program';
import { getConnection, setPendingJoinCode } from '../../../spacetimedb-connection';
import WorldVisibility from '../../../../module_bindings/world_visibility_type';

type CreationStep = 'name' | 'visibility' | 'passcode' | 'bots' | 'duration' | 'width' | 'height';

interface CreationState {
    name: string;
    visibility: 'public' | 'private';
    passcode: string;
    botCount: number;
    duration: number;
    width: number;
    height: number;
}

export class CreateGameProgram extends Program {
    private step: CreationStep = 'name';
    private state: CreationState = {
        name: '',
        visibility: 'public',
        passcode: '',
        botCount: 0,
        duration: 5,
        width: 40,
        height: 40
    };
    private selectedVisibilityIndex: number = 0;
    private visibilityOptions: Array<{ value: 'public' | 'private', label: string }> = [
        { value: 'public', label: 'Public - Anyone can join with world ID' },
        { value: 'private', label: 'Private - Requires passcode to join' }
    ];

    onEnter(): void {
        this.addOutput(
            "Let's create a new world!",
            "",
            "What would you like to name your world?"
        );
    }

    handleInput(input: string): void {
        const trimmedInput = input.trim();

        switch (this.step) {
            case 'name':
                this.handleNameInput(trimmedInput);
                break;
            case 'visibility':
                break;
            case 'passcode':
                this.handlePasscodeInput(trimmedInput);
                break;
            case 'bots':
                this.handleBotsInput(trimmedInput);
                break;
            case 'duration':
                this.handleDurationInput(trimmedInput);
                break;
            case 'width':
                this.handleWidthInput(trimmedInput);
                break;
            case 'height':
                this.handleHeightInput(trimmedInput);
                break;
        }
    }

    handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): boolean {
        if (this.step === 'visibility') {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedVisibilityIndex = Math.max(0, this.selectedVisibilityIndex - 1);
                this.renderVisibilityOptions();
                return true;
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedVisibilityIndex = Math.min(this.visibilityOptions.length - 1, this.selectedVisibilityIndex + 1);
                this.renderVisibilityOptions();
                return true;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.selectVisibility();
                return true;
            }
        }
        return false;
    }

    private handleNameInput(name: string): void {
        if (!name) {
            this.addOutput("World name cannot be empty. Please enter a name:");
            return;
        }
        this.state.name = name;
        this.step = 'visibility';
        this.renderVisibilityOptions();
    }

    private renderVisibilityOptions(): void {
        const lines = [
            "",
            "Would you like this world to be public or private?",
            ""
        ];

        this.visibilityOptions.forEach((option, index) => {
            const prefix = index === this.selectedVisibilityIndex ? '❯ ' : '  ';
            lines.push(`${prefix}${option.label}`);
        });

        lines.push("");
        lines.push("Use ↑↓ to navigate, Enter to select, Esc to cancel");

        this.setOutput([...this.context.output, ...lines]);
    }

    private selectVisibility(): void {
        const selected = this.visibilityOptions[this.selectedVisibilityIndex];
        this.state.visibility = selected.value;
        
        const newOutput = this.context.output.slice(0, -this.visibilityOptions.length - 4);
        newOutput.push("", `Selected: ${selected.label}`, "");
        
        if (this.state.visibility === 'private') {
            newOutput.push("Enter a passcode for your private world (or leave empty):");
            this.step = 'passcode';
        } else {
            newOutput.push("How many AI bots would you like? (0-10, must be even)");
            this.step = 'bots';
        }
        
        this.setOutput(newOutput);
    }

    private handlePasscodeInput(passcode: string): void {
        this.state.passcode = passcode;
        this.step = 'bots';
        this.addOutput("", "How many AI bots would you like? (0-10, must be even)");
    }

    private handleBotsInput(input: string): void {
        const botCount = parseInt(input);
        if (isNaN(botCount) || botCount < 0 || botCount > 10 || botCount % 2 !== 0) {
            this.addOutput("Please enter an even number between 0 and 10:");
            return;
        }
        this.state.botCount = botCount;
        this.step = 'duration';
        this.addOutput("", "Game duration in minutes? (1-20)");
    }

    private handleDurationInput(input: string): void {
        const duration = parseInt(input);
        if (isNaN(duration) || duration < 1 || duration > 20) {
            this.addOutput("Please enter a number between 1 and 20:");
            return;
        }
        this.state.duration = duration;
        this.step = 'width';
        this.addOutput("", "Map width? (1-200)");
    }

    private handleWidthInput(input: string): void {
        const width = parseInt(input);
        if (isNaN(width) || width < 1 || width > 200) {
            this.addOutput("Please enter a number between 1 and 200:");
            return;
        }
        this.state.width = width;
        this.step = 'height';
        this.addOutput("", "Map height? (1-200)");
    }

    private handleHeightInput(input: string): void {
        const height = parseInt(input);
        if (isNaN(height) || height < 1 || height > 200) {
            this.addOutput("Please enter a number between 1 and 200:");
            return;
        }
        this.state.height = height;
        this.createWorld();
    }

    private createWorld(): void {
        const connection = getConnection();
        if (!connection) {
            this.addOutput("", "Error: connection is currently not active");
            this.exit();
            return;
        }

        const joinCode = `join_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        setPendingJoinCode(joinCode);
        
        const gameDurationMicros = BigInt(this.state.duration * 60 * 1000000);
        const visibility = this.state.visibility === 'private' ? WorldVisibility.Private : WorldVisibility.CustomPublic;
        
        connection.reducers.createWorld({ 
            joinCode,
            worldName: this.state.name,
            visibility, 
            passcode: this.state.passcode || '',
            botCount: this.state.botCount,
            gameDurationMicros,
            width: this.state.width,
            height: this.state.height
        });

        const visibilityLabel = this.state.visibility === 'private' ? 'private' : 'public';
        this.addOutput(
            "",
            `Creating ${visibilityLabel} world "${this.state.name}"...`,
            `Bots: ${this.state.botCount}, Duration: ${this.state.duration} min, Size: ${this.state.width}x${this.state.height}`,
            ""
        );
        
        this.exit();
    }
}
