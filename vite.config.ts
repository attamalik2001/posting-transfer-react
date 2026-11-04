import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const SUPABASE_URL = 'https://ydsmhoqalhwexojsbikg.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkc21ob3FhbGh3ZXhvanNiaWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDMzOTIsImV4cCI6MjA5NjgxOTM5Mn0.Cc_n4g8OwfWDErNtYaxDQmeMYka2rECUDtYiAv-x0zM'

function supabaseProxyPlugin(): Plugin {
  return {
    name: 'supabase-proxy-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/supabase-api')) {
          return next()
        }

        try {
          const parsedUrl = new URL(req.url, 'http://localhost:3000')
          const overrideMethod = parsedUrl.searchParams.get('__method')
          const overridePrefer = parsedUrl.searchParams.get('__prefer')
          parsedUrl.searchParams.delete('__method')
          parsedUrl.searchParams.delete('__prefer')

          const targetPath = parsedUrl.pathname.replace(/^\/supabase-api/, '')
          const targetUrl = `${SUPABASE_URL}${targetPath}${parsedUrl.search}`
          const method = (
            overrideMethod ||
            (req.headers['x-http-method'] as string | undefined) ||
            req.method ||
            'GET'
          ).toUpperCase()

          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
          }
          const rawBody = Buffer.concat(chunks)

          const upstreamHeaders: Record<string, string> = {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Accept: (req.headers['accept'] as string) || 'application/json',
          }

          const preferHeader =
            overridePrefer || (req.headers['prefer'] as string | undefined)
          if (preferHeader) {
            upstreamHeaders['Prefer'] = preferHeader
          }

          if (rawBody.length > 0 || (method !== 'GET' && method !== 'HEAD')) {
            upstreamHeaders['Content-Type'] =
              (req.headers['content-type'] as string) || 'application/json'
          }

          const upstreamRes = await fetch(targetUrl, {
            method,
            headers: upstreamHeaders,
            body:
              method !== 'GET' && method !== 'HEAD' && rawBody.length > 0
                ? rawBody.toString('utf-8')
                : undefined,
          })

          const responseText = await upstreamRes.text()
          const contentRange = upstreamRes.headers.get('content-range')
          if (contentRange) {
            res.setHeader('Content-Range', contentRange)
            res.setHeader('Access-Control-Expose-Headers', 'Content-Range')
          }

          res.setHeader(
            'Content-Type',
            upstreamRes.headers.get('content-type') || 'application/json'
          )

          // Convert 204 No Content to 200 OK with empty JSON so iframe fetch wrappers never fail
          if (upstreamRes.status === 204) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
            return
          }

          res.statusCode = upstreamRes.status
          res.end(responseText)
        } catch (err) {
          console.error('Supabase proxy middleware error:', err)
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : 'Proxy error',
            })
          )
        }
      })
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [
    supabaseProxyPlugin(),
    react(),
    VitePWA({
      selfDestroying: true,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Transfer-Posting Management System',
        short_name: 'TPMS',
        description: 'LG&CD Department, Jhang - Employee Transfer & Posting Management',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  define: {
    global: 'globalThis',
  },
})