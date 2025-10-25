/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      // Configurações para reduzir conflitos
      resolveAlias: {
        // Aliases específicos se necessário
      }
    }
  },
  // Garantir que o Prisma funcione corretamente
  webpack: (config) => {
    config.externals.push('@prisma/client')
    return config
  }
}

module.exports = nextConfig
