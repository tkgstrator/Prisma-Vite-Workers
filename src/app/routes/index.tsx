import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent
})

const features = [
  {
    to: '/todo',
    title: 'D1 + Prisma',
    description: 'Todo CRUD backed by Cloudflare D1 through @prisma/adapter-d1.'
  },
  {
    to: '/kv',
    title: 'Workers KV',
    description: 'Simple key-value storage with list, get, put and delete.'
  },
  {
    to: '/r2',
    title: 'R2 Object Storage',
    description: 'File upload and download with ETag-based caching.'
  },
  {
    to: '/counter',
    title: 'Durable Objects',
    description: 'SQLite-backed counter with RPC and realtime WebSocket broadcast.'
  }
]

function RouteComponent() {
  return (
    <div className='space-y-8'>
      <div className='text-center space-y-2 py-8'>
        <h1 className='text-4xl font-bold'>Prisma Vite Workers</h1>
        <p className='text-zinc-500'>Hono + Prisma + Vite + React on Cloudflare Workers</p>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        {features.map((feature) => (
          <Link
            key={feature.to}
            to={feature.to}
            className='block rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors'
          >
            <h2 className='font-semibold mb-1'>{feature.title}</h2>
            <p className='text-sm text-zinc-500'>{feature.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
