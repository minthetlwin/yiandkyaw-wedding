import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { shareMetadata } from './build/share-metadata.ts'

/**
 * The site's public address, for link previews: chat apps only show the share
 * image when its URL is absolute. Set SITE_URL (e.g. https://kyawandshwe.com),
 * or let the host provide it: Vercel, Netlify and Cloudflare Pages do.
 */
function siteUrl(env: Record<string, string>) {
  const fromVercel = env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  const url = env.SITE_URL || env.VITE_SITE_URL || fromVercel || env.URL || env.CF_PAGES_URL || ''
  return url.replace(/\/+$/, '')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Real environment variables (CI, the host) win over the .env files.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env } as Record<string, string>
  return {
    // Served from a folder (e.g. GitHub Pages: /yiandkyaw-wedding/) or a domain's root.
    base: env.BASE_PATH || '/',
    // Title, description and share image: src/config/share.ts.
    plugins: [react(), tailwindcss(), shareMetadata(siteUrl(env))],
    build: {
      // The background's three.js chunk is large by design and lazy-loaded,
      // so it never blocks first paint.
      chunkSizeWarningLimit: 1000,
    },
  }
})
