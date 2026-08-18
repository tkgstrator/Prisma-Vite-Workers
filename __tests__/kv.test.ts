import { describe, expect, test } from 'bun:test'
import { z } from 'zod'
import { kvApp } from '../src/server/routes/kv'

const createMockKv = () => {
  const store = new Map<string, string>()
  return {
    get: async (key: string) => {
      const value = store.get(key)
      return value !== undefined ? value : null
    },
    put: async (key: string, value: string) => {
      store.set(key, value)
    },
    delete: async (key: string) => {
      store.delete(key)
    },
    list: async () => ({
      keys: Array.from(store.keys()).map((name) => ({ name })),
      list_complete: true,
      cacheStatus: null
    })
  }
}

describe('KV routes', () => {
  test('put, list, get and delete round-trip', async () => {
    const env = { KV: createMockKv() }

    const putResponse = await kvApp.request(
      '/api/kv/greeting',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 'hello' })
      },
      env
    )
    expect(putResponse.status).toBe(200)

    const listResponse = await kvApp.request('/api/kv', {}, env)
    expect(listResponse.status).toBe(200)
    const listed = z.object({ keys: z.array(z.string()) }).parse(await listResponse.json())
    expect(listed.keys).toEqual(['greeting'])

    const getResponse = await kvApp.request('/api/kv/greeting', {}, env)
    expect(getResponse.status).toBe(200)
    const entry = z.object({ key: z.string(), value: z.string() }).parse(await getResponse.json())
    expect(entry).toEqual({ key: 'greeting', value: 'hello' })

    const deleteResponse = await kvApp.request('/api/kv/greeting', { method: 'DELETE' }, env)
    expect(deleteResponse.status).toBe(204)

    const missingResponse = await kvApp.request('/api/kv/greeting', {}, env)
    expect(missingResponse.status).toBe(404)
  })

  test('rejects empty value', async () => {
    const env = { KV: createMockKv() }
    const response = await kvApp.request(
      '/api/kv/some-key',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: '' })
      },
      env
    )
    expect(response.status).toBe(400)
  })
})
