export type QueueExecutor<T> = (item: T) => boolean

export class ExecutableQueue<T> {
  private items: T[] = []

  get size(): number {
    return this.items.length
  }

  clear(): void {
    this.items = []
  }

  enqueue(item: T): void {
    this.items.push(item)
  }

  executeOrEnqueue(item: T, executor: QueueExecutor<T>): boolean {
    if (executor(item)) {
      return true
    }

    this.enqueue(item)
    return false
  }

  flush(executor: QueueExecutor<T>): void {
    const pending = this.items

    this.items = []

    for (let index = 0; index < pending.length; index += 1) {
      const item = pending[index]

      if (executor(item)) continue

      this.items = pending.slice(index).concat(this.items)
      return
    }
  }

  remove(predicate: (item: T) => boolean): T | null {
    const index = this.items.findIndex(predicate)

    if (index < 0) {
      return null
    }

    const [item] = this.items.splice(index, 1)

    return item ?? null
  }
}
