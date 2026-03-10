// WebSocket-like connection manager for SSE streams

type StreamController = ReadableStreamDefaultController<Uint8Array>

class WebSocketManager {
  private subscribers = new Map<string, Set<StreamController>>()
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.startHeartbeat()
  }

  subscribe(symbol: string, controller: StreamController): void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set())
    }
    this.subscribers.get(symbol)!.add(controller)
  }

  unsubscribe(symbol: string, controller: StreamController): void {
    const subs = this.subscribers.get(symbol)
    if (subs) {
      subs.delete(controller)
      if (subs.size === 0) {
        this.subscribers.delete(symbol)
      }
    }
  }

  unsubscribeAll(controller: StreamController): void {
    for (const [symbol, subs] of this.subscribers) {
      subs.delete(controller)
      if (subs.size === 0) {
        this.subscribers.delete(symbol)
      }
    }
  }

  broadcast(symbol: string, data: unknown): void {
    const subs = this.subscribers.get(symbol)
    if (!subs) return
    const message = `data: ${JSON.stringify(data)}\n\n`
    const encoded = new TextEncoder().encode(message)
    for (const controller of subs) {
      try {
        controller.enqueue(encoded)
      } catch {
        subs.delete(controller)
      }
    }
  }

  getSubscriberCount(symbol: string): number {
    return this.subscribers.get(symbol)?.size ?? 0
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) return
    this.heartbeatInterval = setInterval(() => {
      const heartbeat = new TextEncoder().encode(': heartbeat\n\n')
      for (const subs of this.subscribers.values()) {
        for (const controller of subs) {
          try {
            controller.enqueue(heartbeat)
          } catch {
            subs.delete(controller)
          }
        }
      }
    }, 30000)
  }
}

// Singleton
const globalForWs = globalThis as unknown as { wsManager?: WebSocketManager }
export const wsManager = globalForWs.wsManager ?? (globalForWs.wsManager = new WebSocketManager())
