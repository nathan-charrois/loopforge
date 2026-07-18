import { MAX_MIX_CHANNEL_PAN, MIN_MIX_CHANNEL_PAN } from './constants'
import type { EntityStore } from '~/store/type'

export type Mixer = {
  channels: EntityStore<MixChannel>
  master: MasterMixChannel
}

export type MasterMixChannel = {
  volumeDb: number
  muted: boolean
}

export type MixChannel = {
  id: MixChannelId
  volumeDb: number
  pan: number
  muted: boolean
  soloed: boolean
}

export type MixChannelId = string

export function decibelsToGain(volumeDb: number): number {
  return 10 ** (volumeDb / 20)
}

export function isMixChannelPan(value: number): boolean {
  return Number.isFinite(value)
    && value >= MIN_MIX_CHANNEL_PAN
    && value <= MAX_MIX_CHANNEL_PAN
}

export function isMixVolumeDb(value: number): boolean {
  return Number.isFinite(value)
}
