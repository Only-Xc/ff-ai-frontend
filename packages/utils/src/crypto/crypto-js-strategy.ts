import type { CryptoJsEncryptedCachePayload } from './types.js'

interface CryptoJsWordArray {
  sigBytes: number
  toString(encoder?: unknown): string
}

interface CryptoJsLike {
  AES: {
    decrypt(
      ciphertext: { ciphertext: CryptoJsWordArray },
      key: CryptoJsWordArray,
      options: CryptoJsCipherOptions,
    ): CryptoJsWordArray
    encrypt(
      plaintext: string,
      key: CryptoJsWordArray,
      options: CryptoJsCipherOptions,
    ): { ciphertext: CryptoJsWordArray }
  }
  HmacSHA256(message: string, key: CryptoJsWordArray): CryptoJsWordArray
  SHA512(message: string): CryptoJsWordArray
  enc: {
    Base64: CryptoJsEncoder
    Hex: {
      parse(value: string): CryptoJsWordArray
    }
    Utf8: unknown
  }
  lib: {
    WordArray: {
      random(bytes: number): CryptoJsWordArray
    }
  }
  mode: {
    CBC: unknown
  }
  pad: {
    Pkcs7: unknown
  }
}

interface CryptoJsCipherOptions {
  iv: CryptoJsWordArray
  mode: unknown
  padding: unknown
}

interface CryptoJsEncoder {
  parse(value: string): CryptoJsWordArray
}

interface CryptoJsModule {
  default?: CryptoJsLike
}

interface CryptoJsKeys {
  encryptionKey: CryptoJsWordArray
  macKey: CryptoJsWordArray
}

export class CryptoJsStrategy {
  readonly algorithm = 'AES-CBC-HMAC-SHA256'

  readonly ivLength = 16

  readonly saltLength = 16

  cryptoJs?: Promise<CryptoJsLike>

  async decrypt<T>(payload: CryptoJsEncryptedCachePayload, secret: string) {
    const cryptoJs = await this.loadCryptoJs()
    const keys = this.createKeys(cryptoJs, secret, payload.salt)
    const expectedMac = this.createMac(
      cryptoJs,
      {
        alg: payload.alg,
        ciphertext: payload.ciphertext,
        iv: payload.iv,
        salt: payload.salt,
        v: payload.v,
      },
      keys.macKey,
    )

    if (!this.timingSafeEqual(expectedMac, payload.mac)) {
      throw new Error('invalid encrypted cache payload')
    }

    const plaintext = cryptoJs.AES.decrypt(
      { ciphertext: cryptoJs.enc.Base64.parse(payload.ciphertext) },
      keys.encryptionKey,
      this.createCipherOptions(cryptoJs, cryptoJs.enc.Base64.parse(payload.iv)),
    ).toString(cryptoJs.enc.Utf8)

    if (plaintext.length === 0) {
      throw new Error('failed to decrypt cache value')
    }

    return JSON.parse(plaintext) as T
  }

  async encrypt(plaintext: string, secret: string) {
    const cryptoJs = await this.loadCryptoJs()
    const salt = cryptoJs.lib.WordArray.random(this.saltLength)
    const iv = cryptoJs.lib.WordArray.random(this.ivLength)
    const encodedSalt = salt.toString(cryptoJs.enc.Base64)
    const keys = this.createKeys(cryptoJs, secret, encodedSalt)
    const encrypted = cryptoJs.AES.encrypt(
      plaintext,
      keys.encryptionKey,
      this.createCipherOptions(cryptoJs, iv),
    )
    const unsignedPayload = {
      alg: this.algorithm,
      ciphertext: encrypted.ciphertext.toString(cryptoJs.enc.Base64),
      iv: iv.toString(cryptoJs.enc.Base64),
      salt: encodedSalt,
      v: 1,
    } satisfies Omit<CryptoJsEncryptedCachePayload, 'mac'>

    return JSON.stringify({
      ...unsignedPayload,
      mac: this.createMac(cryptoJs, unsignedPayload, keys.macKey),
    } satisfies CryptoJsEncryptedCachePayload)
  }

  createCipherOptions(cryptoJs: CryptoJsLike, iv: CryptoJsWordArray) {
    return {
      iv,
      mode: cryptoJs.mode.CBC,
      padding: cryptoJs.pad.Pkcs7,
    }
  }

  createKeys(
    cryptoJs: CryptoJsLike,
    secret: string,
    salt: string,
  ): CryptoJsKeys {
    const keyHex = cryptoJs
      .SHA512(`${secret}:${salt}`)
      .toString(cryptoJs.enc.Hex)

    return {
      encryptionKey: cryptoJs.enc.Hex.parse(keyHex.slice(0, 64)),
      macKey: cryptoJs.enc.Hex.parse(keyHex.slice(64)),
    }
  }

  createMac(
    cryptoJs: CryptoJsLike,
    data: Omit<CryptoJsEncryptedCachePayload, 'mac'>,
    macKey: CryptoJsWordArray,
  ) {
    return cryptoJs
      .HmacSHA256(
        `${data.v}.${data.alg}.${data.salt}.${data.iv}.${data.ciphertext}`,
        macKey,
      )
      .toString(cryptoJs.enc.Base64)
  }

  async loadCryptoJs() {
    this.cryptoJs ??= import('crypto-js').then((module) => {
      const cryptoJsModule = module as unknown as CryptoJsLike | CryptoJsModule
      const cryptoJs =
        'default' in cryptoJsModule && cryptoJsModule.default !== undefined
          ? cryptoJsModule.default
          : cryptoJsModule

      if (!('AES' in cryptoJs)) {
        throw new Error('CryptoJS is not available')
      }

      return cryptoJs
    })

    return this.cryptoJs
  }

  timingSafeEqual(left: string, right: string) {
    if (left.length !== right.length) {
      return false
    }

    let diff = 0

    for (let index = 0; index < left.length; index += 1) {
      diff |= left.charCodeAt(index) ^ right.charCodeAt(index)
    }

    return diff === 0
  }
}
