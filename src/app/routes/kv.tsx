import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

export const Route = createFileRoute('/kv')({
  component: RouteComponent
})

const KeyListSchema = z.object({ keys: z.array(z.string().nonempty()).default([]) })
const EntrySchema = z.object({ key: z.string().nonempty(), value: z.string().nonempty() })

function RouteComponent() {
  const queryClient = useQueryClient()
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [selected, setSelected] = useState<{ key: string; value: string } | undefined>(undefined)

  const { data } = useQuery({
    queryKey: ['kv'],
    queryFn: async () => {
      const response = await fetch('/api/kv')
      const result = KeyListSchema.safeParse(await response.json())
      if (!result.success) {
        throw new Error('Unexpected /api/kv response')
      }
      return result.data
    }
  })

  const putMutation = useMutation({
    mutationFn: async (entry: { key: string; value: string }) => {
      await fetch(`/api/kv/${encodeURIComponent(entry.key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: entry.value })
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kv'] })
  })

  const deleteMutation = useMutation({
    mutationFn: async (target: string) => {
      await fetch(`/api/kv/${encodeURIComponent(target)}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      setSelected(undefined)
      queryClient.invalidateQueries({ queryKey: ['kv'] })
    }
  })

  const inspect = async (target: string) => {
    const response = await fetch(`/api/kv/${encodeURIComponent(target)}`)
    if (response.ok) {
      const result = EntrySchema.safeParse(await response.json())
      if (result.success) {
        setSelected(result.data)
      }
    }
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (key.trim() === '' || value.trim() === '') return
    putMutation.mutate({ key: key.trim(), value: value.trim() })
    setKey('')
    setValue('')
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Workers KV</h1>
        <p className='text-sm text-zinc-500'>Key-value storage: list / get / put / delete</p>
      </div>
      <form onSubmit={onSubmit} className='flex gap-2'>
        <input
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder='key'
          className='w-40 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm'
        />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder='value'
          className='flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm'
        />
        <button
          type='submit'
          className='rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium'
        >
          Put
        </button>
      </form>
      <ul className='space-y-2'>
        {(data?.keys.length === 0 || data === undefined) && (
          <li className='text-sm text-zinc-400 text-center py-4'>No keys yet.</li>
        )}
        {data?.keys.map((name) => (
          <li
            key={name}
            className='flex items-center gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3'
          >
            <button type='button' onClick={() => inspect(name)} className='flex-1 text-left text-sm font-mono'>
              {name}
            </button>
            {selected?.key === name && <span className='text-sm text-zinc-500 font-mono'>= {selected.value}</span>}
            <button
              type='button'
              onClick={() => deleteMutation.mutate(name)}
              className='text-xs text-zinc-400 hover:text-red-500'
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
