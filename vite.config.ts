import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildSha =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  process.env.GITHUB_SHA?.slice(0, 7) ??
  'local'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_SHA__: JSON.stringify(buildSha),
  },
  server: {
    port: 5733,
    strictPort: false,
  },
})
