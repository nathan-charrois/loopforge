export type SynthEnvelope = {
  attack: number
  decay: number
  sustain: number
  release: number
}

export type SynthOscillatorWaveform
  = | 'sine'
    | 'triangle'
    | 'sawtooth'
    | 'square'

export type SynthOscillator = {
  waveform: SynthOscillatorWaveform
  octave: number
  semitone: number
  detuneCents: number
  level: number
}

export type SynthFilterType
  = | 'lowpass'
    | 'highpass'
    | 'bandpass'

export type SynthFilter = {
  type: SynthFilterType
  cutoffHz: number
  resonance: number
}
