export class SoundManager {
    private sounds: Map<string, HTMLAudioElement[]> = new Map();
    private activeSounds: Map<string, HTMLAudioElement[]> = new Map();
    private readonly MAX_CONCURRENT_PER_SOUND = 5;
    private listenerX: number = 0;
    private listenerY: number = 0;
    private readonly MAX_DISTANCE = 15; // Tiles

    private soundMap: Record<string, { paths: string[], volume?: number }> = {
        'self-damage': {
            paths: ['/8bit-SFX-Library/Collide/hit-6.wav'],
        },
        'enemy-damage': {
            paths: ['/8bit-SFX-Library/Player/footstep.wav'],
            volume: 0.2,
        },
        'projectile-hit': {
            paths: ['/8bit-SFX-Library/Player/landing.wav'],
        },
        'explosion': {
            paths: [
                '/8bit-SFX-Library/Collide/explode-1.wav',
            ],
        },
        'pickup-weapon': { paths: ['/8bit-SFX-Library/Collect/coin-4.wav'] },
        'pickup-health': { paths: ['/8bit-SFX-Library/Win/win-2.wav'] },
        'pickup-shield': { paths: ['/8bit-SFX-Library/Player/jump-10.wav'] },
        'shield-pop': { paths: ['/8bit-SFX-Library/Shoot/laser-4.wav'] },
        'weapon-empty': { paths: ['/8bit-SFX-Library/UI/cancel-3.wav'] },
        'weapon-switch': { paths: ['/8bit-SFX-Library/UI/blip-2.wav'] },
        'terrain-destroy': {
            paths: [
                '/8bit-SFX-Library/Collide/bonk-6.wav'
            ],
        },
        'death': { paths: ['/8bit-SFX-Library/Lose/lose-10.wav'] },
        'kill': { paths: ['/8bit-SFX-Library/Collide/explode-2.wav'] },
        'fire': {
            paths: [
                '/8bit-SFX-Library/Collide/bonk-6.wav',
            ],
            volume: .7
        },
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
        for (const [key, config] of Object.entries(this.soundMap)) {
            const audioElements = config.paths.map(path => {
                const audio = new Audio(path);
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
        const pool = this.sounds.get(key);
        if (!pool || pool.length === 0) return;

        let active = this.activeSounds.get(key);
        if (!active) {
            active = [];
            this.activeSounds.set(key, active);
        }

        const config = this.soundMap[key];
        const baseVolume = config?.volume ?? 1.0;
        let finalVolume = volume * baseVolume;

        if (x !== undefined && y !== undefined) {
            const dx = x - this.listenerX;
            const dy = y - this.listenerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this.MAX_DISTANCE) {
                return;
            }

            // Linear falloff
            const falloff = 1 - (dist / this.MAX_DISTANCE);
            finalVolume *= falloff;
        }

        // Pick a random variant
        const audio = pool[Math.floor(Math.random() * pool.length)];

        // reset current time to allow replay even if handling same instance
        // Note: To allow true overlapping of the *same file*, we'd need to cloneNode.
        // `new Audio` is effectively a clone. 
        // Optimization: if we just have a pool of elements, we can find one that is paused.
        // However, cloning is safer for overlapping explosions.

        const clone = audio.cloneNode() as HTMLAudioElement;

        // Randomize volume slightly (±10%)
        const volumeVar = 0.95 + Math.random() * 0.1;
        clone.volume = Math.max(0, Math.min(1, finalVolume * volumeVar));

        // Randomize pitch (playback rate)
        // A range of 0.9 to 1.1 is usually safe for subtle variation without sounding weird
        const pitchVar = 0.9 + Math.random() * 0.2;
        clone.playbackRate = pitchVar;
        // @ts-ignore - preservesPitch might not be in all TS versions but is supported in modern browsers
        clone.preservesPitch = false;

        // If we're at the limit, stop the oldest sound to make room for the new one
        if (active.length >= this.MAX_CONCURRENT_PER_SOUND) {
            const oldest = active.shift();
            if (oldest) {
                oldest.pause();
                oldest.removeAttribute('src');
                oldest.load();
            }
        }

        active.push(clone);

        const cleanup = () => {
            const index = active!.indexOf(clone);
            if (index !== -1) {
                const lastIndex = active!.length - 1;
                if (index !== lastIndex) {
                    active![index] = active![lastIndex];
                }
                active!.length = lastIndex;
            }
            clone.removeEventListener('ended', cleanup);
            clone.removeEventListener('error', cleanup);
            clone.pause();
            clone.removeAttribute('src');
            clone.load();
        };

        clone.addEventListener('ended', cleanup);
        clone.addEventListener('error', cleanup);

        clone.play().catch(() => {
            cleanup();
        });
    }
}
