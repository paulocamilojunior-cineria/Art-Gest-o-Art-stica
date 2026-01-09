import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // A seção 'define' foi removida para garantir que a chave não vaze para o navegador.
})