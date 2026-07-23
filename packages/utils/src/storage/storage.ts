import type { StorageApi, StorageSetOptions } from './types.js'

interface StorageValue<T> {
  expiresAt?: number
  value: T
}

function getExpiresAt(options?: StorageSetOptions) {
  if (options?.expiresIn === undefined) {
    return undefined
  }

  if (!Number.isFinite(options.expiresIn)) {
    throw new RangeError('storage expiresIn must be a finite number')
  }

  return Date.now() + options.expiresIn
}

function createStorageApi(storage: Storage): StorageApi {
  return {
    clear() {
      storage.clear()
    },
    get<T>(key: string) {
      const item = storage.getItem(key)

      if (item === null) {
        return undefined
      }

      // Legacy payloads (e.g. raw JWTs set before the {value, expiresAt} wrapper
      // existed) are stored as bare strings and fail JSON.parse. Fall back to
      // returning the raw value so they keep flowing through typed callers
      // (e.g. local.get<string>(...)) without crashing the store initializer.
      let data: unknown
      try {
        data = JSON.parse(item)
      } catch {
        return item as unknown as T
      }

      if (data === null || typeof data !== 'object') {
        return undefined
      }

      const wrapper = data as StorageValue<T>

      if (wrapper.expiresAt !== undefined && Date.now() >= wrapper.expiresAt) {
        storage.removeItem(key)
        return undefined
      }

      return wrapper.value
    },
    remove(key: string) {
      storage.removeItem(key)
    },
    set<T>(key: string, value: T, options?: StorageSetOptions) {
      storage.setItem(
        key,
        JSON.stringify({
          expiresAt: getExpiresAt(options),
          value,
        }),
      )
    },
  }
}

export const session = createStorageApi(window.sessionStorage)
export const local = createStorageApi(window.localStorage)
