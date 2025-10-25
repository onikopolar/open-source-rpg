/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  compiler: {
    emotion: true,
  },
  // Adicionar suporte experimental para ES modules
  experimental: {
    esmExternals: true,
  },
  // Configurar webpack para JSX
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.extensions.push('.jsx');
    return config;
  },
  // Configurações de página
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
};

module.exports = nextConfig;
