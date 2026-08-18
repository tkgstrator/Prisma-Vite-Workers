import { DurableObject } from 'cloudflare:workers'

/**
 * SQLite-backed Durable Object demonstrating:
 * - SQL storage API (ctx.storage.sql)
 * - RPC methods (called directly on the stub, e.g. env.COUNTER.getByName('global').increment())
 * - WebSocket Hibernation API (ctx.acceptWebSocket + webSocketMessage/Close/Error handlers)
 */
export class Counter extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)')
      this.ctx.storage.sql.exec('INSERT OR IGNORE INTO counter (id, value) VALUES (1, 0)')
    })
  }

  getCount(): number {
    return this.ctx.storage.sql.exec<{ value: number }>('SELECT value FROM counter WHERE id = 1').one().value
  }

  increment(): number {
    const { value } = this.ctx.storage.sql
      .exec<{ value: number }>('UPDATE counter SET value = value + 1 WHERE id = 1 RETURNING value')
      .one()
    this.broadcast(value)
    return value
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }
    const { 0: client, 1: server } = new WebSocketPair()
    // Hibernation API: the runtime can evict this object from memory while
    // keeping the socket open, and wakes it up when a message arrives.
    this.ctx.acceptWebSocket(server)
    server.send(JSON.stringify({ type: 'count', value: this.getCount() }))
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(_ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (message === 'increment') {
      this.increment()
    }
  }

  async webSocketClose(ws: WebSocket, code: number, _reason: string, _wasClean: boolean): Promise<void> {
    ws.close(code === 1005 ? 1000 : code)
  }

  async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
    ws.close(1011)
  }

  private broadcast(value: number): void {
    const payload = JSON.stringify({ type: 'count', value })
    for (const ws of this.ctx.getWebSockets()) {
      ws.send(payload)
    }
  }
}
