'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR" data-theme="light">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-base-200 p-6">
          <div className="card w-full max-w-md border border-base-300 bg-base-100 shadow-xl">
            <div className="card-body items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h2 className="card-title text-2xl font-bold">Erro inesperado</h2>
              <p className="text-base-content/60">
                A aplicação encontrou um erro inesperado. Recarregue a página para continuar.
              </p>
              <button className="btn btn-primary w-full gap-2" onClick={reset}>
                <RefreshCw className="h-4 w-4" />
                Recarregar
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
