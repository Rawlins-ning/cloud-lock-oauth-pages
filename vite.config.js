import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  // A hosted project path can be configured without changing the OAuth consent route.
  base: process.env.PUBLIC_BASE_PATH || '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(process.cwd(), 'index.html'),
        consent: resolve(process.cwd(), 'oauth/consent/index.html'),
      },
    },
  },
})
