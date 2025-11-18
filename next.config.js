/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  webpack: (config) => {
    config.externals.push('@prisma/client')
    return config
  },
  // Desativa pré-renderização estática
  experimental: {
    esmExternals: 'loose'
  },
  // Força todas as páginas a serem server-rendered
  poweredByHeader: false,
  compress: false
}

module.exports = nextConfig