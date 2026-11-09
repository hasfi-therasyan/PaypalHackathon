/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Photo uploads run on the Node.js server and use Sharp. Keep that native
    // dependency external to the server bundle instead of replacing it.
    serverComponentsExternalPackages: ['sharp'],
  },
};

module.exports = nextConfig;
