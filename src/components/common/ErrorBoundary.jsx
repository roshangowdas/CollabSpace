import React, { Component } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

/**
 * Global Error Boundary catching render and chunk loading failures.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CollabSpace ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#191918] text-[#ECECEA] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#222221] border border-[#38262a] rounded-[6px] p-6 text-center space-y-4 shadow-xl">
            <div className="inline-flex p-3 rounded-full bg-[#eb1b38]/10 text-[#eb1b38]">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-[#ECECEA]">Something went wrong</h2>
            <p className="text-xs text-[#A5A5A4] leading-relaxed">
              An unexpected error occurred while loading this view. You can reload the page or return to the home screen.
            </p>
            {this.state.error?.message && (
              <pre className="p-2.5 bg-[#141414] border border-[#2b2b2a] rounded text-[11px] text-left text-red-400 overflow-x-auto max-h-28">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-[#2d2d2c] hover:bg-[#383837] text-xs font-medium text-[#ECECEA] rounded-[6px] transition flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-[#eb1b38] hover:bg-[#d61732] text-xs font-semibold text-white rounded-[6px] transition flex items-center gap-1.5"
              >
                <Home className="h-3.5 w-3.5" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
