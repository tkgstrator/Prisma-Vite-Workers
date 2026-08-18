import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { PrismaD1 } from '@prisma/adapter-d1'
import type { Todo } from '@/generated/prisma/client'
import { PrismaClient } from '@/generated/prisma/client'

const TodoSchema = z.object({
  id: z.uuid(),
  title: z.string().nonempty(),
  completed: z.boolean(),
  createdAt: z.iso.datetime()
})

const serialize = (todo: Todo) => ({
  id: todo.id,
  title: todo.title,
  completed: todo.completed,
  createdAt: todo.createdAt.toISOString()
})

export const todoApp = new OpenAPIHono<{ Bindings: Env }>()

todoApp.openapi(
  createRoute({
    method: 'get',
    path: '/api/todos',
    tags: ['Todo (D1 + Prisma)'],
    summary: 'List todos',
    responses: {
      200: {
        description: 'All todos ordered by creation time',
        content: { 'application/json': { schema: z.array(TodoSchema) } }
      }
    }
  }),
  async (c) => {
    const prisma = new PrismaClient({ adapter: new PrismaD1(c.env.DB) })
    const todos = await prisma.todo.findMany({ orderBy: { createdAt: 'desc' } })
    c.executionCtx.waitUntil(prisma.$disconnect())
    return c.json(todos.map(serialize))
  }
)

todoApp.openapi(
  createRoute({
    method: 'post',
    path: '/api/todos',
    tags: ['Todo (D1 + Prisma)'],
    summary: 'Create a todo',
    request: {
      body: {
        content: { 'application/json': { schema: z.object({ title: z.string().nonempty() }) } }
      }
    },
    responses: {
      201: {
        description: 'Created todo',
        content: { 'application/json': { schema: TodoSchema } }
      }
    }
  }),
  async (c) => {
    const { title } = c.req.valid('json')
    const prisma = new PrismaClient({ adapter: new PrismaD1(c.env.DB) })
    const todo = await prisma.todo.create({ data: { title } })
    c.executionCtx.waitUntil(prisma.$disconnect())
    return c.json(serialize(todo), 201)
  }
)

todoApp.openapi(
  createRoute({
    method: 'patch',
    path: '/api/todos/{id}',
    tags: ['Todo (D1 + Prisma)'],
    summary: 'Toggle completion',
    request: {
      params: z.object({ id: z.uuid() }),
      body: {
        content: { 'application/json': { schema: z.object({ completed: z.boolean() }) } }
      }
    },
    responses: {
      200: {
        description: 'Updated todo',
        content: { 'application/json': { schema: TodoSchema } }
      }
    }
  }),
  async (c) => {
    const { id } = c.req.valid('param')
    const { completed } = c.req.valid('json')
    const prisma = new PrismaClient({ adapter: new PrismaD1(c.env.DB) })
    const todo = await prisma.todo.update({ where: { id }, data: { completed } })
    c.executionCtx.waitUntil(prisma.$disconnect())
    return c.json(serialize(todo))
  }
)

todoApp.openapi(
  createRoute({
    method: 'delete',
    path: '/api/todos/{id}',
    tags: ['Todo (D1 + Prisma)'],
    summary: 'Delete a todo',
    request: {
      params: z.object({ id: z.uuid() })
    },
    responses: {
      204: { description: 'Deleted' }
    }
  }),
  async (c) => {
    const { id } = c.req.valid('param')
    const prisma = new PrismaClient({ adapter: new PrismaD1(c.env.DB) })
    await prisma.todo.delete({ where: { id } })
    c.executionCtx.waitUntil(prisma.$disconnect())
    return c.body(null, 204)
  }
)
