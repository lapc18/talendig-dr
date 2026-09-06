import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    // The Firebase SDK alone is ~165 kB gzipped and sits on the critical path,
    // so the default 500 kB warning can never be met. The limit is raised to a
    // level that still catches genuine regressions.
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Firebase and the React runtime change on a completely different
        // cadence from application code, so they are split into their own
        // chunks and stay cached across deploys.
        codeSplitting: {
          groups: [
            { name: 'vendor-firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/ },
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|react-router)[\\/]/ },
          ],
        },
      },
    },
  },
})
