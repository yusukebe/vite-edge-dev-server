import { defineConfig } from 'vite'
import { devServer } from './src/vite-plugin'

export default defineConfig({
  ssr: {
    noExternal: true
  },
  plugins: [
    devServer({
      entry: './app/index.ts'
    })
  ]
})
