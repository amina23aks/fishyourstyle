/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
