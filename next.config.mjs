/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // Use in-memory caching instead of disabled cache or filesystem cache
      // This avoids the memory allocation failures from filesystem cache
      // while still keeping incremental rebuilds fast
      config.cache = {
        type: 'memory',
      };

      // Reduce file watcher pressure on Windows
      config.watchOptions = {
        ignored: ['**/node_modules/**', '**/.next/**', '**/.git/**'],
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
