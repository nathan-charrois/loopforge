import {
  DEFAULT_MASTER_VOLUME_DB,
  DEFAULT_MIX_CHANNEL_PAN,
  DEFAULT_MIX_CHANNEL_VOLUME_DB,
} from './constants'
import type {
  MasterMixChannel,
  MixChannel,
  MixChannelId,
  Mixer,
} from './mixer'
import { createEmptyEntityStore } from '~/store/type'

export function createMixChannel(input: {
  id: MixChannelId
  muted?: boolean
  pan?: number
  soloed?: boolean
  volumeDb?: number
}): MixChannel {
  return {
    id: input.id,
    muted: input.muted ?? false,
    pan: input.pan ?? DEFAULT_MIX_CHANNEL_PAN,
    soloed: input.soloed ?? false,
    volumeDb: input.volumeDb ?? DEFAULT_MIX_CHANNEL_VOLUME_DB,
  }
}

export function createMasterMixChannel(
  input: Partial<MasterMixChannel> = {},
): MasterMixChannel {
  return {
    muted: input.muted ?? false,
    volumeDb: input.volumeDb ?? DEFAULT_MASTER_VOLUME_DB,
  }
}

export function createMixer(input: Partial<Mixer> = {}): Mixer {
  return {
    channels: input.channels ?? createEmptyEntityStore<MixChannel>(),
    master: createMasterMixChannel(input.master),
  }
}

export function createMixChannelIdForTrack(trackId: string): MixChannelId {
  return `mix_channel_${trackId}`
}
