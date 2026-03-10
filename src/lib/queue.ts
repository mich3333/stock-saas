export type JobType = 'send-alert' | 'refresh-cache' | 'send-email'

interface Job {
  id: string
  type: JobType
  payload: Record<string, unknown>
  scheduledAt: number
  attempts: number
  maxRetries: number
}

class JobQueue {
  private jobs: Job[] = []
  private processing = false
  private counter = 0

  constructor() {
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.processQueue(), 10_000)
    }
  }

  enqueue(type: JobType, payload: Record<string, unknown>, delayMs = 0): string {
    const id = `job_${++this.counter}_${Date.now()}`
    this.jobs.push({
      id,
      type,
      payload,
      scheduledAt: Date.now() + delayMs,
      attempts: 0,
      maxRetries: 3,
    })
    return id
  }

  async processQueue(): Promise<void> {
    if (this.processing) return
    this.processing = true

    const now = Date.now()
    const ready = this.jobs.filter(j => j.scheduledAt <= now)

    for (const job of ready) {
      try {
        job.attempts++
        await this.executeJob(job)
        this.jobs = this.jobs.filter(j => j.id !== job.id)
      } catch (error) {
        console.error(`Job ${job.id} (${job.type}) failed attempt ${job.attempts}:`, error)
        if (job.attempts >= job.maxRetries) {
          console.error(`Job ${job.id} exhausted retries, removing.`)
          this.jobs = this.jobs.filter(j => j.id !== job.id)
        } else {
          // Exponential backoff: 2^attempts * 1000ms
          job.scheduledAt = now + Math.pow(2, job.attempts) * 1000
        }
      }
    }

    this.processing = false
  }

  private async executeJob(job: Job): Promise<void> {
    switch (job.type) {
      case 'send-alert':
        console.log(`[queue] Processing alert:`, job.payload)
        break
      case 'refresh-cache':
        console.log(`[queue] Refreshing cache:`, job.payload)
        break
      case 'send-email':
        console.log(`[queue] Sending email:`, job.payload)
        break
      default:
        console.warn(`[queue] Unknown job type: ${job.type}`)
    }
  }

  get pending(): number {
    return this.jobs.length
  }
}

export const jobQueue = new JobQueue()
