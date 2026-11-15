import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Caminhos relativos: facilita publicar em GitHub Pages futuramente.
  base: './',
})
