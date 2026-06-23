'use client'

import { Component, type ReactNode } from 'react'
import { LanguageContext } from './LanguageProvider'
import type { Language } from './LanguageProvider'

const t = {
  zh: {
    title: '出了点问题',
    fallback: '发生了意外错误',
    tryAgain: '重试',
  },
  en: {
    title: 'Something went wrong',
    fallback: 'An unexpected error occurred',
    tryAgain: 'Try Again',
  },
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <LanguageContext.Consumer>
            {(ctx) => {
              const lang: Language = ctx?.lang ?? 'zh'
              return (
                <div className="card border-red-200 bg-red-50 text-center py-12">
                  <div className="text-4xl mb-4">😵</div>
                  <h3 className="text-lg font-bold text-red-800 mb-2">
                    {t[lang].title}
                  </h3>
                  <p className="text-sm text-red-600 mb-4">
                    {this.state.error?.message || t[lang].fallback}
                  </p>
                  <button
                    onClick={() => this.setState({ hasError: false, error: null })}
                    className="btn-secondary text-sm"
                  >
                    {t[lang].tryAgain}
                  </button>
                </div>
              )
            }}
          </LanguageContext.Consumer>
        )
      )
    }

    return this.props.children
  }
}
