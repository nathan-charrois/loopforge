import { memo } from 'react'

import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary'
import { AutomationPatternPanel } from './AutomationPatternPanel'
import { ChordPanel } from './ChordPatternPanel'
import { DrumPatternPanel } from './DrumPatternPanel'
import { NotePatternPanel } from './NotePatternPanel'
import {
  type PatternEvent,
  type PatternEventId,
  type Timeline,
} from '~/domain'
import type {
  ActivePatternPanelTool,
  PatternEventDraft,
} from '~/store/editor'
import type {
  Dispatch,
} from '~/store/session'
import {
  selectBlock,
  selectPatternForBlock,
  type Workspace,
} from '~/store/workspace'

type Props = {
  dispatch: Dispatch
  workspace: Workspace
  tool: ActivePatternPanelTool
  timeline: Timeline
  focusedBlockId?: string
  selectedPatternEvent?: PatternEvent
  selectedPatternEventIds?: PatternEventId[]
  onDeletePatternEvent: (patternEventId: PatternEventId) => void
  onSelectPatternEvent: (patternEventId: PatternEventId, additive: boolean) => void
  onSetActiveTool: (tool: ActivePatternPanelTool) => void
  onUpdatePatternEventDraft: (patternEvent: PatternEvent, patternEventDraft: Partial<PatternEventDraft>) => void
}

export const PatternPanel = memo(function PatternPanel(props: Props) {
  if (props.focusedBlockId === undefined) {
    return null
  }

  const focusedBlock = selectBlock(props.workspace, props.focusedBlockId)
  if (focusedBlock === undefined) {
    return null
  }

  const pattern = selectPatternForBlock(props.workspace, focusedBlock)
  if (pattern === undefined) {
    return null
  }

  switch (pattern.kind) {
    case 'automation':
      return (
        <ErrorBoundary>
          <AutomationPatternPanel
            focusedBlock={focusedBlock}
            pattern={pattern}
            {...props}
          />
        </ErrorBoundary>
      )
    case 'chord':
      return (
        <ErrorBoundary>
          <ChordPanel
            focusedBlock={focusedBlock}
            pattern={pattern}
            {...props}
          />
        </ErrorBoundary>
      )
    case 'drum':
      return (
        <ErrorBoundary>
          <DrumPatternPanel
            focusedBlock={focusedBlock}
            pattern={pattern}
            {...props}
          />
        </ErrorBoundary>
      )
    case 'note':
      return (
        <ErrorBoundary>
          <NotePatternPanel
            focusedBlock={focusedBlock}
            pattern={pattern}
            {...props}
          />
        </ErrorBoundary>
      )
  }
})
