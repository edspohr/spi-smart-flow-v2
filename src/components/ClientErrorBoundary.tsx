import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

class ClientErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `ERR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ClientErrorBoundary] Uncaught error:', error, info.componentStack);
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack, errorId: this.state.errorId },
      tags: { surface: 'client' },
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  handleGoHome = () => {
    window.location.assign('/client');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-5">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
            Algo salió mal
          </h2>
          <p className="text-sm font-semibold text-slate-500 leading-relaxed mb-6">
            Tuvimos un problema cargando esta pantalla. Intentá nuevamente o volvé al inicio.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={this.handleRetry}
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest transition-colors"
            >
              <Home className="h-4 w-4" />
              Volver al inicio
            </button>
          </div>
          {this.state.errorId && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6">
              Si el problema persiste, contactá a SPI con este código:
              <br />
              <span className="font-mono text-slate-600 tracking-normal text-xs mt-1 inline-block">
                {this.state.errorId}
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }
}

export default ClientErrorBoundary;
