import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The background's three.js chunk is large by design and lazy-loaded,
    // so it never blocks first paint.
    chunkSizeWarningLimit: 1000,
  },
})
