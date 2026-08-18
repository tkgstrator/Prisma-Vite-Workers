import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

const EntrySchema = z.object({
  key: z.string().nonempty(),
  value: z.string().nonempty()
})

export const kvApp = new OpenAPIHono<{ Bindings: Env }>()

kvApp.openapi(
  createRoute({
    method: 'get',
    path: '/api/kv',
    tags: ['KV'],
    summary: 'List keys',
    responses: {
      200: {
        description: 'All keys in the namespace',
        content: { 'application/json': { schema: z.object({ keys: z.array(z.string().nonempty()).default([]) }) } }
      }
    }
  }),
  async (c) => {
    const list = await c.env.KV.list()
    return c.json({ keys: list.keys.map((key) => key.name) })
  }
)

kvApp.openapi(
  createRoute({
    method: 'get',
    path: '/api/kv/{key}',
    tags: ['KV'],
    summary: 'Get a value',
    request: {
      params: z.object({ key: z.string().nonempty() })
    },
    responses: {
      200: {
        description: 'Stored value',
        content: { 'application/json': { schema: EntrySchema } }
      },
      404: { description: 'Key not found' }
    }
  }),
  async (c) => {
    const { key } = c.req.valid('param')
    const value = await c.env.KV.get(key)
    if (value === null) {
      return c.body(null, 404)
    }
    return c.json({ key, value }, 200)
  }
)

kvApp.openapi(
  createRoute({
    method: 'put',
    path: '/api/kv/{key}',
    tags: ['KV'],
    summary: 'Put a value',
    request: {
      params: z.object({ key: z.string().nonempty() }),
      body: {
        content: { 'application/json': { schema: z.object({ value: z.string().nonempty() }) } }
      }
    },
    responses: {
      200: {
        description: 'Stored entry',
        content: { 'application/json': { schema: EntrySchema } }
      }
    }
  }),
  async (c) => {
    const { key } = c.req.valid('param')
    const { value } = c.req.valid('json')
    await c.env.KV.put(key, value)
    return c.json({ key, value })
  }
)

kvApp.openapi(
  createRoute({
    method: 'delete',
    path: '/api/kv/{key}',
    tags: ['KV'],
    summary: 'Delete a key',
    request: {
      params: z.object({ key: z.string().nonempty() })
    },
    responses: {
      204: { description: 'Deleted' }
    }
  }),
  async (c) => {
    const { key } = c.req.valid('param')
    await c.env.KV.delete(key)
    return c.body(null, 204)
  }
)
