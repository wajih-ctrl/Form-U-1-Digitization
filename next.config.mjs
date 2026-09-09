import { realpathSync } from 'node:fs'
import path from 'node:path'

// Trace the physical pnpm package, never files underneath its directory symlink.
// Vercel rejects packages containing both a symlink and file entries below it.
const pdfPackage = path.relative(process.cwd(), realpathSync('node_modules/pdfjs-dist')).replaceAll('\\', '/')

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  serverExternalPackages: ['tesseract.js', '@tesseract.js-data/eng', 'pdfjs-dist', '@napi-rs/canvas', 'sharp'],
  outputFileTracingIncludes: {
    '/api/u1/upload': [
      `${pdfPackage}/legacy/build/pdf.worker.mjs`,
      `${pdfPackage}/wasm/**/*`,
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
