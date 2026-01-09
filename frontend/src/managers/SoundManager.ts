export class SoundManager {
    private audioContext: AudioContext | null = null;
    private buffers: Map<string, AudioBuffer[]> = new Map();
    private activeSources: Map<string, AudioBufferSourceNode[]> = new Map();
    private readonly MAX_CONCURRENT_PER_SOUND = 5;
    private listenerX: number = 0;
    private listenerY: number = 0;
    private readonly MAX_DISTANCE = 15;
    private isLoading: boolean = false;

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
        this.initAudioContext();
    }

    private initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.preloadSounds();
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }

    private async preloadSounds() {
        if (!this.audioContext || this.isLoading) return;
        
        this.isLoading = true;
        const loadPromises: Promise<void>[] = [];

        for (const [key, config] of Object.entries(this.soundMap)) {
            const bufferPromises = config.paths.map(async (path) => {
                try {
                    const response = await fetch(path);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
                    return audioBuffer;
                } catch (error) {
                    console.error(`Failed to load sound: ${path}`, error);
                    return null;
                }
            });

            const promise = Promise.all(bufferPromises).then(buffers => {
                const validBuffers = buffers.filter((b): b is AudioBuffer => b !== null);
                if (validBuffers.length > 0) {
                    this.buffers.set(key, validBuffers);
                }
            });

            loadPromises.push(promise);
        }

        await Promise.all(loadPromises);
        this.isLoading = false;
    }

    public setListenerPosition(x: number, y: number) {
        this.listenerX = x;
        this.listenerY = y;
    }

    public play(key: string, volume: number = 0.5, x?: number, y?: number) {
        if (!this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const bufferPool = this.buffers.get(key);
        if (!bufferPool || bufferPool.length === 0) return;

        let active = this.activeSources.get(key);
        if (!active) {
            active = [];
            this.activeSources.set(key, active);
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

            const falloff = 1 - (dist / this.MAX_DISTANCE);
            finalVolume *= falloff;
        }

        const buffer = bufferPool[Math.floor(Math.random() * bufferPool.length)];

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        const volumeVar = 0.95 + Math.random() * 0.1;
        gainNode.gain.value = Math.max(0, Math.min(1, finalVolume * volumeVar));

        const pitchVar = 0.9 + Math.random() * 0.2;
        source.playbackRate.value = pitchVar;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        if (active.length >= this.MAX_CONCURRENT_PER_SOUND) {
            const oldest = active.shift();
            if (oldest) {
                try {
                    oldest.stop();
                } catch (e) {
                }
            }
        }

        active.push(source);

        const cleanup = () => {
            const index = active!.indexOf(source);
            if (index !== -1) {
                const lastIndex = active!.length - 1;
                if (index !== lastIndex) {
                    active![index] = active![lastIndex];
                }
                active!.length = lastIndex;
            }
            source.disconnect();
            gainNode.disconnect();
        };

        source.onended = cleanup;

        try {
            source.start(0);
        } catch (e) {
            cleanup();
        }
    }
}
