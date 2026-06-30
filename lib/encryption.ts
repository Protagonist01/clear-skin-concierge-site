import crypto from 'node:crypto'

const KEY_ENV = 'CLEAR_SKIN_ENCRYPTION_KEY'
const LEGACY_ALGORITHM = 'aes-256-cbc'
const CURRENT_ALGORITHM = 'aes-256-gcm'
const CURRENT_VERSION = 'v2'

function getEncryptionKey(): Buffer {
  const secret = process.env[KEY_ENV]
  if (!secret) {
    throw new Error(`[encryption] ${KEY_ENV} is required for encrypted fields.`)
  }

  const decoded = Buffer.from(secret, 'base64')
  if (decoded.length === 32) {
    return decoded
  }

  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypts a plaintext string to a versioned "v2:iv:tag:ciphertext" format.
 * Returns the original input if it is empty or falsy.
 */
export function encrypt(text: string | null | undefined): string {
  if (!text) return ''

  const iv = crypto.randomBytes(12)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv(CURRENT_ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${CURRENT_VERSION}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts current "v2:iv:tag:ciphertext" values and legacy "iv:ciphertext"
 * AES-CBC values back to plaintext.
 * Safely falls back to the raw input if the format is unencrypted legacy text.
 */
export function decrypt(cipherText: string | null | undefined): string {
  if (!cipherText) return ''

  // If the text does not contain a colon (Legacy plaintext entries in database), return as is.
  if (!cipherText.includes(':')) {
    return cipherText
  }

  const parts = cipherText.split(':')

  if (parts[0] === CURRENT_VERSION) {
    const [, ivHex, tagHex, encryptedHex] = parts
    if (!ivHex || !tagHex || !encryptedHex || parts.length !== 4) {
      throw new Error('[encryption] Invalid v2 ciphertext format.')
    }

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(tagHex, 'hex')
    const key = getEncryptionKey()
    const decipher = crypto.createDecipheriv(CURRENT_ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  const [ivHex, encryptedHex] = parts
  if (!ivHex || !encryptedHex || parts.length !== 2) {
    return cipherText
  }

  const iv = Buffer.from(ivHex, 'hex')
  const key = getEncryptionKey()
  const decipher = crypto.createDecipheriv(LEGACY_ALGORITHM, key, iv)

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
