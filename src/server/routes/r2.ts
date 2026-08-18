import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

const ObjectSchema = z.object({
  key: z.string().nonempty(),
  size: z.number(),
  etag: z.string().nonempty(),
  uploaded: z.iso.datetime()
})

export const r2App = new OpenAPIHono<{ Bindings: Env }>()

r2App.openapi(
  createRoute({
    method: 'get',
    path: '/api/r2',
    tags: ['R2'],
    summary: 'List objects',
    responses: {
      200: {
        description: 'All objects in the bucket',
        content: { 'application/json': { schema: z.object({ objects: z.array(ObjectSchema).default([]) }) } }
      }
    }
  }),
  async (c) => {
    const list = await c.env.BUCKET.list()
    return c.json({
      objects: list.objects.map((object) => ({
        key: object.key,
        size: object.size,
        etag: object.httpEtag,
        uploaded: object.uploaded.toISOString()
      }))
    })
  }
)

r2App.openapi(
  createRoute({
    method: 'get',
    path: '/api/r2/{key}',
    tags: ['R2'],
    summary: 'Download an object',
    request: {
      params: z.object({ key: z.string().nonempty() })
    },
    responses: {
      200: { description: 'Object body' },
      304: { description: 'Not modified' },
      404: { description: 'Object not found' }
    }
  }),
  async (c) => {
    const { key } = c.req.valid('param')
    const object = await c.env.BUCKET.get(key)
    if (object === null) {
      return c.body(null, 404)
    }
    const etag = object.httpEtag
    if (c.req.header('If-None-Match') === etag) {
      return c.body(null, 304)
    }
    const contentType = object.httpMetadata?.contentType
    return c.body(object.body, 200, {
      'Content-Type': contentType !== undefined ? contentType : 'application/octet-stream',
      ETag: etag,
      'Cache-Control': 'public, max-age=3600'
    })
  }
)

r2App.openapi(
  createRoute({
    method: 'put',
    path: '/api/r2/{key}',
    tags: ['R2'],
    summary: 'Upload an object',
    description: 'Send the raw file as the request body. Content-Type is preserved as object metadata.',
    request: {
      params: z.object({ key: z.string().nonempty() })
    },
    responses: {
      201: {
        description: 'Uploaded object',
        content: { 'application/json': { schema: ObjectSchema } }
      }
    }
  }),
  async (c) => {
    const { key } = c.req.valid('param')
    const contentType = c.req.header('Content-Type')
    const object = await c.env.BUCKET.put(key, c.req.raw.body, {
      httpMetadata: { contentType: contentType !== undefined ? contentType : 'application/octet-stream' }
    })
    return c.json(
      {
        key: object.key,
        size: object.size,
        etag: object.httpEtag,
        uploaded: object.uploaded.toISOString()
      },
      201
    )
  }
)

r2App.openapi(
  createRoute({
    method: 'delete',
    path: '/api/r2/{key}',
    tags: ['R2'],
    summary: 'Delete an object',
    request: {
      params: z.object({ key: z.string().nonempty() })
    },
    responses: {
      204: { description: 'Deleted' }
    }
  }),
  async (c) => {
    const { key } = c.req.valid('param')
    await c.env.BUCKET.delete(key)
    return c.body(null, 204)
  }
)
