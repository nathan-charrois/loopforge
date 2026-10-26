import { AudioEngine } from './audioEngine'
import { encodeWaveAudio } from './wavEncoder'
import type { Tick } from '~/domain'
import {
  buildSchedule,
  type PlaybackTrigger,
} from '~/playback/buildSchedule'
import { createTimelineClock } from '~/playback/timelineClock'
import { validateWorkspace, type Workspace } from '~/store/workspace'

export const AUDIO_EXPORT_BIT_DEPTHS = [16, 24] as const
export const AUDIO_EXPORT_CHANNELS = ['stereo', 'mono'] as const
export const AUDIO_EXPORT_FORMATS = ['wav'] as const
export const AUDIO_EXPORT_SAMPLE_RATES = [44100, 48000] as const

export type AudioExportBitDepth = typeof AUDIO_EXPORT_BIT_DEPTHS[number]
export type AudioExportChannels = typeof AUDIO_EXPORT_CHANNELS[number]
export type AudioExportFormat = typeof AUDIO_EXPORT_FORMATS[number]
export type AudioExportSampleRate = typeof AUDIO_EXPORT_SAMPLE_RATES[number]

export type AudioExportSettings = {
  bitDepth: AudioExportBitDepth
  channels: AudioExportChannels
  endTick: Tick
  format: AudioExportFormat
  normalize: boolean
  sampleRate: AudioExportSampleRate
  startTick: Tick
  tailSeconds: number
}

export type AudioExportResult = {
  durationSeconds: number
  fileName: string
}

export function createDefaultAudioExportSettings(
  endTick: Tick,
): AudioExportSettings {
  return {
    bitDepth: 24,
    channels: 'stereo',
    endTick,
    format: 'wav',
    normalize: false,
    sampleRate: 48000,
    startTick: 0,
    tailSeconds: 2,
  }
}

export function validateAudioExportSettings(
  settings: AudioExportSettings,
): string[] {
  const errors: string[] = []

  if (!Number.isInteger(settings.startTick) || settings.startTick < 0) {
    errors.push('Start tick must be a non-negative integer.')
  }

  if (!Number.isInteger(settings.endTick) || settings.endTick <= settings.startTick) {
    errors.push('End tick must be an integer after the start tick.')
  }

  if (!Number.isFinite(settings.tailSeconds) || settings.tailSeconds < 0 || settings.tailSeconds > 30) {
    errors.push('Effect tail must be between 0 and 30 seconds.')
  }

  if (!(AUDIO_EXPORT_SAMPLE_RATES as readonly number[]).includes(settings.sampleRate)) {
    errors.push('Sample rate must be 44.1 or 48 kHz.')
  }

  if (!(AUDIO_EXPORT_BIT_DEPTHS as readonly number[]).includes(settings.bitDepth)) {
    errors.push('Bit depth must be 16-bit or 24-bit PCM.')
  }

  if (!(AUDIO_EXPORT_CHANNELS as readonly string[]).includes(settings.channels)) {
    errors.push('Channel layout must be stereo or mono.')
  }

  if (!(AUDIO_EXPORT_FORMATS as readonly string[]).includes(settings.format)) {
    errors.push('Export format must be WAV.')
  }

  return errors
}

export function getAudioExportDurationSeconds(
  workspace: Workspace,
  settings: AudioExportSettings,
): number {
  const clock = createTimelineClock(workspace.timeline)

  return clock.getSecondsBetweenTicks(settings.startTick, settings.endTick)
    + settings.tailSeconds
}

export async function exportWorkspaceAudio(
  workspace: Workspace,
  settings: AudioExportSettings,
  signal?: AbortSignal,
): Promise<AudioExportResult> {
  throwIfAborted(signal)

  const workspaceErrors = validateWorkspace(workspace)
  const settingErrors = validateAudioExportSettings(settings)
  const errors = [...workspaceErrors, ...settingErrors]

  if (errors.length > 0) {
    throw new Error(errors[0])
  }

  if (typeof OfflineAudioContext === 'undefined') {
    throw new Error('Offline audio export is not supported by this browser.')
  }

  const durationSeconds = getAudioExportDurationSeconds(workspace, settings)
  const frameCount = Math.max(1, Math.ceil(durationSeconds * settings.sampleRate))
  const context = new OfflineAudioContext(2, frameCount, settings.sampleRate)
  const audioEngine = new AudioEngine(context)

  try {
    audioEngine.loadWorkspace(workspace)
    await audioEngine.initialize()
    throwIfAborted(signal)
    scheduleExportRange(audioEngine, workspace, settings)

    const renderedBuffer = await context.startRendering()

    throwIfAborted(signal)

    const contents = encodeWaveAudio(renderedBuffer, {
      bitDepth: settings.bitDepth,
      channels: settings.channels,
      normalize: settings.normalize,
    })
    const fileName = `${sanitizeFileName(workspace.project.name)}.${settings.format}`

    downloadBlob(contents, fileName)

    return {
      durationSeconds,
      fileName,
    }
  }
  finally {
    await audioEngine.dispose()
  }
}

function scheduleExportRange(
  audioEngine: AudioEngine,
  workspace: Workspace,
  settings: AudioExportSettings,
): void {
  const schedule = buildSchedule(workspace)
  const clock = createTimelineClock(workspace.timeline)

  for (const trigger of getExportTriggers(schedule.triggers, settings.startTick, settings.endTick)) {
    const startsBeforeRange = trigger.startTick < settings.startTick
    const whenSeconds = startsBeforeRange
      ? 0
      : clock.getSecondsBetweenTicks(settings.startTick, trigger.startTick)
    const durationSeconds = trigger.kind === 'note'
      ? clock.getSecondsBetweenTicks(
          Math.max(settings.startTick, trigger.startTick),
          Math.min(settings.endTick, trigger.startTick + trigger.durationTicks),
        )
      : undefined

    audioEngine.scheduleTrigger({
      durationSeconds,
      trigger,
      whenSeconds,
    })
  }
}

function getExportTriggers(
  triggers: readonly PlaybackTrigger[],
  startTick: Tick,
  endTick: Tick,
): PlaybackTrigger[] {
  const automationAtStart = new Map<string, PlaybackTrigger>()
  const triggersInRange: PlaybackTrigger[] = []

  for (const trigger of triggers) {
    if (trigger.startTick >= endTick) {
      break
    }

    if (trigger.startTick >= startTick) {
      triggersInRange.push(trigger)
      continue
    }

    if (trigger.kind === 'automation') {
      automationAtStart.set(
        `${trigger.source.mixChannelId}:${trigger.parameter}`,
        trigger,
      )
    }
    else if (
      trigger.kind === 'note'
      && trigger.startTick + trigger.durationTicks > startTick
    ) {
      triggersInRange.push(trigger)
    }
  }

  return [...automationAtStart.values(), ...triggersInRange]
}

function sanitizeFileName(projectName: string): string {
  const sanitized = projectName
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  return sanitized || 'loopforge-export'
}

function downloadBlob(contents: BlobPart, fileName: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: 'audio/wav' }))
  const link = document.createElement('a')

  link.download = fileName
  link.href = url
  document.body.append(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new DOMException('Export cancelled.', 'AbortError')
  }
}
