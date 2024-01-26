import type * as http from 'http'
import { getRequestListener } from '@hono/node-server'
import { Plugin as VitePlugin, ViteDevServer, Connect, createViteRuntime } from 'vite'
import { EdgeRunner } from './runtime'

const exclude = [/.*\.ts$/, /.*\.tsx$/, /^\/@.+$/, /^\/favicon\.ico$/, /^\/static\/.+/, /^\/node_modules\/.*/]

type Options = {
  entry: string
}

export function devServer(options: Options): VitePlugin {
  const entry = options.entry
  const plugin: VitePlugin = {
    name: 'edge-dev-server',
    configureServer: async (server) => {
      async function createMiddleware(server: ViteDevServer): Promise<Connect.HandleFunction> {
        return async function (
          req: http.IncomingMessage,
          res: http.ServerResponse,
          next: Connect.NextFunction
        ): Promise<void> {
          for (const pattern of exclude) {
            if (req.url) {
              if (pattern instanceof RegExp) {
                if (pattern.test(req.url)) {
                  return next()
                }
              }
            }
          }

          const runner = new EdgeRunner()
          runner.setup()

          const runtime = await createViteRuntime(server, { runner })

          let appModule

          try {
            appModule = await runtime.executeEntrypoint(entry)
          } catch (e) {
            return next(e)
          }

          const app = appModule['default'] as { fetch: typeof fetch }

          if (!app) {
            return next(new Error(`Failed to find a named export "default" from ${entry}`))
          }

          getRequestListener(async (request) => {
            const response = await app.fetch(request)
            if (response.headers.get('content-type')?.match(/^text\/html/)) {
              const script = '<script>import("/@vite/client")</script>'
              return injectStringToResponse(response, script)
            }
            return response
          })(req, res)
        }
      }

      server.middlewares.use(await createMiddleware(server))
    }
  }
  return plugin
}

function injectStringToResponse(response: Response, content: string) {
  const stream = response.body
  const newContent = new TextEncoder().encode(content)

  if (!stream) return null

  const reader = stream.getReader()
  const newContentReader = new ReadableStream({
    start(controller) {
      controller.enqueue(newContent)
      controller.close()
    }
  }).getReader()

  const combinedStream = new ReadableStream({
    async start(controller) {
      for (;;) {
        const [existingResult, newContentResult] = await Promise.all([reader.read(), newContentReader.read()])

        if (existingResult.done && newContentResult.done) {
          controller.close()
          break
        }

        if (!existingResult.done) {
          controller.enqueue(existingResult.value)
        }
        if (!newContentResult.done) {
          controller.enqueue(newContentResult.value)
        }
      }
    }
  })

  const headers = new Headers(response.headers)
  headers.delete('content-length')

  return new Response(combinedStream, {
    headers,
    status: response.status
  })
}
