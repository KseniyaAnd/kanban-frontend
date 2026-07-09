import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import i18n from '../../i18n'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(i18n.t('errors.logCaught'), error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            background: '#fff5f5',
            color: '#c53030',
            borderRadius: '8px',
            margin: '20px',
          }}
        >
          <h2>{i18n.t('errors.boundaryTitle')}</h2>
          <p>{this.state.error?.message || String(this.state.error)}</p>
          <button
            onClick={() => {
              window.location.reload()
            }}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: '#c53030',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            {i18n.t('errors.reloadButton')}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
