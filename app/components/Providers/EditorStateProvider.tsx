import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

import {
  type ActiveTool,
  createDefaultEditorState,
  type EditorState,
  type InspectorPanel,
} from '~/domain'

type EditorStateContextValue = {
  editorState: EditorState
  setActiveTool: (tool: ActiveTool) => void
  setEditorState: Dispatch<SetStateAction<EditorState>>
  setInspectorPanel: (panel: InspectorPanel) => void
}

const EditorStateContext = createContext<EditorStateContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
}

export function EditorStateProvider({ children }: Props) {
  const [editorState, setEditorState] = useState<EditorState>(() => createDefaultEditorState())

  const setActiveTool = useCallback((tool: ActiveTool) => {
    setEditorState(currentState => ({
      ...currentState,
      activeTool: tool,
    }))
  }, [])

  const setInspectorPanel = useCallback((panel: InspectorPanel) => {
    setEditorState(currentState => ({
      ...currentState,
      inspector: {
        open: true,
        panel,
      },
    }))
  }, [])

  const contextValue = useMemo<EditorStateContextValue>(() => ({
    editorState,
    setActiveTool,
    setEditorState,
    setInspectorPanel,
  }), [editorState, setActiveTool, setInspectorPanel])

  return (
    <EditorStateContext.Provider value={contextValue}>
      {children}
    </EditorStateContext.Provider>
  )
}

export function useEditorState() {
  const value = useContext(EditorStateContext)

  if (value === undefined) {
    throw new Error('useEditorState must be used within EditorStateProvider')
  }

  return value
}
