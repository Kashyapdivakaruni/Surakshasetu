/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverExternalPackages: ["livekit-server-sdk"]
  }
}

module.exports = nextConfig
