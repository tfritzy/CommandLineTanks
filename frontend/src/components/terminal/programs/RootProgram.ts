import { type ProgramContext, Program } from './Program';
import { type DbConnection } from '../../../../module_bindings';
import { aim, drive, fire, help, respawn, stop, switchGun, target, join, smokescreen, overdrive, repair, lobbies, exitWorld } from '../commands';

export class RootProgram extends Program {
    private worldId: string;
    private connection: DbConnection | null;
    private onCreateGame: () => void;

    constructor(context: ProgramContext, worldId: string, connection: DbConnection | null, onCreateGame: () => void) {
        super(context);
        this.worldId = worldId;
        this.connection = connection;
        this.onCreateGame = onCreateGame;
    }

    onEnter(): void {
    }

    handleInput(input: string): void {
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        const [cmd, ...args] = trimmedInput.split(' ');
        
        if (!this.connection?.isActive) {
            this.addOutput("Error: connection is currently not active", "");
            return;
        }

        let commandOutput: string[] = [];

        switch (cmd.toLowerCase()) {
            case 'aim':
            case 'a':
                commandOutput = aim(this.connection, this.worldId, args);
                break;
            case 'target':
            case 't':
                commandOutput = target(this.connection, this.worldId, args);
                break;
            case 'drive':
            case 'd':
                commandOutput = drive(this.connection, this.worldId, args);
                break;
            case 'stop':
            case 's':
                commandOutput = stop(this.connection, this.worldId, args);
                break;
            case 'fire':
            case 'f':
                commandOutput = fire(this.connection, this.worldId, args);
                break;
            case 'switch':
            case 'w':
                commandOutput = switchGun(this.connection, this.worldId, args);
                break;
            case 'smokescreen':
            case 'sm':
                commandOutput = smokescreen(this.connection, this.worldId, args);
                break;
            case 'overdrive':
            case 'od':
                commandOutput = overdrive(this.connection, this.worldId, args);
                break;
            case 'repair':
            case 'rep':
                commandOutput = repair(this.connection, this.worldId, args);
                break;
            case 'respawn':
                commandOutput = respawn(this.connection, this.worldId, args);
                break;
            case 'create':
                this.onCreateGame();
                return;
            case 'join':
                commandOutput = join(this.connection, args);
                break;
            case 'exit':
            case 'e':
                commandOutput = exitWorld(this.connection, args);
                break;
            case 'lobbies':
            case 'l':
                commandOutput = lobbies(this.connection, args);
                break;
            case 'help':
            case 'h':
                commandOutput = help(this.connection, args);
                break;
            case 'clear':
            case 'c':
                this.setOutput([]);
                return;
            default:
                commandOutput = [`Command not found: ${cmd}`];
                break;
        }

        this.addOutput(...commandOutput, "");
    }

    handleKeyDown(_e: React.KeyboardEvent<HTMLInputElement>): boolean {
        return false;
    }
}
