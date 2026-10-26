import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ActionIcon,
  AngleSlider,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'

import {
  createDraftEntityId,
  createEffect,
  type Effect,
  EFFECT_KINDS,
  type EffectKind,
  type Instrument,
  type InstrumentId,
  type MixChannelId,
} from '~/domain'
import type { Dispatch } from '~/store/session'
import {
  addInstrumentEffectAction,
  deleteEffectAction,
  updateEffectAction,
  updateInstrumentAction,
  type Workspace,
} from '~/store/workspace'

type EqEffect = Extract<Effect, { kind: 'eq' }>
type CompressorEffect = Extract<Effect, { kind: 'compressor' }>
type DelayEffect = Extract<Effect, { kind: 'delay' }>
type ReverbEffect = Extract<Effect, { kind: 'reverb' }>

type SidechainSourceOption = {
  label: string
  value: MixChannelId
}

type Props = {
  dispatch: Dispatch
  workspace: Workspace
  selectedInstrumentId?: InstrumentId
}

const ANGLE_MAX = 359
const EQ_GRAPH_HEIGHT = 280
const EQ_GRAPH_WIDTH = 960
const EQ_MAX_DB = 20
const EQ_MIN_DB = -20
const EQ_SAMPLE_RATE = 48000
const MAX_FREQUENCY_HZ = 20000
const MIN_FREQUENCY_HZ = 20
const SIDECHAIN_DISABLED_VALUE = 'none'

const EFFECT_KIND_LABELS: Record<EffectKind, string> = {
  compressor: 'Compressor',
  delay: 'Delay',
  eq: 'EQ',
  reverb: 'Reverb',
}

const EQ_CHART_HZ_MARKS = [
  20,
  50,
  100,
  200,
  500,
  1000,
  2000,
  5000,
  10000,
  20000,
]

const EQ_CHART_GAIN_MARKS = [
  -20,
  -10,
  0,
  10,
  20,
]

const EQ_FREQUENCY_KNOB_MARKS = createLogarithmicMarks(20, 20000, 20)
const EQ_LOW_SHELF_FREQUENCY_KNOB_MARKS = createLogarithmicMarks(20, 1000, 20)
const EQ_HIGH_SHELF_FREQUENCY_KNOB_MARKS = createLogarithmicMarks(1000, 20000, 20)
const EQ_Q_KNOB_MARKS = createLogarithmicMarks(0.1, 12, 20)
const EQ_GAIN_KNOB_MARKS = Array.from(
  { length: 21 },
  (_, index) => (index * 2) - 20,
)

export const EffectsPanel = memo(function EffectsPanel({
  dispatch,
  workspace,
  selectedInstrumentId,
}: Props) {
  if (selectedInstrumentId === undefined) {
    return null
  }

  const instrument = workspace.instruments.byId[selectedInstrumentId]

  if (instrument === undefined) {
    return null
  }

  const effects = instrument.effectIds.flatMap((effectId) => {
    const effect = workspace.effects.byId[effectId]
    return effect === undefined ? [] : [effect]
  })

  return (
    <EffectsPanelContent
      dispatch={dispatch}
      effects={effects}
      instrument={instrument}
      workspace={workspace}
    />
  )
})

const EffectsPanelContent = memo(function EffectsPanelContent({
  dispatch,
  effects,
  instrument,
  workspace,
}: {
  dispatch: Dispatch
  effects: Effect[]
  instrument: Instrument
  workspace: Workspace
}) {
  const targetTrack = workspace.tracks.allIds
    .map(trackId => workspace.tracks.byId[trackId])
    .find(track => track?.instrumentId === instrument.id)
  const sidechainSourceOptions = useMemo<SidechainSourceOption[]>(() => (
    workspace.tracks.allIds.flatMap((trackId) => {
      const track = workspace.tracks.byId[trackId]

      if (
        track === undefined
        || track.mixChannelId === targetTrack?.mixChannelId
        || workspace.mixer.channels.byId[track.mixChannelId] === undefined
      ) {
        return []
      }

      return [{
        label: `${track.name} (${track.role})`,
        value: track.mixChannelId,
      }]
    })
  ), [targetTrack?.mixChannelId, workspace.mixer.channels.byId, workspace.tracks])

  const addEffect = useCallback((kind: EffectKind) => {
    const id = createDraftEntityId(`effect_${kind}`, workspace.effects.allIds)

    dispatch(addInstrumentEffectAction(
      instrument.id,
      createEffect({
        id,
        kind,
        name: `${EFFECT_KIND_LABELS[kind]} ${instrument.effectIds.length + 1}`,
      }),
    ))
  }, [dispatch, instrument.effectIds.length, instrument.id, workspace.effects.allIds])

  const updateEffect = useCallback((effect: Effect) => {
    dispatch(updateEffectAction(effect))
  }, [dispatch])

  const removeEffect = useCallback((effect: Effect) => {
    dispatch(deleteEffectAction([effect.id]))
  }, [dispatch])

  const moveEffect = useCallback((effectIndex: number, direction: -1 | 1) => {
    const destinationIndex = effectIndex + direction

    if (destinationIndex < 0 || destinationIndex >= instrument.effectIds.length) {
      return
    }

    const effectIds = [...instrument.effectIds]
    const [effectId] = effectIds.splice(effectIndex, 1)
    effectIds.splice(destinationIndex, 0, effectId)

    dispatch(updateInstrumentAction({ ...instrument, effectIds }))
  }, [dispatch, instrument])

  return (
    <Paper withBorder radius="sm" p="md" mb="md">
      <Stack gap="md">
        <Group align="flex-start" justify="space-between">
          <Stack gap={2}>
            <Title order={2} size="md">Effects</Title>
            <Text c="dimmed" size="xs">{instrument.name}</Text>
          </Stack>
          <Group gap={6}>
            {EFFECT_KINDS.map(kind => (
              <Button
                key={kind}
                size="compact-xs"
                variant="light"
                onClick={() => addEffect(kind)}
              >
                {`Add ${EFFECT_KIND_LABELS[kind]}`}
              </Button>
            ))}
          </Group>
        </Group>

        <EffectChain effects={effects} />

        {effects.length === 0
          ? <Text c="dimmed" size="sm">No effects in this chain.</Text>
          : null}

        {effects.map((effect, effectIndex) => (
          <EffectCard
            key={effect.id}
            effect={effect}
            effectIndex={effectIndex}
            effectCount={effects.length}
            sidechainSourceOptions={sidechainSourceOptions}
            onMove={moveEffect}
            onRemove={removeEffect}
            onUpdate={updateEffect}
          />
        ))}
      </Stack>
    </Paper>
  )
})

const EffectChain = memo(function EffectChain({ effects }: { effects: Effect[] }) {
  return (
    <Box
      aria-label="Effect chain order"
      style={{ overflowX: 'auto' }}
    >
      <Group gap={6} wrap="nowrap">
        <Badge color="gray" variant="outline">Input</Badge>
        {effects.map((effect, index) => (
          <Group key={effect.id} gap={6} wrap="nowrap">
            <Text c="dimmed" size="xs">→</Text>
            <Badge
              color={effect.enabled ? 'violet' : 'gray'}
              variant={effect.enabled ? 'light' : 'outline'}
            >
              {`${index + 1}. ${EFFECT_KIND_LABELS[effect.kind]}${effect.enabled ? '' : ' (bypassed)'}`}
            </Badge>
          </Group>
        ))}
        <Text c="dimmed" size="xs">→</Text>
        <Badge color="gray" variant="outline">Pan</Badge>
        <Text c="dimmed" size="xs">→</Text>
        <Badge color="gray" variant="outline">Fader</Badge>
      </Group>
    </Box>
  )
})

const EffectCard = memo(function EffectCard({
  effect,
  effectCount,
  effectIndex,
  sidechainSourceOptions,
  onMove,
  onRemove,
  onUpdate,
}: {
  effect: Effect
  effectCount: number
  effectIndex: number
  sidechainSourceOptions: SidechainSourceOption[]
  onMove: (effectIndex: number, direction: -1 | 1) => void
  onRemove: (effect: Effect) => void
  onUpdate: (effect: Effect) => void
}) {
  return (
    <Paper
      withBorder
      bg={effect.enabled ? undefined : 'gray.0'}
      p="md"
      radius="sm"
    >
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge color="violet" variant="filled">{effectIndex + 1}</Badge>
            <Stack gap={0}>
              <Text fw={700} size="sm">{effect.name}</Text>
              <Text c="dimmed" size="xs">
                {`${EFFECT_KIND_LABELS[effect.kind]}${effect.kind === 'compressor' && effect.sidechainSourceMixChannelId !== undefined ? ' · sidechain' : ''}`}
              </Text>
            </Stack>
          </Group>
          <Group gap={6}>
            <Switch
              aria-label={`Bypass ${effect.name}`}
              checked={!effect.enabled}
              label="Bypass"
              size="xs"
              onChange={event => onUpdate({
                ...effect,
                enabled: !event.currentTarget.checked,
              })}
            />
            <Tooltip label="Move earlier">
              <ActionIcon
                aria-label={`Move ${effect.name} earlier`}
                disabled={effectIndex === 0}
                size="sm"
                variant="light"
                onClick={() => onMove(effectIndex, -1)}
              >
                <HugeiconsIcon icon={ArrowUp01Icon} size={15} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Move later">
              <ActionIcon
                aria-label={`Move ${effect.name} later`}
                disabled={effectIndex === effectCount - 1}
                size="sm"
                variant="light"
                onClick={() => onMove(effectIndex, 1)}
              >
                <HugeiconsIcon icon={ArrowDown01Icon} size={15} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Remove effect">
              <ActionIcon
                aria-label={`Remove ${effect.name}`}
                color="red"
                size="sm"
                variant="light"
                onClick={() => onRemove(effect)}
              >
                <HugeiconsIcon icon={Delete01Icon} size={15} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <EffectControls
          effect={effect}
          sidechainSourceOptions={sidechainSourceOptions}
          onUpdate={onUpdate}
        />
      </Stack>
    </Paper>
  )
})

const EffectControls = memo(function EffectControls({
  effect,
  sidechainSourceOptions,
  onUpdate,
}: {
  effect: Effect
  sidechainSourceOptions: SidechainSourceOption[]
  onUpdate: (effect: Effect) => void
}) {
  switch (effect.kind) {
    case 'eq':
      return <EqControls effect={effect} onUpdate={onUpdate} />
    case 'compressor':
      return (
        <CompressorControls
          effect={effect}
          sidechainSourceOptions={sidechainSourceOptions}
          onUpdate={onUpdate}
        />
      )
    case 'delay':
      return <DelayControls effect={effect} onUpdate={onUpdate} />
    case 'reverb':
      return <ReverbControls effect={effect} onUpdate={onUpdate} />
  }
})

const EqControls = memo(function EqControls({
  effect,
  onUpdate,
}: {
  effect: EqEffect
  onUpdate: (effect: Effect) => void
}) {
  return (
    <Stack gap="md">
      <EqResponseGraph effect={effect} />
      <SimpleGrid cols={{ base: 2 }} spacing="md">
        <EqBandControls
          frequencyHz={effect.lowShelfFrequencyHz}
          frequencyMarks={EQ_LOW_SHELF_FREQUENCY_KNOB_MARKS}
          frequencyMax={1000}
          gainDb={effect.lowShelfGainDb}
          label="Low Shelf"
          q={effect.lowShelfQ}
          onFrequencyChange={lowShelfFrequencyHz => onUpdate({ ...effect, lowShelfFrequencyHz })}
          onGainChange={lowShelfGainDb => onUpdate({ ...effect, lowShelfGainDb })}
          onQChange={lowShelfQ => onUpdate({ ...effect, lowShelfQ })}
        />
        <EqBandControls
          frequencyHz={effect.param1FrequencyHz}
          frequencyMarks={EQ_FREQUENCY_KNOB_MARKS}
          frequencyMax={20000}
          gainDb={effect.param1GainDb}
          label="Param 1"
          q={effect.param1Q}
          onFrequencyChange={param1FrequencyHz => onUpdate({ ...effect, param1FrequencyHz })}
          onGainChange={param1GainDb => onUpdate({ ...effect, param1GainDb })}
          onQChange={param1Q => onUpdate({ ...effect, param1Q })}
        />
        <EqBandControls
          frequencyHz={effect.param2FrequencyHz}
          frequencyMarks={EQ_FREQUENCY_KNOB_MARKS}
          frequencyMax={20000}
          gainDb={effect.param2GainDb}
          label="Param 2"
          q={effect.param2Q}
          onFrequencyChange={param2FrequencyHz => onUpdate({ ...effect, param2FrequencyHz })}
          onGainChange={param2GainDb => onUpdate({ ...effect, param2GainDb })}
          onQChange={param2Q => onUpdate({ ...effect, param2Q })}
        />
        <EqBandControls
          frequencyHz={effect.highShelfFrequencyHz}
          frequencyMarks={EQ_HIGH_SHELF_FREQUENCY_KNOB_MARKS}
          frequencyMax={20000}
          frequencyMin={1000}
          gainDb={effect.highShelfGainDb}
          label="High Shelf"
          q={effect.highShelfQ}
          onFrequencyChange={highShelfFrequencyHz => onUpdate({ ...effect, highShelfFrequencyHz })}
          onGainChange={highShelfGainDb => onUpdate({ ...effect, highShelfGainDb })}
          onQChange={highShelfQ => onUpdate({ ...effect, highShelfQ })}
        />
      </SimpleGrid>
    </Stack>
  )
})

const EqBandControls = memo(function EqBandControls({
  frequencyHz,
  frequencyMarks,
  frequencyMax,
  frequencyMin = 20,
  gainDb,
  label,
  onFrequencyChange,
  onGainChange,
  onQChange,
  q,
}: {
  frequencyHz: number
  frequencyMarks: number[]
  frequencyMax: number
  frequencyMin?: number
  gainDb: number
  label: string
  onFrequencyChange: (frequencyHz: number) => void
  onGainChange: (gainDb: number) => void
  onQChange: (q: number) => void
  q: number
}) {
  return (
    <Paper withBorder p="sm" radius="sm">
      <Stack gap="sm">
        <Text fw={600} size="sm" ta="center">{label}</Text>
        <SimpleGrid cols={3} spacing="xs">
          <EffectKnob
            label="Hz"
            marks={frequencyMarks}
            max={frequencyMax}
            min={frequencyMin}
            scale="log"
            unit="Hz"
            value={frequencyHz}
            onChange={onFrequencyChange}
          />
          <EffectKnob
            label="Gain"
            marks={EQ_GAIN_KNOB_MARKS}
            max={20}
            min={-20}
            precision={1}
            unit="dB"
            value={gainDb}
            onChange={onGainChange}
          />
          <EffectKnob
            label="Q"
            marks={EQ_Q_KNOB_MARKS}
            max={12}
            min={0.1}
            precision={2}
            scale="log"
            value={q}
            onChange={onQChange}
          />
        </SimpleGrid>
      </Stack>
    </Paper>
  )
})

const CompressorControls = memo(function CompressorControls({
  effect,
  sidechainSourceOptions,
  onUpdate,
}: {
  effect: CompressorEffect
  sidechainSourceOptions: SidechainSourceOption[]
  onUpdate: (effect: Effect) => void
}) {
  return (
    <Stack gap="md">
      <Select
        allowDeselect={false}
        data={[
          { label: 'Off (compress this track)', value: SIDECHAIN_DISABLED_VALUE },
          ...sidechainSourceOptions,
        ]}
        description={effect.sidechainSourceMixChannelId === undefined
          ? 'The compressor responds to this track normally.'
          : 'When the selected source gets loud, this track ducks.'}
        label="Sidechain from"
        value={effect.sidechainSourceMixChannelId ?? SIDECHAIN_DISABLED_VALUE}
        onChange={value => onUpdate({
          ...effect,
          sidechainSourceMixChannelId: value === SIDECHAIN_DISABLED_VALUE
            ? undefined
            : value ?? undefined,
        })}
      />
      <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="md">
        <EffectKnob
          label="Threshold"
          marks={[-100, -80, -60, -50, -40, -35, -30, -25, -20, -15, -10, -5, 0]}
          max={0}
          min={-100}
          precision={1}
          unit="dB"
          value={effect.thresholdDb}
          onChange={thresholdDb => onUpdate({ ...effect, thresholdDb })}
        />
        <EffectKnob
          label="Knee"
          marks={[0, 5, 10, 15, 20, 25, 30, 35, 40]}
          max={40}
          min={0}
          precision={1}
          unit="dB"
          value={effect.kneeDb}
          onChange={kneeDb => onUpdate({ ...effect, kneeDb })}
        />
        <EffectKnob
          label="Ratio"
          marks={[1, 1.5, 2, 3, 4, 6, 8, 10, 12, 16, 20]}
          max={20}
          min={1}
          precision={1}
          unit=":1"
          value={effect.ratio}
          onChange={ratio => onUpdate({ ...effect, ratio })}
        />
        <EffectKnob
          label="Attack"
          marks={[0.001, 0.003, 0.005, 0.01, 0.02, 0.03, 0.05, 0.1, 0.2, 0.3, 0.5, 1]}
          max={1}
          min={0.001}
          precision={3}
          scale="log"
          unit="s"
          value={effect.attackSeconds}
          onChange={attackSeconds => onUpdate({ ...effect, attackSeconds })}
        />
        <EffectKnob
          label="Release"
          marks={[0.01, 0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.5, 0.75, 1]}
          max={1}
          min={0.01}
          precision={3}
          scale="log"
          unit="s"
          value={effect.releaseSeconds}
          onChange={releaseSeconds => onUpdate({ ...effect, releaseSeconds })}
        />
      </SimpleGrid>
    </Stack>
  )
})

const DelayControls = memo(function DelayControls({
  effect,
  onUpdate,
}: {
  effect: DelayEffect
  onUpdate: (effect: Effect) => void
}) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
      <EffectKnob
        label="Time"
        marks={[0.01, 0.02, 0.05, 0.1, 0.125, 0.2, 0.25, 0.375, 0.5, 0.75, 1, 1.5, 2, 3, 5]}
        max={5}
        min={0.01}
        precision={3}
        scale="log"
        unit="s"
        value={effect.delaySeconds}
        onChange={delaySeconds => onUpdate({ ...effect, delaySeconds })}
      />
      <EffectKnob
        label="Feedback"
        marks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]}
        max={0.95}
        min={0}
        precision={2}
        value={effect.feedback}
        onChange={feedback => onUpdate({ ...effect, feedback })}
      />
      <EffectKnob
        label="Wet"
        marks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]}
        max={1}
        min={0}
        precision={2}
        value={effect.wet}
        onChange={wet => onUpdate({ ...effect, wet })}
      />
    </SimpleGrid>
  )
})

const ReverbControls = memo(function ReverbControls({
  effect,
  onUpdate,
}: {
  effect: ReverbEffect
  onUpdate: (effect: Effect) => void
}) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
      <EffectKnob
        label="Decay"
        marks={[0.1, 0.2, 0.3, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 12]}
        max={12}
        min={0.1}
        precision={2}
        scale="log"
        unit="s"
        value={effect.decaySeconds}
        onChange={decaySeconds => onUpdate({ ...effect, decaySeconds })}
      />
      <EffectKnob
        label="Pre-delay"
        marks={[0, 0.005, 0.01, 0.02, 0.03, 0.05, 0.075, 0.1, 0.15, 0.2, 0.25]}
        max={0.25}
        min={0}
        precision={3}
        unit="s"
        value={effect.preDelaySeconds}
        onChange={preDelaySeconds => onUpdate({ ...effect, preDelaySeconds })}
      />
      <EffectKnob
        label="Wet"
        marks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]}
        max={1}
        min={0}
        precision={2}
        value={effect.wet}
        onChange={wet => onUpdate({ ...effect, wet })}
      />
    </SimpleGrid>
  )
})

const EffectKnob = memo(function EffectKnob({
  label,
  marks,
  max,
  min,
  onChange,
  precision = 0,
  scale = 'linear',
  unit,
  value,
}: {
  label: string
  marks: number[]
  max: number
  min: number
  onChange: (value: number) => void
  precision?: number
  scale?: 'linear' | 'log'
  unit?: string
  value: number
}) {
  const valueToAngle = scale === 'log' ? logarithmicValueToAngle : linearValueToAngle
  const angleToValue = scale === 'log' ? angleToLogarithmicValue : angleToLinearValue
  const externalAngle = valueToAngle(value, min, max)
  const [angle, setAngle] = useState(externalAngle)
  const angleMarks = useMemo(() => marks.map(mark => ({
    value: valueToAngle(mark, min, max),
  })), [marks, max, min, valueToAngle])

  useEffect(() => setAngle(externalAngle), [externalAngle])

  const formatValue = (currentAngle: number) => {
    const currentValue = angleToValue(currentAngle, min, max, precision)
    const displayValue = unit === 'Hz' && currentValue >= 1000
      ? `${(currentValue / 1000).toFixed(currentValue >= 10000 ? 0 : 1)}k`
      : currentValue.toFixed(precision)

    return `${displayValue}${unit ? ` ${unit}` : ''}`
  }

  return (
    <Stack align="center" gap={6}>
      <Text fw={600} size="xs">{label}</Text>
      <AngleSlider
        aria-label={label}
        formatLabel={formatValue}
        marks={angleMarks}
        size={78}
        step={1}
        value={angle}
        onChange={setAngle}
        onChangeEnd={(nextAngle) => {
          setAngle(nextAngle)
          onChange(angleToValue(nextAngle, min, max, precision))
        }}
      />
    </Stack>
  )
})

const EqResponseGraph = memo(function EqResponseGraph({ effect }: { effect: EqEffect }) {
  const responsePath = useMemo(() => createEqResponsePath(effect), [effect])

  return (
    <Box>
      <Text fw={600} size="xs" mb={6}>Frequency response</Text>
      <Box
        component="svg"
        aria-label="EQ frequency response"
        role="img"
        viewBox={`0 -20 ${EQ_GRAPH_WIDTH} ${EQ_GRAPH_HEIGHT + 50}`}
        style={{
          background: 'transparent',
          borderRadius: 'var(--mantine-radius-sm)',
          display: 'block',
          height: EQ_GRAPH_HEIGHT,
          width: '100%',
        }}
      >
        {EQ_CHART_GAIN_MARKS.map(gainDb => (
          <g key={gainDb}>
            <line
              stroke={gainDb === 0 ? 'var(--mantine-color-gray-3)' : 'var(--mantine-color-gray-2)'}
              strokeWidth={gainDb === 0 ? 1.5 : 1}
              x1={0}
              x2={EQ_GRAPH_WIDTH}
              y1={eqGainToY(gainDb)}
              y2={eqGainToY(gainDb)}
            />
            <text fill="var(--mantine-color-gray-6)" fontSize={10} x={-40} y={eqGainToY(gainDb) + 3}>
              {`${gainDb > 0 ? '+' : ''}${gainDb} dB`}
            </text>
          </g>
        ))}
        {EQ_CHART_HZ_MARKS.map(frequencyHz => (
          <g key={frequencyHz}>
            <line
              stroke="var(--mantine-color-gray-2)"
              x1={eqFrequencyToX(frequencyHz)}
              x2={eqFrequencyToX(frequencyHz)}
              y1={0}
              y2={EQ_GRAPH_HEIGHT}
            />
            <text
              fill="var(--mantine-color-gray-6)"
              fontSize={10}
              textAnchor="middle"
              x={eqFrequencyToX(frequencyHz)}
              y={EQ_GRAPH_HEIGHT + 20}
            >
              {formatFrequency(frequencyHz)}
            </text>
          </g>
        ))}
        <path
          d={responsePath}
          fill="none"
          stroke="var(--mantine-color-violet-4)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />
        <EqBandMarker color="cyan" effect={effect} frequencyHz={effect.lowShelfFrequencyHz} label="Low Shelf" />
        <EqBandMarker color="violet" effect={effect} frequencyHz={effect.param1FrequencyHz} label="Param 1" />
        <EqBandMarker color="grape" effect={effect} frequencyHz={effect.param2FrequencyHz} label="Param 2" />
        <EqBandMarker color="orange" effect={effect} frequencyHz={effect.highShelfFrequencyHz} label="High Shelf" />
      </Box>
    </Box>
  )
})

const EqBandMarker = memo(function EqBandMarker({
  color,
  effect,
  frequencyHz,
  label,
}: {
  color: string
  effect: EqEffect
  frequencyHz: number
  label: string
}) {
  const x = eqFrequencyToX(frequencyHz)
  const y = eqGainToY(getEqResponseDb(effect, frequencyHz))

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        fill={`var(--mantine-color-${color}-5)`}
        r={7}
        stroke="white"
        strokeWidth={2}
      />
      <title>{`${label}: ${formatFrequency(frequencyHz)}`}</title>
    </g>
  )
})

function createEqResponsePath(effect: EqEffect): string {
  return Array.from({ length: 181 }, (_, index) => {
    const progress = index / 180
    const frequencyHz = MIN_FREQUENCY_HZ
      * ((MAX_FREQUENCY_HZ / MIN_FREQUENCY_HZ) ** progress)
    const x = progress * EQ_GRAPH_WIDTH
    const y = eqGainToY(getEqResponseDb(effect, frequencyHz))

    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
}

function getEqResponseDb(effect: EqEffect, frequencyHz: number): number {
  const coefficients = [
    createShelfCoefficients(
      'low',
      effect.lowShelfFrequencyHz,
      effect.lowShelfGainDb,
      effect.lowShelfQ,
    ),
    createPeakingCoefficients(effect.param1FrequencyHz, effect.param1GainDb, effect.param1Q),
    createPeakingCoefficients(effect.param2FrequencyHz, effect.param2GainDb, effect.param2Q),
    createShelfCoefficients(
      'high',
      effect.highShelfFrequencyHz,
      effect.highShelfGainDb,
      effect.highShelfQ,
    ),
  ]

  return coefficients.reduce((sum, current) => (
    sum + getBiquadMagnitudeDb(current, frequencyHz)
  ), 0)
}

type BiquadCoefficients = {
  a1: number
  a2: number
  b0: number
  b1: number
  b2: number
}

function createPeakingCoefficients(
  frequencyHz: number,
  gainDb: number,
  q: number,
): BiquadCoefficients {
  const omega = 2 * Math.PI * clamp(frequencyHz, MIN_FREQUENCY_HZ, EQ_SAMPLE_RATE / 2) / EQ_SAMPLE_RATE
  const alpha = Math.sin(omega) / (2 * Math.max(0.0001, q))
  const amplitude = 10 ** (gainDb / 40)
  const a0 = 1 + alpha / amplitude

  return normalizeCoefficients({
    a0,
    a1: -2 * Math.cos(omega),
    a2: 1 - alpha / amplitude,
    b0: 1 + alpha * amplitude,
    b1: -2 * Math.cos(omega),
    b2: 1 - alpha * amplitude,
  })
}

function createShelfCoefficients(
  shelf: 'high' | 'low',
  frequencyHz: number,
  gainDb: number,
  q: number,
): BiquadCoefficients {
  const omega = 2 * Math.PI * clamp(frequencyHz, MIN_FREQUENCY_HZ, EQ_SAMPLE_RATE / 2) / EQ_SAMPLE_RATE
  const amplitude = 10 ** (gainDb / 40)
  const cosine = Math.cos(omega)
  const alpha = Math.sin(omega) / (2 * Math.max(0.0001, q))
  const twoRootAmplitudeAlpha = 2 * Math.sqrt(amplitude) * alpha
  const amplitudePlusOne = amplitude + 1
  const amplitudeMinusOne = amplitude - 1

  if (shelf === 'low') {
    return normalizeCoefficients({
      a0: amplitudePlusOne + amplitudeMinusOne * cosine + twoRootAmplitudeAlpha,
      a1: -2 * (amplitudeMinusOne + amplitudePlusOne * cosine),
      a2: amplitudePlusOne + amplitudeMinusOne * cosine - twoRootAmplitudeAlpha,
      b0: amplitude * (amplitudePlusOne - amplitudeMinusOne * cosine + twoRootAmplitudeAlpha),
      b1: 2 * amplitude * (amplitudeMinusOne - amplitudePlusOne * cosine),
      b2: amplitude * (amplitudePlusOne - amplitudeMinusOne * cosine - twoRootAmplitudeAlpha),
    })
  }

  return normalizeCoefficients({
    a0: amplitudePlusOne - amplitudeMinusOne * cosine + twoRootAmplitudeAlpha,
    a1: 2 * (amplitudeMinusOne - amplitudePlusOne * cosine),
    a2: amplitudePlusOne - amplitudeMinusOne * cosine - twoRootAmplitudeAlpha,
    b0: amplitude * (amplitudePlusOne + amplitudeMinusOne * cosine + twoRootAmplitudeAlpha),
    b1: -2 * amplitude * (amplitudeMinusOne + amplitudePlusOne * cosine),
    b2: amplitude * (amplitudePlusOne + amplitudeMinusOne * cosine - twoRootAmplitudeAlpha),
  })
}

function normalizeCoefficients(input: BiquadCoefficients & { a0: number }): BiquadCoefficients {
  return {
    a1: input.a1 / input.a0,
    a2: input.a2 / input.a0,
    b0: input.b0 / input.a0,
    b1: input.b1 / input.a0,
    b2: input.b2 / input.a0,
  }
}

function getBiquadMagnitudeDb(
  coefficients: BiquadCoefficients,
  frequencyHz: number,
): number {
  const omega = 2 * Math.PI * frequencyHz / EQ_SAMPLE_RATE
  const numeratorReal = coefficients.b0
    + coefficients.b1 * Math.cos(omega)
    + coefficients.b2 * Math.cos(2 * omega)
  const numeratorImaginary = -coefficients.b1 * Math.sin(omega)
    - coefficients.b2 * Math.sin(2 * omega)
  const denominatorReal = 1
    + coefficients.a1 * Math.cos(omega)
    + coefficients.a2 * Math.cos(2 * omega)
  const denominatorImaginary = -coefficients.a1 * Math.sin(omega)
    - coefficients.a2 * Math.sin(2 * omega)
  const numeratorPower = numeratorReal ** 2 + numeratorImaginary ** 2
  const denominatorPower = denominatorReal ** 2 + denominatorImaginary ** 2

  return 10 * Math.log10(Math.max(Number.EPSILON, numeratorPower / denominatorPower))
}

function eqFrequencyToX(frequencyHz: number): number {
  return Math.log(clamp(frequencyHz, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ) / MIN_FREQUENCY_HZ)
    / Math.log(MAX_FREQUENCY_HZ / MIN_FREQUENCY_HZ)
    * EQ_GRAPH_WIDTH
}

function eqGainToY(gainDb: number): number {
  const clampedGain = clamp(gainDb, EQ_MIN_DB, EQ_MAX_DB)
  return (EQ_MAX_DB - clampedGain) / (EQ_MAX_DB - EQ_MIN_DB) * EQ_GRAPH_HEIGHT
}

function formatFrequency(frequencyHz: number): string {
  return frequencyHz >= 1000
    ? `${frequencyHz / 1000}k`
    : `${frequencyHz}`
}

function linearValueToAngle(value: number, min: number, max: number): number {
  return Math.round((clamp(value, min, max) - min) / (max - min) * ANGLE_MAX)
}

function angleToLinearValue(
  angle: number,
  min: number,
  max: number,
  precision: number,
): number {
  return roundToPrecision(min + clamp(angle, 0, ANGLE_MAX) / ANGLE_MAX * (max - min), precision)
}

function logarithmicValueToAngle(value: number, min: number, max: number): number {
  return Math.round(
    Math.log(clamp(value, min, max) / min)
    / Math.log(max / min)
    * ANGLE_MAX,
  )
}

function createLogarithmicMarks(min: number, max: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => (
    min * ((max / min) ** (index / (count - 1)))
  ))
}

function angleToLogarithmicValue(
  angle: number,
  min: number,
  max: number,
  precision: number,
): number {
  const progress = clamp(angle, 0, ANGLE_MAX) / ANGLE_MAX
  return roundToPrecision(min * ((max / min) ** progress), precision)
}

function roundToPrecision(value: number, precision: number): number {
  const multiplier = 10 ** precision
  return Math.round(value * multiplier) / multiplier
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
