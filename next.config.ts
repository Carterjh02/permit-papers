const nextConfig = {
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
      {
        protocol: "https",
        hostname: "ednxswgrxrtamljupapf.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      }      
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  turbopack: {},
};

export default nextConfig;
