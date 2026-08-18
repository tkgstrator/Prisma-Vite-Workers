import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

export const Route = createFileRoute('/todo')({
  component: RouteComponent
})

const TodoSchema = z.object({
  id: z.uuid(),
  title: z.string().nonempty(),
  completed: z.boolean(),
  createdAt: z.iso.datetime()
})

const TodoListSchema = z.array(TodoSchema).default([])

function RouteComponent() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')

  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos')
      const result = TodoListSchema.safeParse(await response.json())
      if (!result.success) {
        throw new Error('Unexpected /api/todos response')
      }
      return result.data
    }
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['todos'] })

  const createMutation = useMutation({
    mutationFn: async (value: string) => {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: value })
      })
    },
    onSuccess: invalidate
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })
    },
    onSuccess: invalidate
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    },
    onSuccess: invalidate
  })

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (title.trim() === '') return
    createMutation.mutate(title.trim())
    setTitle('')
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Todo</h1>
        <p className='text-sm text-zinc-500'>Cloudflare D1 + Prisma (@prisma/adapter-d1)</p>
      </div>
      <form onSubmit={onSubmit} className='flex gap-2'>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder='What needs to be done?'
          className='flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm'
        />
        <button
          type='submit'
          className='rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium'
        >
          Add
        </button>
      </form>
      <ul className='space-y-2'>
        {todos.map((todo) => (
          <li
            key={todo.id}
            className='flex items-center gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3'
          >
            <input
              type='checkbox'
              checked={todo.completed}
              onChange={() => toggleMutation.mutate({ id: todo.id, completed: !todo.completed })}
            />
            <span className={todo.completed ? 'flex-1 text-sm line-through text-zinc-400' : 'flex-1 text-sm'}>
              {todo.title}
            </span>
            <button
              type='button'
              onClick={() => deleteMutation.mutate(todo.id)}
              className='text-xs text-zinc-400 hover:text-red-500'
            >
              Delete
            </button>
          </li>
        ))}
        {todos.length === 0 && <li className='text-sm text-zinc-400 text-center py-4'>No todos yet.</li>}
      </ul>
    </div>
  )
}
