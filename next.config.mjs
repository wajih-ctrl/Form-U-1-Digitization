/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  serverExternalPackages: ['tesseract.js', '@tesseract.js-data/eng', 'pdfjs-dist', '@napi-rs/canvas', 'sharp'],
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
