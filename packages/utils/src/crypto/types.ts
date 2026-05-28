export interface WebCryptoEncryptedCachePayload {
  alg: 'AES-GCM'
  ciphertext: string
  iv: string
  v: 1
}

export interface CryptoJsEncryptedCachePayload {
  alg: 'AES-CBC-HMAC-SHA256'
  ciphertext: string
  iv: string
  mac: string
  salt: string
  v: 1
}

export type EncryptedCachePayload =
  | CryptoJsEncryptedCachePayload
  | WebCryptoEncryptedCachePayload
