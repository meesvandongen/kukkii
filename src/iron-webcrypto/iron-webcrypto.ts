import type {
  GenerateKeyOptions,
  HMacResult,
  Key,
  SealOptionsSub,
} from "./types";
import {
  base64urlDecode,
  base64urlEncode,
  bufferToString,
  stringToBuffer,
} from "./utils";

const encryption: SealOptionsSub = {
  saltBits: 256,
  algorithm: "aes-256-cbc",
  iterations: 1,
};

const integrity: SealOptionsSub = {
  saltBits: 256,
  algorithm: "sha256",
  iterations: 1,
};

/**
 * Configuration of each supported algorithm.
 */
export const algorithms = {
  "aes-256-cbc": { keyBits: 256, ivBits: 128, name: "AES-CBC" },
  sha256: { keyBits: 256, name: "SHA-256" },
} as const;

/**
 * Generates cryptographically strong pseudorandom bytes.
 * @param size Number of bytes to generate
 * @returns Buffer
 */
function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generate cryptographically strong pseudorandom bits.
 * @param bits Number of bits to generate
 * @returns Buffer
 */
export function randomBits(bits: number): Uint8Array {
  if (bits < 1) throw new Error("Invalid random bits count");
  const bytes = Math.ceil(bits / 8);
  return randomBytes(bytes);
}

/**
 * Provides an asynchronous Password-Based Key Derivation Function 2 (PBKDF2) implementation.
 * @param password A password string or buffer key
 * @param salt A salt string or buffer
 * @param iterations The number of iterations to use
 * @param keyLength The length of the derived key in bytes
 * @param hash The hash algorithm to use
 */
async function pbkdf2(
  password: string,
  salt: string,
  iterations: number,
  keyLength: number,
): Promise<ArrayBuffer> {
  const passwordBuffer = stringToBuffer(password);
  const importedKey = await globalThis.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const saltBuffer = stringToBuffer(salt);
  const derivation = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-1", salt: saltBuffer, iterations },
    importedKey,
    keyLength * 8,
  );
  return derivation;
}

/**
 * Generates a key from the password.
 * @param password A password string or buffer key
 * @param options Object used to customize the key derivation algorithm
 * @returns An object with keys: key, salt, iv
 */
export async function generateKey(
  password: string,
  options: GenerateKeyOptions,
): Promise<Key> {
  const algorithm = algorithms[options.algorithm];

  const hmac = options.hmac ?? false;
  const id = hmac
    ? { name: "HMAC", hash: algorithm.name }
    : { name: algorithm.name };
  const usage: KeyUsage[] = hmac ? ["sign", "verify"] : ["encrypt", "decrypt"];

  let { salt = "" } = options;
  if (!salt) {
    const { saltBits } = options;
    if (!saltBits) {
      throw new Error("Missing salt and saltBits options");
    }
    const randomSalt = randomBits(saltBits);
    salt = [...new Uint8Array(randomSalt)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  }

  const derivedKey = await pbkdf2(
    password,
    salt,
    options.iterations,
    algorithm.keyBits / 8,
  );
  const importedEncryptionKey = await globalThis.crypto.subtle.importKey(
    "raw",
    derivedKey,
    id,
    false,
    usage,
  );

  const result: Partial<Key> = {
    key: importedEncryptionKey,
    salt,
  };

  if (options.iv) {
    result.iv = options.iv;
  } else if ("ivBits" in algorithm) {
    result.iv = randomBits(algorithm.ivBits);
  }
  return result as Key;
}

/**
 * Encrypts data.
 * @param password A password string or buffer key
 * @param options Object used to customize the key derivation algorithm
 * @param data String to encrypt
 * @returns An object with keys: encrypted, key
 */
export async function encrypt(
  password: string,
  options: GenerateKeyOptions,
  data: string,
): Promise<{ encrypted: Uint8Array; key: Key }> {
  const key = await generateKey(password, options);
  const textBuffer = stringToBuffer(data);
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: algorithms[options.algorithm].name, iv: key.iv },
    key.key,
    textBuffer,
  );
  return { encrypted: new Uint8Array(encrypted), key };
}

/**
 * Decrypts data.
 * @param password A password string or buffer key
 * @param options Object used to customize the key derivation algorithm
 * @param data Buffer to decrypt
 * @returns Decrypted string
 */
export async function decrypt(
  password: string,
  options: GenerateKeyOptions,
  data: Uint8Array | string,
): Promise<string> {
  const key = await generateKey(password, options);
  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: algorithms[options.algorithm].name, iv: key.iv },
    key.key,
    typeof data === "string" ? stringToBuffer(data) : data,
  );
  return bufferToString(new Uint8Array(decrypted));
}

/**
 * Calculates a HMAC digest.
 * @param password A password string or buffer
 * @param options Object used to customize the key derivation algorithm
 * @param data String to calculate the HMAC over
 * @returns An object with keys: digest, salt
 */
export async function hmacWithPassword(
  password: string,
  options: GenerateKeyOptions,
  data: string,
): Promise<HMacResult> {
  const key = await generateKey(password, {
    ...options,
    hmac: true,
  });
  const textBuffer = stringToBuffer(data);
  const signed = await globalThis.crypto.subtle.sign(
    { name: "HMAC" },
    key.key,
    textBuffer,
  );
  const digest = base64urlEncode(new Uint8Array(signed));
  return { digest, salt: key.salt };
}

/**
 * Serializes, encrypts, and signs objects into an iron protocol string.
 * @param value Data being sealed
 * @param password A string, buffer or object
 * @param options Object used to customize the key derivation algorithm
 * @returns Iron sealed string
 */
export async function seal(value: string, password: string): Promise<string> {
  const { encrypted, key } = await encrypt(password, encryption, value);

  const encryptedB64 = base64urlEncode(new Uint8Array(encrypted));
  const iv = base64urlEncode(key.iv);
  const macBaseString = `${key.salt}*${iv}*${encryptedB64}`;

  const mac = await hmacWithPassword(password, integrity, macBaseString);

  return `${macBaseString}*${mac.salt}*${mac.digest}`;
}

/**
 * Implements a constant-time comparison algorithm.
 * @param a Original string (running time is always proportional to its length)
 * @param b String to compare to original string
 * @returns Returns true if `a` is equal to `b`, without leaking timing information
 *          that would allow an attacker to guess one of the values.
 */
function fixedTimeComparison(a: string, b: string): boolean {
  let mismatch = a.length === b.length ? 0 : 1;

  if (mismatch) {
    b = a;
  }

  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verifies, decrypts, and reconstruct an iron protocol string into an object.
 * @param sealed The iron protocol string generated with seal()
 * @param password A string, buffer, or object
 * @param options Object used to customize the key derivation algorithm
 * @returns The verified decrypted object
 */
export async function unseal(
  sealed: string,
  password: string,
): Promise<string> {
  const parts = sealed.split("*");
  if (parts.length !== 5) {
    throw new Error("Incorrect number of sealed components");
  }

  const encryptionSalt = parts[0]!;
  const encryptionIv = parts[1]!;
  const encryptedB64 = parts[2]!;
  const hmacSalt = parts[3]!;
  const hmac = parts[4]!;
  const macBaseString = `${encryptionSalt}*${encryptionIv}*${encryptedB64}`;

  const macOptions: GenerateKeyOptions = { ...integrity, salt: hmacSalt };
  const mac = await hmacWithPassword(password, macOptions, macBaseString);

  if (!fixedTimeComparison(mac.digest, hmac)) {
    throw new Error("Bad hmac value");
  }

  const decryptOptions: GenerateKeyOptions = {
    ...encryption,
    salt: encryptionSalt,
    iv: base64urlDecode(encryptionIv),
  };

  const encrypted = base64urlDecode(encryptedB64);
  const decrypted = await decrypt(password, decryptOptions, encrypted);

  return decrypted;
}
