/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/invoices/*/pdf': [
        './node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff',
      ],
    },
  },
};
export default nextConfig;
