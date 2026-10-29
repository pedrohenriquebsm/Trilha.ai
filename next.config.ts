import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  // O preview do AI Studio abre o app em um iframe servido por este domínio.
  // Sem isso, o Next 16 bloqueia o HMR e os recursos internos de dev.
  allowedDevOrigins: [
    // O host do preview muda a cada sessão do AI Studio. O Next aceita
    // wildcard apenas no começo do domínio (segmento inteiro).
    '*.us-east1.run.app',
    'ais-dev-dzm5l22pmibg64nbgnhp3d-227364137378.us-east1.run.app',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Do NOT add X-Frame-Options / frame-ancestors here: the AI Studio
          // preview renders the app inside an iframe.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
