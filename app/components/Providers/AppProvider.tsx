import { MantineProvider } from '@mantine/core'

import { SessionProvider } from './SessionProvider'
import { createEditor } from '~/store/editor'
import { createWorkspace } from '~/store/workspace'
import theme from '~/utils/theme'

type Props = {
  children: React.ReactNode
}

export default function AppProvider({ children }: Props) {
  return (
    <MantineProvider theme={theme}>
      <SessionProvider
        createInitialEditor={createEditor}
        createInitialWorkspace={createWorkspace}
      >
        {children}
      </SessionProvider>
    </MantineProvider>
  )
}
