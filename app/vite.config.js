import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Build into ../build and emit manifest.json for WordPress to read.
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  build: {
    outDir: resolve(__dirname, '../build'),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      // Use index.html as entry; manifest key will be "index.html"
      input: resolve(__dirname, 'index.html')
    }
  }
})
