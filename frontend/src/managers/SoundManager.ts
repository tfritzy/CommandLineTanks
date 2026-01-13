import { toAudio, type JsfxrParams } from '../lib/jsfxr/sfxr';
import selfDamage from '../sounds/self-damage.json';
import enemyDamage from '../sounds/enemy-damage.json';
import projectileHit from '../sounds/projectile-hit.json';
import explosion from '../sounds/explosion.json';
import pickupWeapon from '../sounds/pickup-weapon.json';
import pickupHealth from '../sounds/pickup-health.json';
import pickupShield from '../sounds/pickup-shield.json';
import shieldPop from '../sounds/shield-pop.json';
import weaponEmpty from '../sounds/weapon-empty.json';
import weaponSwitch from '../sounds/weapon-switch.json';
import terrainDestroy from '../sounds/terrain-destroy.json';
import death from '../sounds/death.json';
import kill from '../sounds/kill.json';
import fire from '../sounds/fire.json';
import win from '../sounds/win.json';
import loss from '../sounds/loss.json';

export class SoundManager {
    private audioContext: AudioContext | null = null;
    private activeSources: Map<string, AudioBufferSourceNode[]> = new Map();
    private readonly MAX_CONCURRENT_PER_SOUND = 5;
    private listenerX: number = 0;
    private listenerY: number = 0;
    private readonly MAX_DISTANCE = 15;
    private preGeneratedBuffers: Map<string, AudioBuffer> = new Map();

    private soundParams: Record<string, { params: JsfxrParams, volume?: number }> = {
        'self-damage': {
            params: selfDamage as JsfxrParams
        },
        'enemy-damage': {
            params: enemyDamage as JsfxrParams,
            volume: 1,
        },
        'projectile-hit': {
            params: projectileHit as JsfxrParams
        },
        'explosion': {
            params: explosion as JsfxrParams
        },
        'pickup-weapon': {
            params: pickupWeapon as JsfxrParams
        },
        'pickup-health': {
            params: pickupHealth as JsfxrParams
        },
        'pickup-shield': {
            params: pickupShield as JsfxrParams
        },
        'shield-pop': {
            params: shieldPop as JsfxrParams
        },
        'weapon-empty': {
            params: weaponEmpty as JsfxrParams
        },
        'weapon-switch': {
            params: weaponSwitch as JsfxrParams
        },
        'terrain-destroy': {
            params: terrainDestroy as JsfxrParams
        },
        'death': {
            params: death as JsfxrParams
        },
        'kill': {
            params: kill as JsfxrParams
        },
        'fire': {
            params: fire as JsfxrParams,
            volume: 1
        },
        'win': {
            params: win as JsfxrParams
        },
        'loss': {
            params: loss as JsfxrParams
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
            this.preGenerateSounds();
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }

    private preGenerateSounds() {
        if (!this.audioContext) return;

        for (const [key, config] of Object.entries(this.soundParams)) {
            try {
                const audio = toAudio(config.params);
                const audioBuffer = this.audioContext.createBuffer(
                    1,
                    audio.buffer.length,
                    config.params.sample_rate || 44100
                );
                const channelData = audioBuffer.getChannelData(0);
                for (let i = 0; i < audio.buffer.length; i++) {
                    channelData[i] = audio.buffer[i] / 255 * 2 - 1;
                }
                this.preGeneratedBuffers.set(key, audioBuffer);
            } catch (e) {
                console.error(`Failed to generate sound: ${key}`, e);
            }
        }
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

        const config = this.soundParams[key];
        if (!config) return;

        const baseBuffer = this.preGeneratedBuffers.get(key);
        if (!baseBuffer) return;

        let active = this.activeSources.get(key);
        if (!active) {
            active = [];
            this.activeSources.set(key, active);
        }

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

        const volumeVar = 0.95 + Math.random() * 0.1;
        const pitchVar = 0.9 + Math.random() * 0.2;

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = baseBuffer;
            source.playbackRate.value = pitchVar;

            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = Math.max(0, Math.min(1, finalVolume * volumeVar));

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

            source.start(0);
        } catch (e) {
            console.error(`Failed to play sound: ${key}`, e);
        }
    }
}
