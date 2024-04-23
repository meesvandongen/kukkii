/**
 * seal() method options.
 */
export interface SealOptionsSub {
  /**
   * The length of the salt (random buffer used to ensure that two identical objects will generate a different encrypted result). Defaults to 256.
   */
  saltBits: number;

  /**
   * The algorithm used. Defaults to 'aes-256-cbc' for encryption and 'sha256' for integrity.
   */
  algorithm: "aes-256-cbc" | "sha256";

  /**
   * The number of iterations used to derive a key from the password. Defaults to 1.
   */
  iterations: number;
}

/**
 * generateKey() method options.
 */
export type GenerateKeyOptions = Pick<
  SealOptionsSub,
  "algorithm" | "iterations"
> & {
  saltBits?: number | undefined;
  salt?: string | undefined;
  iv?: Uint8Array | undefined;
  hmac?: boolean | undefined;
};

/**
 * Generated internal key object.
 */
export interface Key {
  key: CryptoKey;
  salt: string;
  iv: Uint8Array;
}

/**
 * Generated HMAC internal results.
 */
export interface HMacResult {
  digest: string;
  salt: string;
}
