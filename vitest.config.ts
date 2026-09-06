import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts: the test run needs the React transform and
// the path alias, but not Tailwind, and the build needs none of the test setup.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    // `config/env` validates on import and throws when a variable is missing,
    // so the suite supplies a complete, obviously fake configuration.
    // `VITE_FIREBASE_MEASUREMENT_ID` is deliberately absent: without it the
    // analytics facade short-circuits and never touches the network.
    env: {
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      VITE_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000000000',
      VITE_AUTH_USERNAME_DOMAIN: 'classes.talendig.test',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/config/firebase.ts',
        'src/shared/i18n/copy.ts',
        'src/app/lazyPages.ts',
      ],
    },
  },
})
