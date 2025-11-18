/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  webpack: (config) => {
    config.externals.push('@prisma/client')
    return config
  },
  // DESATIVA COMPLETAMENTE A GERAÇÃO ESTÁTICA
  experimental: {
    esmExternals: 'loose'
  },
  // Garante que todas as páginas sejam server-rendered
  poweredByHeader: false
}

module.exports = nextConfig