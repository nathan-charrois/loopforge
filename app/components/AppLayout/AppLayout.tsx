import { type ReactNode } from 'react'
import { Container } from '@mantine/core'

import { FramesPerSecondMeter } from '~/components/FramesPerSecondMeter/FramesPerSecondMeter'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Container size="xl">
      {children}
      {import.meta.env.DEV && <FramesPerSecondMeter />}
    </Container>
  )
}
