import { OpenAPIHono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import { counterApp } from '@/server/routes/counter'
import { kvApp } from '@/server/routes/kv'
import { r2App } from '@/server/routes/r2'
import { todoApp } from '@/server/routes/todo'

export { Counter } from '@/server/durable-objects/counter'

const app = new OpenAPIHono<{ Bindings: Env }>()

app.route('/', todoApp)
app.route('/', kvApp)
app.route('/', r2App)
app.route('/', counterApp)

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Prisma Vite Workers API',
    version: '1.0.0'
  }
})

app.get(
  '/docs',
  apiReference({
    url: '/openapi.json',
    pageTitle: 'API Reference'
  })
)

export default app
