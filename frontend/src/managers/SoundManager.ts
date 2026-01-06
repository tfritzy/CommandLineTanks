export class SoundManager {
    private sounds: Map<string, HTMLAudioElement[]> = new Map();
    private listenerX: number = 0;
    private listenerY: number = 0;
    private readonly MAX_DISTANCE = 40; // Tiles

    private soundMap: Record<string, string[]> = {
        // Damage Taken
        'damage': [
            '/8bit-SFX-Library/Collide/hit-1.wav',
            '/8bit-SFX-Library/Collide/hit-2.wav',
            '/8bit-SFX-Library/Collide/hit-3.wav',
            '/8bit-SFX-Library/Collide/hit-4.wav',
            '/8bit-SFX-Library/Collide/hit-5.wav',
            '/8bit-SFX-Library/Collide/hit-6.wav',
            '/8bit-SFX-Library/Collide/hit-7.wav',
        ],
        // Projectile Hit (non-explosive)
        'hit': [
            '/8bit-SFX-Library/Collide/bonk-1.wav',
            '/8bit-SFX-Library/Collide/bonk-2.wav',
            '/8bit-SFX-Library/Collide/bonk-3.wav',
            '/8bit-SFX-Library/Collide/bonk-4.wav',
            '/8bit-SFX-Library/Collide/bonk-5.wav',
        ],
        // Explosion
        'explosion': [
            '/8bit-SFX-Library/Collide/explode-1.wav',
            '/8bit-SFX-Library/Collide/explode-2.wav',
            '/8bit-SFX-Library/Collide/explode-3.wav',
            '/8bit-SFX-Library/Collide/explode-4.wav',
            '/8bit-SFX-Library/Collide/explode-5.wav',
            '/8bit-SFX-Library/Collide/explode-6.wav',
            '/8bit-SFX-Library/Collide/explode-7.wav',
        ],
        // Weapon Pickup
        'pickup-weapon': ['/8bit-SFX-Library/Collect/collect-6.wav'],
        // Health Pickup
        'pickup-health': ['/8bit-SFX-Library/Collect/collect-1.wav'],
        // Shield Pickup
        'pickup-shield': ['/8bit-SFX-Library/Collect/coin-1.wav'],
        // Shield Pop
        'shield-pop': ['/8bit-SFX-Library/Player/jump-10.wav'],
        // Weapon Depletion (Dry Fire) - using a click sound
        'weapon-empty': ['/8bit-SFX-Library/UI/cancel-3.wav'],
        // Weapon Switch
        'weapon-switch': ['/8bit-SFX-Library/UI/blip-2.wav'],
        // Terrain Destruction
        'terrain-destroy': [
            '/8bit-SFX-Library/Collide/bonk-1.wav',
            '/8bit-SFX-Library/Collide/bonk-6.wav'
        ],
        // Win
        'win': ['/8bit-SFX-Library/Win/win-1.wav'],
        // Death
        'death': ['/8bit-SFX-Library/Lose/lose-4.wav'],
        // Kill
        'kill': ['/8bit-SFX-Library/Win/win-2.wav'],
        // Loss
        'loss': ['/8bit-SFX-Library/Lose/lose-1.wav'],
        // Fire
        'fire': [
            '/8bit-SFX-Library/Shoot/gun-1.wav',
            '/8bit-SFX-Library/Shoot/gun-2.wav',
            '/8bit-SFX-Library/Shoot/gun-3.wav',
            '/8bit-SFX-Library/Shoot/gun-4.wav',
            '/8bit-SFX-Library/Shoot/gun-5.wav',
        ],
        // Laser
        'laser': [
            '/8bit-SFX-Library/Shoot/laser-1.wav',
            '/8bit-SFX-Library/Shoot/laser-2.wav',
            '/8bit-SFX-Library/Shoot/laser-3.wav',
            '/8bit-SFX-Library/Shoot/laser-4.wav',
            '/8bit-SFX-Library/Shoot/laser-5.wav',
            '/8bit-SFX-Library/Shoot/laser-6.wav',
            '/8bit-SFX-Library/Shoot/laser-7.wav',
            '/8bit-SFX-Library/Shoot/laser-8.wav',
            '/8bit-SFX-Library/Shoot/laser-9.wav',
        ],
    };

    private static instance: SoundManager;

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private constructor() {
        this.preloadSounds();
    }

    private preloadSounds() {
        for (const [key, paths] of Object.entries(this.soundMap)) {
            const audioElements = paths.map(path => {
                const audio = new Audio(path);
                audio.volume = 0.4;
                return audio;
            });
            this.sounds.set(key, audioElements);
        }
    }

    public setListenerPosition(x: number, y: number) {
        this.listenerX = x;
        this.listenerY = y;
    }

    public play(key: string, volume: number = 0.5, x?: number, y?: number) {
        // Simple debounce to prevent spamming the exact same sound type too fast if needed.
        // For now, allow overlapping.

        const pool = this.sounds.get(key);
        if (!pool || pool.length === 0) return;

        let finalVolume = volume;

        if (x !== undefined && y !== undefined) {
            const dx = x - this.listenerX;
            const dy = y - this.listenerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this.MAX_DISTANCE) {
                return;
            }

            // Linear falloff
            const falloff = 1 - (dist / this.MAX_DISTANCE);
            finalVolume = volume * falloff;
        }

        // Pick a random variant
        const audio = pool[Math.floor(Math.random() * pool.length)];

        // reset current time to allow replay even if handling same instance
        // Note: To allow true overlapping of the *same file*, we'd need to cloneNode.
        // `new Audio` is effectively a clone. 
        // Optimization: if we just have a pool of elements, we can find one that is paused.
        // However, cloning is safer for overlapping explosions.

        const clone = audio.cloneNode() as HTMLAudioElement;
        clone.volume = Math.max(0, Math.min(1, finalVolume));
        clone.play().catch(() => {
            // Autoplay policy might block this until user interaction
            // console.warn("Audio play failed"); 
        });
    }
}
