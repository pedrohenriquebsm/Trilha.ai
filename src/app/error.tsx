'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-16">
      <div className="card w-full max-w-md border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body items-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="card-title text-2xl font-bold">Ops! Algo deu errado.</h2>
            <p className="text-base-content/60">
              Não foi possível carregar esta página. Tente novamente.
            </p>
          </div>
          {process.env.NODE_ENV === 'development' && error?.message && (
            <div className="max-h-32 w-full overflow-auto rounded-lg bg-base-200 p-3 text-left text-xs font-mono">
              {error.message}
            </div>
          )}
          <div className="card-actions w-full pt-2">
            <button className="btn btn-primary w-full gap-2" onClick={reset}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
