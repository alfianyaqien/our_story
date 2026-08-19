import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

/**
 * At-rest encryption for love letters.
 *
 * Replaces `CryptoJS.AES.encrypt(text, passphrase)`, which had two problems:
 *
 *  - `const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-...'`
 *    meant a deployment that forgot the variable silently encrypted everything
 *    with a key committed to this repository.
 *  - Passing a passphrase to CryptoJS derives the key with OpenSSL's
 *    EVP_BytesToKey (a single MD5 pass, no configurable work factor) and gives
 *    AES-CBC with no authentication, so ciphertexts can be tampered with
 *    undetectably.
 *
 * Now: scrypt to derive a 256-bit key, AES-256-GCM for authenticated
 * encryption, a fresh random IV per message, and a version prefix so the
 * format can change again later without guesswork.
 *
 * Stored form:  v1:<salt b64url>:<iv b64url>:<authTag b64url>:<ciphertext b64url>
 *
 * The salt is per-message, so two identical letters do not produce identical
 * ciphertext, and deriving the key is deliberately expensive per call - fine
 * for the volume here (a letter at a time), and not on any hot path.
 */

const VERSION = 'v1';
const KEY_LENGTH = 32; // AES-256
const IV_LENGTH = 12; // GCM standard
const SALT_LENGTH = 16;

/**
 * Fail closed. There is no safe default: a fallback key published in the
 * repository is equivalent to storing the letters in plaintext, while looking
 * like encryption.
 */
function passphrase(): string {
  const value = process.env.ENCRYPTION_KEY;
  if (!value || value.length < 32) {
    throw new Error(
      'ENCRYPTION_KEY must be set to at least 32 characters. ' +
        'Generate one with: openssl rand -base64 48\n' +
        'Keep it safe and never change it - letters encrypted with an old ' +
        'key cannot be recovered.'
    );
  }
  return value;
}

function deriveKey(salt: Buffer): Buffer {
  return scryptSync(passphrase(), salt, KEY_LENGTH);
}

export function encrypt(text: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(salt), iv);

  const ciphertext = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    salt.toString('base64url'),
    iv.toString('base64url'),
    authTag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');

  if (parts[0] !== VERSION || parts.length !== 5) {
    // Anything not in the current format is unreadable rather than silently
    // wrong. Nothing was ever stored in the old CryptoJS format in this
    // database (love_letters was empty when the format changed), so this
    // signals corruption or a key change, not a legacy row.
    throw new Error('Unrecognised ciphertext format');
  }

  const [, saltB64, ivB64, tagB64, dataB64] = parts;
  const decipher = createDecipheriv(
    'aes-256-gcm',
    deriveKey(Buffer.from(saltB64, 'base64url')),
    Buffer.from(ivB64, 'base64url')
  );
  // Throws on mismatch, so tampering surfaces instead of yielding garbage.
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
