"use client"

import type { ErrorInfo, ReactNode } from "react"
import { Component } from "react"

type ErrorBoundaryFallback = (error: Error, reset: () => void) => ReactNode

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ErrorBoundaryFallback
  resetKeys?: unknown[]
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { error } = this.state
    const { resetKeys } = this.props

    if (!(error && resetKeys)) {
      return
    }

    const previousResetKeys = prevProps.resetKeys ?? []
    if (previousResetKeys.length !== resetKeys.length) {
      this.reset()
      return
    }

    for (const [index, key] of resetKeys.entries()) {
      if (!Object.is(key, previousResetKeys[index])) {
        this.reset()
        return
      }
    }
  }

  private readonly reset = (): void => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state

    if (error) {
      return this.props.fallback(error, this.reset)
    }

    return this.props.children
  }
}
