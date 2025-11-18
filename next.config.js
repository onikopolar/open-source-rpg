/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', 
  trailingSlash: true,
  webpack: (config) => {
    config.externals.push('@prisma/client')
    return config
  },
  // Desativa ESLint durante build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Desativa verificação de tipos durante build  vamo ver
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig