/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiTarget = process.env.API_TARGET_URL || 'http://localhost:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiTarget}/uploads/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/admin/dashboard', permanent: false },
      { source: '/pos', destination: '/admin/pos', permanent: false },
      { source: '/rents', destination: '/admin/rents', permanent: false },
      { source: '/rents/:path*', destination: '/admin/rents/:path*', permanent: false },
      { source: '/clients', destination: '/admin/clients', permanent: false },
      { source: '/clients/:path*', destination: '/admin/clients/:path*', permanent: false },
      { source: '/master-data', destination: '/admin/master-data', permanent: false },
      { source: '/settings', destination: '/admin/settings', permanent: false },
      { source: '/calendar', destination: '/admin/calendar', permanent: false },
    ];
  },
};

export default nextConfig;
