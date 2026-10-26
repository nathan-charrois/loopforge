import type {
  AudioExportBitDepth,
  AudioExportChannels,
} from './exportAudio'

type WaveEncodingSettings = {
  bitDepth: AudioExportBitDepth
  channels: AudioExportChannels
  normalize: boolean
}

const WAVE_FORMAT_PCM = 1

export function encodeWaveAudio(
  buffer: AudioBuffer,
  settings: WaveEncodingSettings,
): ArrayBuffer {
  const channels = getOutputChannels(buffer, settings.channels)
  const normalizationGain = settings.normalize
    ? getNormalizationGain(channels)
    : 1
  const bytesPerSample = settings.bitDepth / 8
  const dataLength = buffer.length * channels.length * bytesPerSample
  const contents = new ArrayBuffer(44 + dataLength)
  const view = new DataView(contents)

  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, WAVE_FORMAT_PCM, true)
  view.setUint16(22, channels.length, true)
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(
    28,
    buffer.sampleRate * channels.length * bytesPerSample,
    true,
  )
  view.setUint16(32, channels.length * bytesPerSample, true)
  view.setUint16(34, settings.bitDepth, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  let offset = 44

  for (let frame = 0; frame < buffer.length; frame += 1) {
    for (const channel of channels) {
      const sample = clampSample(channel[frame] * normalizationGain)

      if (settings.bitDepth === 16) {
        const value = sample < 0
          ? Math.round(sample * 0x8000)
          : Math.round(sample * 0x7fff)

        view.setInt16(offset, value, true)
      }
      else {
        const value = sample < 0
          ? Math.round(sample * 0x800000)
          : Math.round(sample * 0x7fffff)

        view.setUint8(offset, value & 0xff)
        view.setUint8(offset + 1, (value >> 8) & 0xff)
        view.setUint8(offset + 2, (value >> 16) & 0xff)
      }

      offset += bytesPerSample
    }
  }

  return contents
}

function getOutputChannels(
  buffer: AudioBuffer,
  channels: AudioExportChannels,
): Float32Array[] {
  const left = buffer.getChannelData(0)
  const right = buffer.numberOfChannels > 1
    ? buffer.getChannelData(1)
    : left

  if (channels === 'stereo') {
    return [left, right]
  }

  const mono = new Float32Array(buffer.length)

  for (let frame = 0; frame < buffer.length; frame += 1) {
    mono[frame] = (left[frame] + right[frame]) / 2
  }

  return [mono]
}

function getNormalizationGain(channels: readonly Float32Array[]): number {
  let peak = 0

  for (const channel of channels) {
    for (const sample of channel) {
      peak = Math.max(peak, Math.abs(sample))
    }
  }

  if (peak === 0) {
    return 1
  }

  const targetPeak = 10 ** (-1 / 20)

  return targetPeak / peak
}

function clampSample(sample: number): number {
  return Math.max(-1, Math.min(1, sample))
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index))
  }
}
