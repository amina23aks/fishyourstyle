/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dpapsfabg/**",
      },
      {
        protocol: "https",
        hostname: "www.facebook.com",
        pathname: "/tr",
      },
    ],
  },
};

export default nextConfig;
