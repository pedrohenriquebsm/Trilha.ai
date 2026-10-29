'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="card bg-base-100 border border-base-300 shadow-xl max-w-md w-full">
            <div className="card-body items-center text-center space-y-4">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center text-error">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="card-title text-2xl font-bold">Ops! Algo deu errado.</h2>
                <p className="text-base-content/60">
                  Ocorreu um erro inesperado nesta parte da aplicação.
                </p>
              </div>
              {this.state.error && (
                <div className="p-3 bg-base-200 rounded-lg text-xs font-mono text-left w-full overflow-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
              <div className="card-actions w-full pt-4">
                <button 
                  className="btn btn-primary w-full gap-2"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4" />
                  Recarregar Página
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
