/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['react-leaflet', 'leaflet'],
  // Eliminar la configuración de webpack que podría estar causando problemas
};

export default nextConfig;
