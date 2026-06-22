/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@maxmind/geoip2-node', '@aws-sdk/client-s3'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'is1-ssl.mzstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
      },
    ],
  },
}

module.exports = nextConfig

