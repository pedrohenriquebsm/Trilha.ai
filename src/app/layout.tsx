import type { Metadata } from 'next';
import './globals.css';
import Layout from '@/src/components/Layout';
import ErrorBoundary from '@/src/components/ErrorBoundary';
import { AuthProvider } from '@/src/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Trilha.ai',
  description:
    'Plataforma de geração automatizada de roadmaps de estudo utilizando Inteligência Artificial para tecnologia e desenvolvimento de software.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://trilha.ai'
  ),
  openGraph: {
    title: 'Trilha.ai',
    description:
      'Plataforma de geração automatizada de roadmaps de estudo utilizando Inteligência Artificial para tecnologia e desenvolvimento de software.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <ErrorBoundary>
            <Layout>{children}</Layout>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
