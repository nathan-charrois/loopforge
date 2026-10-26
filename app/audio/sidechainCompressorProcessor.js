/* global AudioWorkletProcessor, registerProcessor, sampleRate */

const MIN_LEVEL = 1e-8

class SidechainCompressorProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { defaultValue: -18, maxValue: 0, minValue: -100, name: 'thresholdDb' },
      { defaultValue: 6, maxValue: 40, minValue: 0, name: 'kneeDb' },
      { defaultValue: 4, maxValue: 20, minValue: 1, name: 'ratio' },
      { defaultValue: 0.003, maxValue: 1, minValue: 0, name: 'attackSeconds' },
      { defaultValue: 0.1, maxValue: 1, minValue: 0, name: 'releaseSeconds' },
    ]
  }

  constructor() {
    super()
    this.reductionDb = 0
  }

  process(inputs, outputs, parameters) {
    const program = inputs[0]
    const key = inputs[1]
    const output = outputs[0]
    const frameCount = output[0]?.length ?? 0

    for (let frame = 0; frame < frameCount; frame += 1) {
      const detectorChannels = key.length > 0 ? key : program
      let detectorLevel = 0

      for (const channel of detectorChannels) {
        detectorLevel = Math.max(detectorLevel, Math.abs(channel[frame] ?? 0))
      }

      const thresholdDb = getParameter(parameters.thresholdDb, frame)
      const kneeDb = getParameter(parameters.kneeDb, frame)
      const ratio = getParameter(parameters.ratio, frame)
      const attackSeconds = getParameter(parameters.attackSeconds, frame)
      const releaseSeconds = getParameter(parameters.releaseSeconds, frame)
      const targetReductionDb = getReductionDb(
        detectorLevel,
        thresholdDb,
        kneeDb,
        ratio,
      )
      const smoothingSeconds = targetReductionDb < this.reductionDb
        ? attackSeconds
        : releaseSeconds
      const coefficient = smoothingSeconds <= 0
        ? 0
        : Math.exp(-1 / (smoothingSeconds * sampleRate))

      this.reductionDb = coefficient * this.reductionDb
        + (1 - coefficient) * targetReductionDb

      const gain = 10 ** (this.reductionDb / 20)

      for (let channelIndex = 0; channelIndex < output.length; channelIndex += 1) {
        const inputChannel = program[channelIndex] ?? program[0]
        output[channelIndex][frame] = (inputChannel?.[frame] ?? 0) * gain
      }
    }

    return true
  }
}

function getParameter(values, frame) {
  return values.length === 1 ? values[0] : values[frame]
}

function getReductionDb(level, thresholdDb, kneeDb, ratio) {
  if (level <= MIN_LEVEL || ratio <= 1) {
    return 0
  }

  const inputDb = 20 * Math.log10(level)
  const distanceDb = inputDb - thresholdDb
  let outputDb = inputDb

  if (kneeDb > 0 && Math.abs(distanceDb) <= kneeDb / 2) {
    outputDb = inputDb
      + ((1 / ratio) - 1) * ((distanceDb + kneeDb / 2) ** 2)
      / (2 * kneeDb)
  }
  else if (distanceDb > 0) {
    outputDb = thresholdDb + distanceDb / ratio
  }

  return Math.min(0, outputDb - inputDb)
}

registerProcessor('loopforge-sidechain-compressor', SidechainCompressorProcessor)
