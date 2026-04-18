import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  stack: string | null;
  componentStack: string | null;
  errorId: string | null;
}

class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      stack: null,
      componentStack: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      stack: error.stack ?? null,
      componentStack: null,
      errorId: `ADM-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AdminErrorBoundary] Uncaught error:', error, info.componentStack);
    this.setState({ componentStack: info.componentStack ?? null });
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack, errorId: this.state.errorId },
      tags: { surface: 'admin' },
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      stack: null,
      componentStack: null,
      errorId: null,
    });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[70vh] flex items-start justify-center px-6 py-12">
        <div className="max-w-3xl w-full bg-slate-900 rounded-3xl border border-rose-500/30 shadow-2xl p-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black text-white tracking-tight">
                Error en pantalla de administración
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                {this.state.error?.message || 'Error desconocido'}
              </p>
              {this.state.errorId && (
                <p className="text-[10px] font-mono text-slate-500 mt-2">
                  {this.state.errorId}
                </p>
              )}
            </div>
          </div>

          <details className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-5">
            <summary className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none">
              Stack trace
            </summary>
            <pre className="text-[10px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap mt-3 overflow-x-auto">
              {this.state.stack || this.state.error?.toString() || 'Sin stack disponible.'}
            </pre>
            {this.state.componentStack && (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4 mb-2">
                  Component stack
                </p>
                <pre className="text-[10px] font-mono text-slate-400 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                  {this.state.componentStack}
                </pre>
              </>
            )}
          </details>

          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }
}

export default AdminErrorBoundary;
