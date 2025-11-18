/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  turbopack: {},
  webpack: (config) => {
    config.externals.push('@prisma/client')
    return config
  }
}

module.exports = nextConfig