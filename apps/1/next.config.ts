import type { NextConfig } from 'next'

import intl from 'next-intl/plugin'

const config: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: '100mb' } },
  images: { remotePatterns: [{ hostname: '*' }] },
  transpilePackages: ['@a/api', '@a/auth', '@a/db', '@a/ui'],
  typescript: { ignoreBuildErrors: true }
}

export default intl()(config)
