import { toAudio } from 'jsfxr';

type JsfxrParams = {
    oldParams: boolean;
    wave_type: number;
    p_env_attack: number;
    p_env_sustain: number;
    p_env_punch: number;
    p_env_decay: number;
    p_base_freq: number;
    p_freq_limit: number;
    p_freq_ramp: number;
    p_freq_dramp: number;
    p_vib_strength: number;
    p_vib_speed: number;
    p_arp_mod: number;
    p_arp_speed: number;
    p_duty: number;
    p_duty_ramp: number;
    p_repeat_speed: number;
    p_pha_offset: number;
    p_pha_ramp: number;
    p_lpf_freq: number;
    p_lpf_ramp: number;
    p_lpf_resonance: number;
    p_hpf_freq: number;
    p_hpf_ramp: number;
    sound_vol: number;
    sample_rate: number;
    sample_size: number;
};

export class SoundManager {
    private audioContext: AudioContext | null = null;
    private activeSources: Map<string, AudioBufferSourceNode[]> = new Map();
    private readonly MAX_CONCURRENT_PER_SOUND = 5;
    private listenerX: number = 0;
    private listenerY: number = 0;
    private readonly MAX_DISTANCE = 15;

    private soundParams: Record<string, { params: JsfxrParams, volume?: number }> = {
        'self-damage': {
            params: {
                oldParams: true,
                wave_type: 3,
                p_env_attack: 0,
                p_env_sustain: 0.1,
                p_env_punch: 0.3,
                p_env_decay: 0.3,
                p_base_freq: 0.2,
                p_freq_limit: 0,
                p_freq_ramp: -0.3,
                p_freq_dramp: 0,
                p_vib_strength: 0,
                p_vib_speed: 0,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 1,
                p_lpf_ramp: 0,
                p_lpf_resonance: 0,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.25,
                sample_rate: 44100,
                sample_size: 8
            }
        },
        'enemy-damage': {
            params: {
                oldParams: true,
                wave_type: 3,
                p_env_attack: 0,
                p_env_sustain: 0.05,
                p_env_punch: 0,
                p_env_decay: 0.15,
                p_base_freq: 0.35,
                p_freq_limit: 0,
                p_freq_ramp: -0.2,
                p_freq_dramp: 0,
                p_vib_strength: 0,
                p_vib_speed: 0,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 1,
                p_lpf_ramp: 0,
                p_lpf_resonance: 0,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.15,
                sample_rate: 44100,
                sample_size: 8
            },
            volume: 0.2,
        },
        'projectile-hit': {
            params: {
                oldParams: true,
                wave_type: 0,
                p_env_attack: 0,
                p_env_sustain: 0.08,
                p_env_punch: 0.2,
                p_env_decay: 0.2,
                p_base_freq: 0.25,
                p_freq_limit: 0,
                p_freq_ramp: -0.5,
                p_freq_dramp: 0,
                p_vib_strength: 0,
                p_vib_speed: 0,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 1,
                p_lpf_ramp: 0,
                p_lpf_resonance: 0,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.25,
                sample_rate: 44100,
                sample_size: 8
            }
        },
        'explosion': {
            params: {
                oldParams: true,
                wave_type: 3,
                p_env_attack: 0,
                p_env_sustain: 0.25,
                p_env_punch: 0,
                p_env_decay: 0.4,
                p_base_freq: 0.15,
                p_freq_limit: 0,
                p_freq_ramp: -0.3,
                p_freq_dramp: 0,
                p_vib_strength: 0,
                p_vib_speed: 0,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 1,
                p_lpf_ramp: -0.3,
                p_lpf_resonance: 0.4,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.35,
                sample_rate: 44100,
                sample_size: 8
            }
        },
        'pickup-weapon': {
            params: {
                oldParams: true,
                wave_type: 0,
                p_env_attack: 0,
                p_env_sustain: 0.15,
                p_env_punch: 0.4,
                p_env_decay: 0.3,
                p_base_freq: 0.4,
                p_freq_limit: 0,
                p_freq_ramp: 0.3,
                p_freq_dramp: 0,
                p_vib_strength: 0,
                p_vib_speed: 0,
                p_arp_mod: 0.5,
                p_arp_speed: 0.5,
                p_duty: 0,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 1,
                p_lpf_ramp: 0,
                p_lpf_resonance: 0,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.25,
                sample_rate: 44100,
                sample_size: 8
            }
        },
        'pickup-health': {
            params: {
                oldParams: true,
                wave_type: 0,
                p_env_attack: 0,
                p_env_sustain: 0.2,
                p_env_punch: 0.3,
                p_env_decay: 0.3,
                p_base_freq: 0.5,
                p_freq_limit: 0,
                p_freq_ramp: 0.4,
                p_freq_dramp: 0,
                p_vib_strength: 0.3,
                p_vib_speed: 0.5,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 1,
                p_lpf_ramp: 0,
                p_lpf_resonance: 0,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.25,
                sample_rate: 44100,
                sample_size: 8
            }
        },
        'pickup-shield': {
            params: {
                oldParams: true,
                wave_type: 1,
                p_env_attack: 0,
                p_env_sustain: 0.2,
                p_env_punch: 0.2,
                p_env_decay: 0.3,
                p_base_freq: 0.45,
                p_freq_limit: 0,
                p_freq_ramp: 0.2,
                p_freq_dramp: 0,
                p_vib_strength: 0.2,
                p_vib_speed: 0.4,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0.5,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 1,
                p_lpf_ramp: 0,
                p_lpf_resonance: 0,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.25,
                sample_rate: 44100,
                sample_size: 8
            }
        },
        'shield-pop': {
            params: {
                oldParams: true,
                wave_type: 1,
                p_env_attack: 0,
                p_env_sustain: 0.08,
                p_env_punch: 0,
                p_env_decay: 0.15,
                p_base_freq: 0.6,
                p_freq_limit: 0,
                p_freq_ramp: -0.4,
                p_freq_dramp: 0,
                p_vib_strength: 0,
                p_vib_speed: 0,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0.5,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 1,
                p_lpf_ramp: 0,
                p_lpf_resonance: 0,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.25,
                sample_rate: 44100,
                sample_size: 8
            }
        },
        'weapon-empty': {
            params: {
                oldParams: true,
                wave_type: 0,
                p_env_attack: 0,
                p_env_sustain: 0.05,
                p_env_punch: 0,
                p_env_decay: 0.1,
                p_base_freq: 0.3,
                p_freq_limit: 0,
                p_freq_ramp: 0,
                p_freq_dramp: 0,
                p_vib_strength: 0,
                p_vib_speed: 0,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 0.5,
                p_lpf_ramp: 0,
                p_lpf_resonance: 0,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.2,
                sample_rate: 44100,
                sample_size: 8
            }
        },
        'weapon-switch': {
            params: {
                oldParams: true,
                wave_type: 0,
                p_env_attack: 0,
                p_env_sustain: 0.06,
                p_env_punch: 0,
                p_env_decay: 0.1,
                p_base_freq: 0.5,
                p_freq_limit: 0,
                p_freq_ramp: 0.2,
                p_freq_dramp: 0,
                p_vib_strength: 0,
                p_vib_speed: 0,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 1,
                p_lpf_ramp: 0,
                p_lpf_resonance: 0,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.25,
                sample_rate: 44100,
                sample_size: 8
            }
        },
        'terrain-destroy': {
            params: {
                oldParams: true,
                wave_type: 3,
                p_env_attack: 0,
                p_env_sustain: 0.15,
                p_env_punch: 0.2,
                p_env_decay: 0.25,
                p_base_freq: 0.18,
                p_freq_limit: 0,
                p_freq_ramp: -0.2,
                p_freq_dramp: 0,
                p_vib_strength: 0,
                p_vib_speed: 0,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 0.7,
                p_lpf_ramp: -0.2,
                p_lpf_resonance: 0.3,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.25,
                sample_rate: 44100,
                sample_size: 8
            }
        },
        'death': {
            params: {
                oldParams: true,
                wave_type: 3,
                p_env_attack: 0,
                p_env_sustain: 0.3,
                p_env_punch: 0,
                p_env_decay: 0.5,
                p_base_freq: 0.3,
                p_freq_limit: 0,
                p_freq_ramp: -0.4,
                p_freq_dramp: 0,
                p_vib_strength: 0,
                p_vib_speed: 0,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 0.8,
                p_lpf_ramp: -0.3,
                p_lpf_resonance: 0.3,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.3,
                sample_rate: 44100,
                sample_size: 8
            }
        },
        'kill': {
            params: {
                oldParams: true,
                wave_type: 3,
                p_env_attack: 0,
                p_env_sustain: 0.2,
                p_env_punch: 0.3,
                p_env_decay: 0.4,
                p_base_freq: 0.2,
                p_freq_limit: 0,
                p_freq_ramp: -0.25,
                p_freq_dramp: 0,
                p_vib_strength: 0,
                p_vib_speed: 0,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 0.9,
                p_lpf_ramp: -0.2,
                p_lpf_resonance: 0.4,
                p_hpf_freq: 0,
                p_hpf_ramp: 0,
                sound_vol: 0.3,
                sample_rate: 44100,
                sample_size: 8
            }
        },
        'fire': {
            params: {
                oldParams: true,
                wave_type: 0,
                p_env_attack: 0,
                p_env_sustain: 0.1,
                p_env_punch: 0.3,
                p_env_decay: 0.2,
                p_base_freq: 0.3,
                p_freq_limit: 0,
                p_freq_ramp: -0.2,
                p_freq_dramp: 0,
                p_vib_strength: 0,
                p_vib_speed: 0,
                p_arp_mod: 0,
                p_arp_speed: 0,
                p_duty: 0,
                p_duty_ramp: 0,
                p_repeat_speed: 0,
                p_pha_offset: 0,
                p_pha_ramp: 0,
                p_lpf_freq: 0.8,
                p_lpf_ramp: 0,
                p_lpf_resonance: 0,
                p_hpf_freq: 0.3,
                p_hpf_ramp: 0,
                sound_vol: 0.25,
                sample_rate: 44100,
                sample_size: 8
            },
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
        } catch (e) {
            console.error('Web Audio API not supported', e);
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

        const adjustedParams = { ...config.params };
        adjustedParams.sound_vol = Math.max(0, Math.min(1, finalVolume * volumeVar)) * adjustedParams.sound_vol;
        adjustedParams.p_base_freq *= pitchVar;

        try {
            const audio = toAudio(adjustedParams);
            const audioBuffer = this.audioContext.createBuffer(
                1,
                audio.buffer.length,
                adjustedParams.sample_rate
            );
            const channelData = audioBuffer.getChannelData(0);
            for (let i = 0; i < audio.buffer.length; i++) {
                channelData[i] = audio.buffer[i] / 255 * 2 - 1;
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;

            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 1.0;

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
