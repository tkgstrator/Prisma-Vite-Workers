import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

const version = JSON.parse(readFileSync('./package.json', 'utf-8')).version
const hash = execSync('git rev-parse --short HEAD 2>/dev/null || echo unknown').toString().trim()

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 5173
    },
    plugins: [
      {
        name: 'build-info',
        buildStart() {
          console.log(`Building app version: ${version} (git hash: ${hash}) in ${mode} mode`)
        }
      },
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        routesDirectory: resolve(__dirname, './src/app/routes'),
        generatedRouteTree: resolve(__dirname, './src/app/routeTree.gen.ts')
      }),
      react(),
      cloudflare({
        configPath: './wrangler.toml'
      }),
      tailwindcss()
    ],
    build: {
      target: 'esnext',
      minify: true
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __GIT_HASH__: JSON.stringify(hash)
    }
  }
})
