import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Existing pattern for company logos
      {
        protocol: "https",
        hostname: "ednxswgrxrtamljupapf.supabase.co",
        pathname: "/storage/v1/object/sign/company-logos/**",
      },

      // NEW pattern for snippet previews (public bucket)
      {
        protocol: "https",
        hostname: "ednxswgrxrtamljupapf.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  turbopack: {},
};

export default nextConfig;
