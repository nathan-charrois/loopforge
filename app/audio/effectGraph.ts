import { isSidechainCompressorPrepared } from './sidechainCompressor'
import type {
  CompressorEffect,
  DelayEffect,
  Effect,
  EffectId,
  EqEffect,
  ReverbEffect,
} from '~/domain'

export type EffectGraph = {
  effectId: EffectId
  input: AudioNode
  output: AudioNode
  sidechainInput?: AudioNode
  update: (effect: Effect) => void
  dispose: () => void
}

const MAX_DELAY_SECONDS = 5
const MAX_REVERB_DECAY_SECONDS = 30

export function createEffectGraph(
  context: BaseAudioContext,
  effect: Effect,
): EffectGraph {
  switch (effect.kind) {
    case 'eq':
      return createEqEffectGraph(context, effect)
    case 'compressor':
      return createCompressorEffectGraph(context, effect)
    case 'delay':
      return createDelayEffectGraph(context, effect)
    case 'reverb':
      return createReverbEffectGraph(context, effect)
  }
}

function createEqEffectGraph(
  context: BaseAudioContext,
  effect: EqEffect,
): EffectGraph {
  const input = context.createGain()
  const output = context.createGain()
  const lowShelf = context.createBiquadFilter()
  const param1 = context.createBiquadFilter()
  const param2 = context.createBiquadFilter()
  const highShelf = context.createBiquadFilter()

  lowShelf.type = 'lowshelf'
  param1.type = 'peaking'
  param2.type = 'peaking'
  highShelf.type = 'highshelf'

  lowShelf.connect(param1)
  param1.connect(param2)
  param2.connect(highShelf)
  highShelf.connect(output)

  return createRoutableEffectGraph({
    connectEnabled: () => input.connect(lowShelf),
    effect,
    input,
    nodes: [lowShelf, param1, param2, highShelf],
    output,
    updateParameters: (nextEffect) => {
      const maximumFrequency = context.sampleRate / 2

      setAudioParam(context, lowShelf.frequency, clamp(nextEffect.lowShelfFrequencyHz, 10, maximumFrequency))
      setAudioParam(context, lowShelf.gain, clamp(nextEffect.lowShelfGainDb, -40, 40))
      setAudioParam(context, lowShelf.Q, clamp(nextEffect.lowShelfQ, 0.0001, 1000))
      setAudioParam(context, param1.frequency, clamp(nextEffect.param1FrequencyHz, 10, maximumFrequency))
      setAudioParam(context, param1.gain, clamp(nextEffect.param1GainDb, -40, 40))
      setAudioParam(context, param1.Q, clamp(nextEffect.param1Q, 0.0001, 1000))
      setAudioParam(context, param2.frequency, clamp(nextEffect.param2FrequencyHz, 10, maximumFrequency))
      setAudioParam(context, param2.gain, clamp(nextEffect.param2GainDb, -40, 40))
      setAudioParam(context, param2.Q, clamp(nextEffect.param2Q, 0.0001, 1000))
      setAudioParam(context, highShelf.frequency, clamp(nextEffect.highShelfFrequencyHz, 10, maximumFrequency))
      setAudioParam(context, highShelf.gain, clamp(nextEffect.highShelfGainDb, -40, 40))
      setAudioParam(context, highShelf.Q, clamp(nextEffect.highShelfQ, 0.0001, 1000))
    },
  })
}

function createCompressorEffectGraph(
  context: BaseAudioContext,
  effect: CompressorEffect,
): EffectGraph {
  if (effect.sidechainSourceMixChannelId !== undefined) {
    return createSidechainCompressorEffectGraph(context, effect)
  }

  const input = context.createGain()
  const output = context.createGain()
  const compressor = context.createDynamicsCompressor()

  compressor.connect(output)

  return createRoutableEffectGraph({
    connectEnabled: () => input.connect(compressor),
    effect,
    input,
    nodes: [compressor],
    output,
    updateParameters: (nextEffect) => {
      setAudioParam(context, compressor.threshold, clamp(nextEffect.thresholdDb, -100, 0))
      setAudioParam(context, compressor.knee, clamp(nextEffect.kneeDb, 0, 40))
      setAudioParam(context, compressor.ratio, clamp(nextEffect.ratio, 1, 20))
      setAudioParam(context, compressor.attack, clamp(nextEffect.attackSeconds, 0, 1))
      setAudioParam(context, compressor.release, clamp(nextEffect.releaseSeconds, 0, 1))
    },
  })
}

function createSidechainCompressorEffectGraph(
  context: BaseAudioContext,
  effect: CompressorEffect,
): EffectGraph {
  if (!isSidechainCompressorPrepared(context)) {
    throw new Error('Sidechain compressor audio processor is unavailable.')
  }

  const input = context.createGain()
  const output = context.createGain()
  const sidechainInput = context.createGain()
  const compressor = new AudioWorkletNode(
    context,
    'loopforge-sidechain-compressor',
    {
      numberOfInputs: 2,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    },
  )

  sidechainInput.connect(compressor, 0, 1)
  compressor.connect(output)

  return {
    ...createRoutableEffectGraph({
      connectEnabled: () => input.connect(compressor, 0, 0),
      effect,
      input,
      nodes: [compressor, sidechainInput],
      output,
      updateParameters: (nextEffect) => {
        setWorkletParameter(context, compressor, 'thresholdDb', clamp(nextEffect.thresholdDb, -100, 0))
        setWorkletParameter(context, compressor, 'kneeDb', clamp(nextEffect.kneeDb, 0, 40))
        setWorkletParameter(context, compressor, 'ratio', clamp(nextEffect.ratio, 1, 20))
        setWorkletParameter(context, compressor, 'attackSeconds', clamp(nextEffect.attackSeconds, 0, 1))
        setWorkletParameter(context, compressor, 'releaseSeconds', clamp(nextEffect.releaseSeconds, 0, 1))
      },
    }),
    sidechainInput,
  }
}

function createDelayEffectGraph(
  context: BaseAudioContext,
  effect: DelayEffect,
): EffectGraph {
  const input = context.createGain()
  const output = context.createGain()
  const delay = context.createDelay(MAX_DELAY_SECONDS)
  const dry = context.createGain()
  const feedback = context.createGain()
  const wet = context.createGain()
  let wetLevel = effect.wet

  dry.connect(output)
  delay.connect(wet)
  delay.connect(feedback)
  feedback.connect(delay)
  wet.connect(output)

  return createRoutableEffectGraph({
    connectEnabled: () => {
      input.connect(dry)
      input.connect(delay)
    },
    effect,
    input,
    nodes: [delay, dry, feedback, wet],
    onEnabledChange: (enabled) => {
      dry.gain.value = enabled ? 1 : 0
      wet.gain.value = enabled ? wetLevel : 0
    },
    output,
    updateParameters: (nextEffect) => {
      wetLevel = clamp(nextEffect.wet, 0, 1)
      setAudioParam(context, delay.delayTime, clamp(nextEffect.delaySeconds, 0, MAX_DELAY_SECONDS))
      setAudioParam(context, feedback.gain, clamp(nextEffect.feedback, 0, 0.99))
    },
  })
}

function createReverbEffectGraph(
  context: BaseAudioContext,
  effect: ReverbEffect,
): EffectGraph {
  const input = context.createGain()
  const output = context.createGain()
  const convolver = context.createConvolver()
  const dry = context.createGain()
  const preDelay = context.createDelay(MAX_DELAY_SECONDS)
  const wet = context.createGain()
  let currentDecaySeconds: number | undefined
  let wetLevel = effect.wet

  dry.connect(output)
  preDelay.connect(convolver)
  convolver.connect(wet)
  wet.connect(output)

  return createRoutableEffectGraph({
    connectEnabled: () => {
      input.connect(dry)
      input.connect(preDelay)
    },
    effect,
    input,
    nodes: [convolver, dry, preDelay, wet],
    onEnabledChange: (enabled) => {
      dry.gain.value = enabled ? 1 : 0
      wet.gain.value = enabled ? wetLevel : 0
    },
    output,
    updateParameters: (nextEffect) => {
      const decaySeconds = clamp(
        nextEffect.decaySeconds,
        0.01,
        MAX_REVERB_DECAY_SECONDS,
      )

      wetLevel = clamp(nextEffect.wet, 0, 1)
      setAudioParam(
        context,
        preDelay.delayTime,
        clamp(nextEffect.preDelaySeconds, 0, MAX_DELAY_SECONDS),
      )

      if (decaySeconds !== currentDecaySeconds) {
        convolver.buffer = createReverbImpulseResponse(context, decaySeconds)
        currentDecaySeconds = decaySeconds
      }
    },
  })
}

function createRoutableEffectGraph<TEffect extends Effect>(input: {
  connectEnabled: () => void
  effect: TEffect
  input: GainNode
  nodes: AudioNode[]
  onEnabledChange?: (enabled: boolean) => void
  output: GainNode
  updateParameters: (effect: TEffect) => void
}): EffectGraph {
  const effectId = input.effect.id
  const effectKind = input.effect.kind
  let disposed = false
  let enabled = input.effect.enabled !== false

  const connectInput = () => {
    input.input.disconnect()
    input.onEnabledChange?.(enabled)

    if (enabled) {
      input.connectEnabled()
    }
    else {
      input.input.connect(input.output)
    }
  }

  input.updateParameters(input.effect)
  connectInput()

  return {
    effectId,
    input: input.input,
    output: input.output,
    dispose: () => {
      if (disposed) {
        return
      }

      disposed = true
      input.input.disconnect()
      input.output.disconnect()

      for (const node of input.nodes) {
        node.disconnect()
      }
    },
    update: (effect) => {
      if (disposed) {
        return
      }

      if (effect.id !== effectId || effect.kind !== effectKind) {
        throw new Error(`Effect graph ${effectId} cannot update from effect ${effect.id}.`)
      }

      const nextEffect = effect as TEffect
      const nextEnabled = nextEffect.enabled !== false

      input.updateParameters(nextEffect)
      input.onEnabledChange?.(nextEnabled)

      if (enabled !== nextEnabled) {
        enabled = nextEnabled
        connectInput()
      }
    },
  }
}

function createReverbImpulseResponse(
  context: BaseAudioContext,
  decaySeconds: number,
): AudioBuffer {
  const length = Math.max(1, Math.ceil(context.sampleRate * decaySeconds))
  const impulse = context.createBuffer(2, length, context.sampleRate)

  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel)

    for (let index = 0; index < length; index += 1) {
      const envelope = (1 - index / length) ** 2
      data[index] = (Math.random() * 2 - 1) * envelope
    }
  }

  return impulse
}

function setAudioParam(
  context: BaseAudioContext,
  parameter: AudioParam,
  value: number,
): void {
  parameter.setValueAtTime(value, context.currentTime)
}

function setWorkletParameter(
  context: BaseAudioContext,
  node: AudioWorkletNode,
  name: string,
  value: number,
): void {
  node.parameters.get(name)?.setValueAtTime(value, context.currentTime)
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return minimum
  }

  return Math.max(minimum, Math.min(maximum, value))
}
