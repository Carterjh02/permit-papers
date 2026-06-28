import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ednxswgrxrtamljupapf.supabase.co",
        pathname: "/storage/v1/object/sign/company-logos/**",
      },
    ],
  },
};

export default nextConfig;
