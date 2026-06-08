import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['ssh2', 'ssh2-sftp-client'],
};

export default nextConfig;
