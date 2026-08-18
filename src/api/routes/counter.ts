import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

const CountSchema = z.object({
  value: z.number()
})

export const counterApp = new OpenAPIHono<{ Bindings: Env }>()

counterApp.openapi(
  createRoute({
    method: 'get',
    path: '/api/counter',
    tags: ['Counter (Durable Object)'],
    summary: 'Get the current count',
    responses: {
      200: {
        description: 'Current counter value',
        content: { 'application/json': { schema: CountSchema } }
      }
    }
  }),
  async (c) => {
    const stub = c.env.COUNTER.getByName('global')
    const value = await stub.getCount()
    return c.json({ value })
  }
)

counterApp.openapi(
  createRoute({
    method: 'post',
    path: '/api/counter/increment',
    tags: ['Counter (Durable Object)'],
    summary: 'Increment the count',
    description: 'Increments via RPC and broadcasts the new value to every connected WebSocket.',
    responses: {
      200: {
        description: 'New counter value',
        content: { 'application/json': { schema: CountSchema } }
      }
    }
  }),
  async (c) => {
    const stub = c.env.COUNTER.getByName('global')
    const value = await stub.increment()
    return c.json({ value })
  }
)

// WebSocket endpoint (not part of the OpenAPI spec — upgrade requests are proxied to the DO)
counterApp.get('/api/counter/ws', (c) => {
  const stub = c.env.COUNTER.getByName('global')
  return stub.fetch(c.req.raw)
})
