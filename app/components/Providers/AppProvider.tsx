import { MantineProvider } from '@mantine/core'

import { CommandHistoryProvider } from './CommandHistoryProvider'
import { EditorStateProvider } from './EditorStateProvider'
import theme from '~/utils/theme'

type Props = {
  children: React.ReactNode
}

export default function AppProvider({ children }: Props) {
  return (
    <MantineProvider theme={theme}>
      <EditorStateProvider>
        <CommandHistoryProvider>
          {children}
        </CommandHistoryProvider>
      </EditorStateProvider>
    </MantineProvider>
  )
}
