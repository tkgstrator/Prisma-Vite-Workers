import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

export const Route = createFileRoute('/counter')({
  component: RouteComponent
})

const MessageSchema = z.object({
  type: z.literal('count'),
  value: z.number()
})

function RouteComponent() {
  const [count, setCount] = useState<number | undefined>(undefined)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<WebSocket | undefined>(undefined)

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/counter/ws`)
    socketRef.current = socket

    socket.addEventListener('open', () => setConnected(true))
    socket.addEventListener('close', () => setConnected(false))
    socket.addEventListener('message', (event) => {
      const parsed = MessageSchema.safeParse(JSON.parse(event.data))
      if (parsed.success) {
        setCount(parsed.data.value)
      }
    })

    return () => socket.close()
  }, [])

  const incrementViaHttp = async () => {
    await fetch('/api/counter/increment', { method: 'POST' })
  }

  const incrementViaWebSocket = () => {
    socketRef.current?.send('increment')
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Counter</h1>
        <p className='text-sm text-zinc-500'>
          SQLite-backed Durable Object with RPC and WebSocket Hibernation. Open this page in two tabs to see realtime
          sync.
        </p>
      </div>
      <div className='rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center space-y-6'>
        <div className='text-6xl font-bold tabular-nums'>{count !== undefined ? count : '–'}</div>
        <div className='flex justify-center gap-3'>
          <button
            type='button'
            onClick={incrementViaHttp}
            className='rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium'
          >
            +1 via HTTP (RPC)
          </button>
          <button
            type='button'
            onClick={incrementViaWebSocket}
            className='rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium'
          >
            +1 via WebSocket
          </button>
        </div>
        <p className='text-xs text-zinc-400'>{connected ? 'WebSocket connected' : 'WebSocket disconnected'}</p>
      </div>
    </div>
  )
}
