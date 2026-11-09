/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack(config, { isServer }) {
    if (isServer) {
      // The vision checker lives in a `ssr: false` client island. Prevent
      // Next's server trace from selecting Transformers.js' native Node entry.
      config.resolve.conditionNames = ['webpack', 'production', 'browser', 'import', 'module', 'default'];
      config.resolve.alias['onnxruntime-node'] = false;
      config.resolve.alias.sharp = false;
    }
    return config;
  },
};

module.exports = nextConfig;
