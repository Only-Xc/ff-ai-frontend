import { CryptoJsStrategy } from './crypto-js-strategy.js'
import type {
  CryptoJsEncryptedCachePayload,
  EncryptedCachePayload,
  WebCryptoEncryptedCachePayload,
} from './types.js'
import { WebCryptoStrategy } from './web-crypto-strategy.js'

class CacheCrypto {
  readonly cryptoJs = new CryptoJsStrategy()

  readonly webCrypto = new WebCryptoStrategy()

  async decrypt<T = unknown>(payload: string, secret: string) {
    this.assertSecret(secret)

    const data = this.parsePayload(payload)

    if (data.alg === this.webCrypto.algorithm) {
      return this.webCrypto.decrypt<T>(data, secret)
    }

    return this.cryptoJs.decrypt<T>(data, secret)
  }

  async encrypt(value: unknown, secret: string) {
    this.assertSecret(secret)

    const plaintext = JSON.stringify(value)

    if (plaintext === undefined) {
      throw new Error('cache value must be JSON serializable')
    }

    if (this.webCrypto.canUse()) {
      return this.webCrypto.encrypt(plaintext, secret)
    }

    return this.cryptoJs.encrypt(plaintext, secret)
  }

  assertSecret(secret: string) {
    if (secret.length === 0) {
      throw new Error('crypto secret must not be empty')
    }
  }

  parsePayload(payload: string): EncryptedCachePayload {
    const data = JSON.parse(payload) as Partial<EncryptedCachePayload>

    if (
      data.v !== 1 ||
      typeof data.iv !== 'string' ||
      typeof data.ciphertext !== 'string'
    ) {
      throw new Error('invalid encrypted cache payload')
    }

    if (data.alg === this.webCrypto.algorithm) {
      return data as WebCryptoEncryptedCachePayload
    }

    if (
      data.alg === this.cryptoJs.algorithm &&
      typeof data.salt === 'string' &&
      typeof data.mac === 'string'
    ) {
      return data as CryptoJsEncryptedCachePayload
    }

    throw new Error('invalid encrypted cache payload')
  }
}

const cacheCrypto = new CacheCrypto()

export function encryptCacheValue(value: unknown, secret: string) {
  return cacheCrypto.encrypt(value, secret)
}

export function decryptCacheValue<T = unknown>(
  payload: string,
  secret: string,
) {
  return cacheCrypto.decrypt<T>(payload, secret)
}
