import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'place-hold.it',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'reservoimg.s3.amazonaws.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'i0.wp.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'images.fresha.com',
        pathname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
