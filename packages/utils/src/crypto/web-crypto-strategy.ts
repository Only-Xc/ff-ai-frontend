import type { WebCryptoEncryptedCachePayload } from './types.js'

const textDecoder = new TextDecoder()
const textEncoder = new TextEncoder()

function decodeBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

function encodeBase64(bytes: Uint8Array) {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

export class WebCryptoStrategy {
  readonly algorithm = 'AES-GCM'

  readonly ivLength = 12

  readonly keyCache = new Map<string, Promise<CryptoKey>>()

  canUse() {
    return globalThis.crypto?.subtle !== undefined
  }

  async decrypt<T>(payload: WebCryptoEncryptedCachePayload, secret: string) {
    const crypto = this.requireCrypto()
    const key = await this.createKey(secret, crypto)
    const plaintext = await crypto.subtle.decrypt(
      { iv: decodeBase64(payload.iv), name: this.algorithm },
      key,
      decodeBase64(payload.ciphertext),
    )

    return JSON.parse(textDecoder.decode(plaintext)) as T
  }

  async encrypt(plaintext: string, secret: string) {
    const crypto = this.requireCrypto()
    const key = await this.createKey(secret, crypto)
    const iv = crypto.getRandomValues(new Uint8Array(this.ivLength))
    const ciphertext = await crypto.subtle.encrypt(
      { iv, name: this.algorithm },
      key,
      textEncoder.encode(plaintext),
    )

    return JSON.stringify({
      alg: this.algorithm,
      ciphertext: encodeBase64(new Uint8Array(ciphertext)),
      iv: encodeBase64(iv),
      v: 1,
    } satisfies WebCryptoEncryptedCachePayload)
  }

  async createKey(secret: string, crypto: Crypto) {
    let key = this.keyCache.get(secret)

    if (key === undefined) {
      key = crypto.subtle
        .digest('SHA-256', textEncoder.encode(secret))
        .then((digest) =>
          crypto.subtle.importKey(
            'raw',
            digest,
            { name: this.algorithm },
            false,
            ['decrypt', 'encrypt'],
          ),
        )
      this.keyCache.set(secret, key)
    }

    return key
  }

  requireCrypto() {
    const crypto = globalThis.crypto

    if (crypto?.subtle === undefined) {
      throw new Error('Web Crypto API is not available')
    }

    return crypto
  }
}
