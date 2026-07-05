import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal config, no custom webpack overrides
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ednxswgrxrtamljupapf.supabase.co",
        pathname: "/storage/v1/object/sign/company-logos/**",
      },
    ],
  },

  // Optional: empty Turbopack config to silence Next.js warnings
  turbopack: {},
};

export default nextConfig;
