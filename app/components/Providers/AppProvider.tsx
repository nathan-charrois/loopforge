import { MantineProvider } from '@mantine/core'

import { PlaybackProvider } from './PlaybackProvider'
import { SessionProvider } from './SessionProvider'
import { createEditor } from '~/store/editor'
import { createInitialWorkspace } from '~/store/workspace'
import theme from '~/utils/theme'

type Props = {
  children: React.ReactNode
}

export default function AppProvider({ children }: Props) {
  return (
    <MantineProvider theme={theme}>
      <SessionProvider
        createInitialEditor={createEditor}
        createInitialWorkspace={createInitialWorkspace}
      >
        <PlaybackProvider>
          {children}
        </PlaybackProvider>
      </SessionProvider>
    </MantineProvider>
  )
}
