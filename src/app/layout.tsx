import type { Metadata } from 'next';
import './globals.css';
import Layout from '@/src/components/Layout';

export const metadata: Metadata = {
  title: 'Trilha.ai',
  description: 'Plataforma de geração automatizada de roadmaps de estudo utilizando Inteligência Artificial para tecnologia e desenvolvimento de software.',
  openGraph: {
    title: 'Trilha.ai',
    description: 'Plataforma de geração automatizada de roadmaps de estudo utilizando Inteligência Artificial para tecnologia e desenvolvimento de software.',
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
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
