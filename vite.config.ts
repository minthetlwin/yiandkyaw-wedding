import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { shareMetadata } from './build/share-metadata.ts'

/**
 * The site's public address, for link previews: chat apps only show the share
 * image when its URL is absolute. In order of trust:
 *   1. SITE_URL set in the build's environment (CI, the host's settings);
 *   2. the address the host reports for this build (Netlify, Vercel,
 *      Cloudflare Pages), which follows renames and custom domains;
 *   3. SITE_URL in .env files, a fallback for local builds. It ranks last
 *      because it goes stale: a renamed site would keep advertising the old
 *      address, and every preview photo would 404.
 */
function siteUrl(fileEnv: Record<string, string>) {
  const env = process.env
  const fromHost =
    env.URL || // Netlify: the site's primary address (custom domain if set)
    (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    env.CF_PAGES_URL
  const url = env.SITE_URL || fromHost || fileEnv.SITE_URL || fileEnv.VITE_SITE_URL || ''
  return url.replace(/\/+$/, '')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env files, with real environment variables (CI, the host) on top.
  const env = loadEnv(mode, process.cwd(), '')
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
