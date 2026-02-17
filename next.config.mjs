/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable persistent caching in dev to prevent memory allocation failures
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
