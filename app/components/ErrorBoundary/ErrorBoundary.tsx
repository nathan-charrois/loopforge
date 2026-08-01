import type { PropsWithChildren, ReactNode } from 'react'
import { Component, memo } from 'react'

type ErrorBoundaryProps = PropsWithChildren<{
  fallback?: ReactNode
}>

type ErrorBoundaryState = {
  error: unknown | null
}

export const ErrorBoundary = memo(class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      error,
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return this.props.fallback
    }

    return this.props.children
  }
})
