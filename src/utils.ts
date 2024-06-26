import { seal, unseal } from "./iron-webcrypto/iron-webcrypto";

export type Cookie = Record<string, string>;
export type MaybeCookie = string | false;

type PartitionCookieConstraint =
  | { partition: true; secure: true }
  | { partition?: boolean; secure?: boolean }; // reset to default

export type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  secure?: boolean;
  signingSecret?: string;
  sameSite?: "Strict" | "Lax" | "None";
  partitioned?: boolean;
} & PartitionCookieConstraint;

const algorithm = { name: "HMAC", hash: "SHA-256" };

async function getCryptoKey(secret: string | BufferSource): Promise<CryptoKey> {
  const secretBuf =
    typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  return await crypto.subtle.importKey("raw", secretBuf, algorithm, false, [
    "sign",
    "verify",
  ]);
}

async function makeSignature(
  value: string,
  secret: string | BufferSource,
): Promise<string> {
  const key = await getCryptoKey(secret);
  const signature = await crypto.subtle.sign(
    algorithm.name,
    key,
    new TextEncoder().encode(value),
  );
  // the returned base64 encoded signature will always be 44 characters long and end with one or two equal signs
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifySignature(
  base64Signature: string,
  value: string,
  secret: CryptoKey,
): Promise<boolean> {
  try {
    const signatureBinStr = atob(base64Signature);
    const signature = new Uint8Array(signatureBinStr.length);
    for (let i = 0, len = signatureBinStr.length; i < len; i++) {
      signature[i] = signatureBinStr.charCodeAt(i);
    }
    return await crypto.subtle.verify(
      algorithm,
      secret,
      signature,
      new TextEncoder().encode(value),
    );
  } catch (e) {
    return false;
  }
}

// all alphanumeric chars and all of _!#$%&'*.^`|~+-
// (see: https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.1)
const validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;

// all ASCII chars 32-126 except 34, 59, and 92 (i.e. space to tilde but not double quote, semicolon, or backslash)
// (see: https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.1)
//
// note: the spec also prohibits comma and space, but we allow both since they are very common in the real world
// (see: https://github.com/golang/go/issues/7243)
const validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;

export function parse(cookie: string, name?: string): Cookie {
  const pairs = cookie.trim().split(";");
  return pairs.reduce((parsedCookie, pairStr) => {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      return parsedCookie;
    }

    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (
      (name && name !== cookieName) ||
      !validCookieNameRegEx.test(cookieName)
    ) {
      return parsedCookie;
    }

    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = decodeURIComponent(cookieValue);
    }

    return parsedCookie;
  }, {} as Cookie);
}

export async function parseSigned(
  cookie: string,
  secret: string | BufferSource,
  name?: string,
): Promise<Record<string, MaybeCookie>> {
  const parsedCookie: Record<string, MaybeCookie> = {};
  const secretKey = await getCryptoKey(secret);

  for (const [key, value] of Object.entries(parse(cookie, name))) {
    const signatureStartPos = value.lastIndexOf(".");
    if (signatureStartPos < 1) {
      continue;
    }

    const signedValue = value.substring(0, signatureStartPos);
    const signature = value.substring(signatureStartPos + 1);
    if (signature.length !== 44 || !signature.endsWith("=")) {
      continue;
    }

    const isVerified = await verifySignature(signature, signedValue, secretKey);
    parsedCookie[key] = isVerified ? signedValue : false;
  }

  return parsedCookie;
}

export async function parseSealed(
  cookie: string,
  secret: string,
  name?: string,
): Promise<Record<string, MaybeCookie>> {
  const parsedCookie: Record<string, MaybeCookie> = {};

  for (const [key, value] of Object.entries(parse(cookie, name))) {
    if (!value.includes("*")) {
      continue;
    }

    const decrypted = await unseal(value, secret).catch(() => false as false);
    parsedCookie[key] = decrypted;
  }

  return parsedCookie;
}
function _serialize(
  name: string,
  value: string,
  opt: CookieOptions = {},
): string {
  let cookie = `${name}=${value}`;

  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    cookie += `; Max-Age=${Math.floor(opt.maxAge)}`;
  }

  if (opt.domain) {
    cookie += `; Domain=${opt.domain}`;
  }

  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }

  if (opt.expires) {
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }

  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }

  if (opt.secure) {
    cookie += "; Secure";
  }

  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite}`;
  }

  if (opt.partitioned) {
    cookie += "; Partitioned";
  }

  return cookie;
}

export function serialize(
  name: string,
  value: string,
  opt: CookieOptions = {},
): string {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}

export async function serializeSigned(
  name: string,
  value: string,
  secret: string | BufferSource,
  opt: CookieOptions = {},
): Promise<string> {
  const signature = await makeSignature(value, secret);
  value = `${value}.${signature}`;
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}

export async function serializeSealed(
  name: string,
  value: string,
  secret: string,
  opt: CookieOptions = {},
): Promise<string> {
  value = await seal(value, secret);
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}
