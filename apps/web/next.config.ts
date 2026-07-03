import type { NextConfig } from 'next';

const isDockerBuild = process.env.DOCKER_BUILD === 'true';

const nextConfig: NextConfig = {
  ...(isDockerBuild ? { output: 'standalone' as const } : {}),
  reactStrictMode: true,
  transpilePackages: [
    '@creative-factory/contracts',
    '@creative-factory/env-config',
    '@creative-factory/shared-kernel',
  ],
};

export default nextConfig;
