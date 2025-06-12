/** @type {import('next').NextConfig} */
export default {
  experimental: {
    useCache: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", port: "" },
    ],
  },
};
