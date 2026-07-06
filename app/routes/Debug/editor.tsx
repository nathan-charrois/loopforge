import { type MetaArgs } from 'react-router'

import { AppLayout } from '~/components/AppLayout/AppLayout'
import AppProvider from '~/components/Providers/AppProvider'

export function meta({ }: MetaArgs) {
  return [
    { title: 'Loop Forge - Editor' },
  ]
}

export default function Editor() {
  return (
    <AppProvider>
      <AppLayout>
        Editor
      </AppLayout>
    </AppProvider>
  )
}
