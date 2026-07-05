import { type ReactNode } from 'react'
import { Container } from '@mantine/core'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Container>
      {children}
    </Container>
  )
}
