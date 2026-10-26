import {
  type ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from '@mantine/core'

import {
  type AudioExportBitDepth,
  type AudioExportChannels,
  type AudioExportSampleRate,
  type AudioExportSettings,
  createDefaultAudioExportSettings,
  exportWorkspaceAudio,
  getAudioExportDurationSeconds,
  validateAudioExportSettings,
} from '~/audio/exportAudio'
import { formatTickAsBars } from '~/domain'
import {
  selectTimelineEndTick,
  validateWorkspace,
  type Workspace,
} from '~/store/workspace'

type Props = {
  opened: boolean
  workspace: Workspace
  onClose: () => void
}

export const ExportDialog = memo(function ExportDialog({
  opened,
  workspace,
  onClose,
}: Props) {
  const projectEndTick = selectTimelineEndTick(workspace)
  const [settings, setSettings] = useState<AudioExportSettings>(() => (
    createDefaultAudioExportSettings(projectEndTick)
  ))
  const [error, setError] = useState<string>()
  const [exportedFileName, setExportedFileName] = useState<string>()
  const [isExporting, setIsExporting] = useState(false)
  const abortControllerRef = useRef<AbortController | undefined>(undefined)
  const workspaceErrors = useMemo(
    () => validateWorkspace(workspace),
    [workspace],
  )
  const settingErrors = useMemo(
    () => validateAudioExportSettings(settings),
    [settings],
  )
  const durationSeconds = useMemo(() => {
    if (workspaceErrors.length > 0 || settingErrors.length > 0) {
      return undefined
    }

    return getAudioExportDurationSeconds(workspace, settings)
  }, [settingErrors.length, settings, workspace, workspaceErrors.length])

  useEffect(() => {
    if (!opened) {
      return
    }

    setSettings(createDefaultAudioExportSettings(projectEndTick))
    setError(undefined)
    setExportedFileName(undefined)
  }, [opened, projectEndTick])

  const updateSetting = useCallback(<TKey extends keyof AudioExportSettings>(
    key: TKey,
    value: AudioExportSettings[TKey],
  ) => {
    setSettings(currentSettings => ({
      ...currentSettings,
      [key]: value,
    }))
  }, [])

  const handleClose = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = undefined
    onClose()
  }, [onClose])

  const handleExport = useCallback(async () => {
    const abortController = new AbortController()

    abortControllerRef.current = abortController
    setError(undefined)
    setExportedFileName(undefined)
    setIsExporting(true)

    try {
      const result = await exportWorkspaceAudio(
        workspace,
        settings,
        abortController.signal,
      )

      setExportedFileName(result.fileName)
    }
    catch (exportError) {
      if (!abortController.signal.aborted) {
        setError(getErrorMessage(exportError))
      }
    }
    finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = undefined
      }

      setIsExporting(false)
    }
  }, [settings, workspace])

  const validationError = settingErrors[0] ?? workspaceErrors[0]
  const canExport = !isExporting && validationError === undefined

  return (
    <Modal
      centered
      opened={opened}
      size="lg"
      title="Export song"
      onClose={handleClose}
    >
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <NumberInput
            allowDecimal={false}
            allowNegative={false}
            description={formatTickAsBars(workspace.timeline, settings.startTick)}
            label="Start tick"
            min={0}
            step={workspace.timeline.ppq}
            value={settings.startTick}
            onChange={value => updateSetting('startTick', toNumber(value, settings.startTick))}
          />
          <NumberInput
            allowDecimal={false}
            allowNegative={false}
            description={formatTickAsBars(workspace.timeline, settings.endTick)}
            label="End tick"
            min={1}
            step={workspace.timeline.ppq}
            value={settings.endTick}
            onChange={value => updateSetting('endTick', toNumber(value, settings.endTick))}
          />
          <Select
            allowDeselect={false}
            data={[{ label: 'WAV', value: 'wav' }]}
            disabled
            label="Format"
            value={settings.format}
          />
          <Select
            allowDeselect={false}
            data={[
              { label: '44.1 kHz', value: '44100' },
              { label: '48 kHz', value: '48000' },
            ]}
            label="Sample rate"
            value={`${settings.sampleRate}`}
            onChange={value => updateSetting('sampleRate', Number(value) as AudioExportSampleRate)}
          />
          <Select
            allowDeselect={false}
            data={[
              { label: '16-bit PCM', value: '16' },
              { label: '24-bit PCM', value: '24' },
            ]}
            label="Bit depth"
            value={`${settings.bitDepth}`}
            onChange={value => updateSetting('bitDepth', Number(value) as AudioExportBitDepth)}
          />
          <Select
            allowDeselect={false}
            data={[
              { label: 'Stereo', value: 'stereo' },
              { label: 'Mono', value: 'mono' },
            ]}
            label="Channels"
            value={settings.channels}
            onChange={value => updateSetting('channels', value as AudioExportChannels)}
          />
          <NumberInput
            decimalScale={1}
            description="Extra time for delay, reverb, and note releases"
            label="Effect tail"
            max={30}
            min={0}
            step={0.5}
            suffix=" s"
            value={settings.tailSeconds}
            onChange={value => updateSetting('tailSeconds', toNumber(value, settings.tailSeconds))}
          />
          <Switch
            checked={settings.normalize}
            description="Adjust the rendered peak to -1 dBFS"
            label="Peak normalize"
            mt="xl"
            onChange={(event: ChangeEvent<HTMLInputElement>) => (
              updateSetting('normalize', event.currentTarget.checked)
            )}
          />
        </SimpleGrid>

        {durationSeconds !== undefined
          ? (
              <Text c="dimmed" size="sm">
                {`Export duration: ${formatDuration(durationSeconds)}`}
              </Text>
            )
          : null}

        {isExporting
          ? (
              <Stack gap={4}>
                <Text size="sm">Rendering audio…</Text>
                <Progress animated value={100} />
                <Text c="dimmed" size="xs">
                  Closing cancels the download. The browser may finish the current render first.
                </Text>
              </Stack>
            )
          : null}

        {validationError !== undefined
          ? <Alert color="red" title="Cannot export">{validationError}</Alert>
          : null}

        {error !== undefined
          ? <Alert color="red" title="Export failed">{error}</Alert>
          : null}

        {exportedFileName !== undefined
          ? <Alert color="green" title="Export complete">{exportedFileName}</Alert>
          : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose}>
            {isExporting ? 'Cancel' : 'Close'}
          </Button>
          <Button
            disabled={!canExport}
            loading={isExporting}
            onClick={() => void handleExport()}
          >
            Export WAV
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
})

function toNumber(value: number | string, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback
}

function formatDuration(durationSeconds: number): string {
  const wholeSeconds = Math.max(0, Math.ceil(durationSeconds))
  const minutes = Math.floor(wholeSeconds / 60)
  const seconds = wholeSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Audio export failed.'
}
