import { type MetaArgs } from 'react-router'

import { AppLayout } from '~/components/AppLayout/AppLayout'
import AppProvider from '~/components/Providers/AppProvider'

export function meta({ }: MetaArgs) {
  return [
    { title: 'Loop Forge - App' },
  ]
}

export default function App() {
  return (
    <AppProvider>
      <AppLayout>
        Hey
      </AppLayout>
    </AppProvider>
  )
}
