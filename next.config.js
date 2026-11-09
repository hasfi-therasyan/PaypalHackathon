/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Photo uploads run on the Node.js server and use Sharp. Keep that native
    // dependency external to the server bundle instead of replacing it.
    serverComponentsExternalPackages: ['sharp'],
  },
  webpack: (config, { isServer }) => {
    // Transformers.js is loaded only by the client-only on-device AI component.
    // Its optional Node dependencies must be excluded from the browser bundle,
    // but never from API routes where Sharp compresses proof images.
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'sharp$': false,
        'onnxruntime-node$': false,
      };
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
