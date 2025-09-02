/** @type {import('next').NextConfig} */
const nextConfig = {images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
      },
       {
        protocol: "https",
        hostname: "4uqx22qha3.ufs.sh",
        port: "",
      },
    ],
  },};

export default nextConfig;