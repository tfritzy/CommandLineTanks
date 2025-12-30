import { Program } from './Program';
import { getConnection, setPendingJoinCode } from '../../../spacetimedb-connection';
import WorldVisibility from '../../../../module_bindings/world_visibility_type';
import { type Infer } from 'spacetimedb';
import { type EventContext } from '../../../../module_bindings';
import WorldRow from '../../../../module_bindings/world_type';

type CreationStep = 'name' | 'visibility' | 'passcode' | 'bots' | 'duration' | 'width' | 'height' | 'waiting';

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
        visibility: 'private',
        passcode: '',
        botCount: 0,
        duration: 10,
        width: 50,
        height: 50
    };
    private worldCreationSubscription: any = null;

    onEnter(): void {
        this.addOutput(
            "Let's create a new world!",
            "",
            "What would you like to name your world?"
        );
    }

    handleInput(input: string): void {
        if (this.step === 'waiting') {
            return;
        }

        const trimmedInput = input.trim();

        switch (this.step) {
            case 'name':
                this.handleNameInput(trimmedInput);
                break;
            case 'visibility':
                this.handleVisibilityInput(trimmedInput);
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

    handleKeyDown(_e: React.KeyboardEvent<HTMLInputElement>): boolean {
        return false;
    }

    private handleNameInput(name: string): void {
        if (!name) {
            this.addOutput("World name cannot be empty. Please enter a name:");
            return;
        }
        this.state.name = name;
        this.step = 'visibility';
        this.addOutput("", "Would you like this world to be public or private? (default: private)");
    }

    private handleVisibilityInput(input: string): void {
        if (!input) {
            this.state.visibility = 'private';
        } else if (input.toLowerCase() === 'public' || input.toLowerCase() === 'private') {
            this.state.visibility = input.toLowerCase() as 'public' | 'private';
        } else {
            this.addOutput("Please enter 'public' or 'private' (or press Enter for default):");
            return;
        }

        if (this.state.visibility === 'private') {
            this.step = 'passcode';
            this.addOutput("", "Enter a passcode for your private world (or leave empty):");
        } else {
            this.step = 'bots';
            this.addOutput("", "How many AI bots would you like? (default: 0, 0-10, must be even)");
        }
    }

    private handlePasscodeInput(passcode: string): void {
        this.state.passcode = passcode;
        this.step = 'bots';
        this.addOutput("", "How many AI bots would you like? (default: 0, 0-10, must be even)");
    }

    private handleBotsInput(input: string): void {
        if (!input) {
            this.state.botCount = 0;
        } else {
            const botCount = parseInt(input);
            if (isNaN(botCount) || botCount < 0 || botCount > 10 || botCount % 2 !== 0) {
                this.addOutput("Please enter an even number between 0 and 10 (or press Enter for default):");
                return;
            }
            this.state.botCount = botCount;
        }
        this.step = 'duration';
        this.addOutput("", "Game duration in minutes? (default: 10, 1-20)");
    }

    private handleDurationInput(input: string): void {
        if (!input) {
            this.state.duration = 10;
        } else {
            const duration = parseInt(input);
            if (isNaN(duration) || duration < 1 || duration > 20) {
                this.addOutput("Please enter a number between 1 and 20 (or press Enter for default):");
                return;
            }
            this.state.duration = duration;
        }
        this.step = 'width';
        this.addOutput("", "Map width? (default: 50, 1-200)");
    }

    private handleWidthInput(input: string): void {
        if (!input) {
            this.state.width = 50;
        } else {
            const width = parseInt(input);
            if (isNaN(width) || width < 1 || width > 200) {
                this.addOutput("Please enter a number between 1 and 200 (or press Enter for default):");
                return;
            }
            this.state.width = width;
        }
        this.step = 'height';
        this.addOutput("", "Map height? (default: 50, 1-200)");
    }

    private handleHeightInput(input: string): void {
        if (!input) {
            this.state.height = 50;
        } else {
            const height = parseInt(input);
            if (isNaN(height) || height < 1 || height > 200) {
                this.addOutput("Please enter a number between 1 and 200 (or press Enter for default):");
                return;
            }
            this.state.height = height;
        }
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
        
        this.step = 'waiting';

        this.worldCreationSubscription = connection.db.world.onInsert((_ctx: EventContext, world: Infer<typeof WorldRow>) => {
            const gameUrl = `${window.location.origin}/world/${encodeURIComponent(world.id)}`;
            this.addOutput(
                "",
                "Game created successfully!",
                "",
                "Share this URL with friends to invite them:",
                gameUrl,
                ""
            );
            if (this.worldCreationSubscription) {
                this.worldCreationSubscription.unsubscribe();
            }
            this.exit();
        });

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
    }

    onExit(): void {
        if (this.worldCreationSubscription) {
            this.worldCreationSubscription.unsubscribe();
        }
    }
}
