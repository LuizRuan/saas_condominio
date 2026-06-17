import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Building2 } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f4f7fb] px-6">
        {/* Soft glow top-right */}
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />

        <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
          {/* Brand */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 shadow-lg">
              <Building2 className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="leading-none">
              <p className="text-[15px] font-extrabold tracking-[-0.03em] text-slate-950">Condomínio</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">em Dia</p>
            </div>
          </div>

          {/* Error card */}
          <div className="w-full rounded-3xl border border-red-100/80 bg-white/95 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.10)] ring-1 ring-red-100/60">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 ring-1 ring-red-100">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h1 className="text-xl font-extrabold tracking-[-0.04em] text-slate-950">
              Algo deu errado
            </h1>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Ocorreu um erro inesperado. Não se preocupe — seus dados estão seguros.
            </p>

            {this.state.error && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-left">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-red-700">Detalhes</p>
                <p className="mt-1.5 truncate font-mono text-xs text-red-600">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-500"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar a página
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
