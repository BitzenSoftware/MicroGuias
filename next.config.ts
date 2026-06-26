import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // sharp é módulo nativo — manter externo para carregar no serverless da Vercel
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

export default nextConfig
