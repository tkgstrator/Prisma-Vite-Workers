import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { z } from 'zod'

export const Route = createFileRoute('/r2')({
  component: RouteComponent
})

const ObjectListSchema = z.object({
  objects: z
    .array(
      z.object({
        key: z.string().nonempty(),
        size: z.number(),
        etag: z.string().nonempty(),
        uploaded: z.iso.datetime()
      })
    )
    .default([])
})

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function RouteComponent() {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const { data } = useQuery({
    queryKey: ['r2'],
    queryFn: async () => {
      const response = await fetch('/api/r2')
      const result = ObjectListSchema.safeParse(await response.json())
      if (!result.success) {
        throw new Error('Unexpected /api/r2 response')
      }
      return result.data
    }
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      await fetch(`/api/r2/${encodeURIComponent(file.name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': file.type !== '' ? file.type : 'application/octet-stream' },
        body: file
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['r2'] })
  })

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      await fetch(`/api/r2/${encodeURIComponent(key)}`, { method: 'DELETE' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['r2'] })
  })

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0)
    if (file !== null && file !== undefined) {
      uploadMutation.mutate(file)
    }
    if (inputRef.current !== null) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>R2 Object Storage</h1>
        <p className='text-sm text-zinc-500'>Upload, download and delete objects</p>
      </div>
      <label className='block'>
        <span className='inline-block cursor-pointer rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium'>
          {uploadMutation.isPending ? 'Uploading...' : 'Upload a file'}
        </span>
        <input ref={inputRef} type='file' onChange={onFileChange} className='hidden' />
      </label>
      <ul className='space-y-2'>
        {(data?.objects.length === 0 || data === undefined) && (
          <li className='text-sm text-zinc-400 text-center py-4'>No objects yet.</li>
        )}
        {data?.objects.map((object) => (
          <li
            key={object.key}
            className='flex items-center gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3'
          >
            <a
              href={`/api/r2/${encodeURIComponent(object.key)}`}
              target='_blank'
              rel='noreferrer'
              className='flex-1 text-sm font-mono hover:underline'
            >
              {object.key}
            </a>
            <span className='text-xs text-zinc-400'>{formatSize(object.size)}</span>
            <button
              type='button'
              onClick={() => deleteMutation.mutate(object.key)}
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
