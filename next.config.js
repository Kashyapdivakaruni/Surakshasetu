/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["livekit-server-sdk"]
  }
}

module.exports = nextConfig
