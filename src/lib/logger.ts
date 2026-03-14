type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  data?: unknown
  timestamp: string
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ''} ${entry.message}`
  return entry.data !== undefined ? `${base} ${JSON.stringify(entry.data)}` : base
}

function log(level: LogLevel, context: string, message: string, data?: unknown) {
  if (process.env.NODE_ENV === 'test') return
  const entry: LogEntry = {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  }
  const formatted = formatEntry(entry)
  if (level === 'error') {
    process.stderr.write(formatted + '\n')
  } else if (level === 'warn') {
    process.stderr.write(formatted + '\n')
  } else if (process.env.NODE_ENV !== 'production' || level !== 'debug') {
    process.stdout.write(formatted + '\n')
  }
}

export function createLogger(context: string) {
  return {
    debug: (message: string, data?: unknown) => log('debug', context, message, data),
    info: (message: string, data?: unknown) => log('info', context, message, data),
    warn: (message: string, data?: unknown) => log('warn', context, message, data),
    error: (message: string, data?: unknown) => log('error', context, message, data),
  }
}

export const logger = createLogger('app')
