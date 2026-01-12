export interface JsfxrParams {
    oldParams?: boolean;
    wave_type?: number;
    p_env_attack?: number;
    p_env_sustain?: number;
    p_env_punch?: number;
    p_env_decay?: number;
    p_base_freq?: number;
    p_freq_limit?: number;
    p_freq_ramp?: number;
    p_freq_dramp?: number;
    p_vib_strength?: number;
    p_vib_speed?: number;
    p_vib_delay?: number;
    p_arp_mod?: number;
    p_arp_speed?: number;
    p_duty?: number;
    p_duty_ramp?: number;
    p_repeat_speed?: number;
    p_pha_offset?: number;
    p_pha_ramp?: number;
    p_lpf_freq?: number;
    p_lpf_ramp?: number;
    p_lpf_resonance?: number;
    p_hpf_freq?: number;
    p_hpf_ramp?: number;
    sound_vol?: number;
    sample_rate?: number;
    sample_size?: number;
}

export interface AudioResult {
    buffer: Uint8Array;
}

export function toAudio(params: JsfxrParams | string): AudioResult;
export function toBuffer(params: JsfxrParams | string): Uint8Array;
export function toWave(params: JsfxrParams | string): { dataURI: string };
export function generate(preset: string): JsfxrParams;
export function b58encode(params: JsfxrParams): string;
export function b58decode(encoded: string): JsfxrParams;
