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
  const low = context.createBiquadFilter()
  const mid = context.createBiquadFilter()
  const high = context.createBiquadFilter()

  low.type = 'lowshelf'
  mid.type = 'peaking'
  high.type = 'highshelf'

  low.connect(mid)
  mid.connect(high)
  high.connect(output)

  return createRoutableEffectGraph({
    connectEnabled: () => input.connect(low),
    effect,
    input,
    nodes: [low, mid, high],
    output,
    updateParameters: (nextEffect) => {
      const maximumFrequency = context.sampleRate / 2

      setAudioParam(context, low.frequency, clamp(nextEffect.lowFrequencyHz, 10, maximumFrequency))
      setAudioParam(context, low.gain, clamp(nextEffect.lowGainDb, -40, 40))
      setAudioParam(context, mid.frequency, clamp(nextEffect.midFrequencyHz, 10, maximumFrequency))
      setAudioParam(context, mid.gain, clamp(nextEffect.midGainDb, -40, 40))
      setAudioParam(context, mid.Q, clamp(nextEffect.midQ, 0.0001, 1000))
      setAudioParam(context, high.frequency, clamp(nextEffect.highFrequencyHz, 10, maximumFrequency))
      setAudioParam(context, high.gain, clamp(nextEffect.highGainDb, -40, 40))
    },
  })
}

function createCompressorEffectGraph(
  context: BaseAudioContext,
  effect: CompressorEffect,
): EffectGraph {
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

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return minimum
  }

  return Math.max(minimum, Math.min(maximum, value))
}
