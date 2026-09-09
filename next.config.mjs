import { realpathSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

// Trace the physical pnpm package, never files underneath its directory symlink.
// Vercel rejects packages containing both a symlink and file entries below it.
const pdfPackage = path.relative(process.cwd(), realpathSync('node_modules/pdfjs-dist')).replaceAll('\\', '/')
const require = createRequire(import.meta.url)
const physicalPackage = name => path.relative(process.cwd(), path.dirname(require.resolve(`${name}/package.json`))).replaceAll('\\', '/')
const ocrPackage = physicalPackage('tesseract.js')
const languagePackage = physicalPackage('@tesseract.js-data/eng')
const ocrRequire = createRequire(require.resolve('tesseract.js/package.json'))
const corePackage = path.relative(process.cwd(), path.dirname(ocrRequire.resolve('tesseract.js-core/package.json'))).replaceAll('\\', '/')

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  serverExternalPackages: ['@vercel/blob', 'tesseract.js', '@tesseract.js-data/eng', 'pdfjs-dist', '@napi-rs/canvas', 'sharp'],
  outputFileTracingIncludes: {
    '/api/u1/upload': [
      `${pdfPackage}/legacy/build/pdf.worker.mjs`,
      `${pdfPackage}/wasm/**/*`,
    ],
    '/api/u1/process': [
      './scripts/u1-process.mjs',
      './lib/u1/*.mjs',
      `${ocrPackage}/src/**/*`,
      `${languagePackage}/4.0.0/eng.traineddata.gz`,
      `${corePackage}/*.wasm`,
      `${corePackage}/*.js`,
    ],
  },
  outputFileTracingExcludes: {
    '/api/u1/*': ['./.u1-data/**/*', './tmp/**/*', './qa-artifacts/**/*', './.env*'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
