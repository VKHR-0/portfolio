/** @type {import('next').NextConfig} */
export default {
  experimental: {
    dynamicIO: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", port: "" },
    ],
  },
};
